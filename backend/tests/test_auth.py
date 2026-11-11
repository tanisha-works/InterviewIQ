from app.models import Answer, AuthRefreshToken, AuthSession, User


def signup(client, name="Test Candidate", email="candidate@example.com"):
    return client.post(
        "/auth/signup",
        json={"name": name, "email": email, "password": "Correct-Horse-42"},
        headers={"Origin": "http://localhost:5173"},
    )


def test_signup_hashes_password_and_returns_current_user(client):
    response = signup(client)
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "candidate@example.com"
    assert "password" not in body["user"]
    assert "interviewiq_refresh" not in body
    assert client.cookies.get("interviewiq_refresh")
    assert client.cookies.get("interviewiq_csrf")

    with client.test_session_factory() as db:
        user = db.query(User).filter_by(email="candidate@example.com").one()
        auth_session = db.query(AuthSession).one()
        refresh_record = db.query(AuthRefreshToken).one()
        assert user.password_hash.startswith("$argon2id$")
        assert user.password_hash != "Correct-Horse-42"
        assert auth_session.refresh_token_hash == refresh_record.token_hash
        assert auth_session.refresh_token_hash != client.cookies.get("interviewiq_refresh")

    current = client.get("/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert current.status_code == 200
    assert current.json()["id"] == body["user"]["id"]


def test_signup_rejects_duplicate_and_login_checks_password(client):
    assert signup(client).status_code == 201
    duplicate = signup(client, email="CANDIDATE@example.com")
    assert duplicate.status_code == 409

    wrong = client.post(
        "/auth/login",
        json={"email": "candidate@example.com", "password": "wrong-pass"},
        headers={"Origin": "http://localhost:5173"},
    )
    assert wrong.status_code == 401

    login = client.post(
        "/auth/login",
        json={"email": "CANDIDATE@example.com", "password": "Correct-Horse-42"},
        headers={"Origin": "http://localhost:5173"},
    )
    assert login.status_code == 200
    assert login.json()["user"]["email"] == "candidate@example.com"


def test_login_rejects_invalid_password(client):
    signup(client)
    response = client.post(
        "/auth/login",
        json={"email": "candidate@example.com", "password": "Wrong-Horse-42"},
        headers={"Origin": "http://localhost:5173"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


def test_profile_update_is_authenticated_and_normalizes_email(auth_client):
    response = auth_client.patch("/users/me", json={"name": " Updated Candidate ", "email": "UPDATED@example.com"})
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Candidate"
    assert response.json()["email"] == "updated@example.com"


def test_profile_email_conflict_and_authentication(client):
    signup(client, name="First", email="profile-first@example.com")
    first = client.post(
        "/auth/login",
        json={"email": "profile-first@example.com", "password": "Correct-Horse-42"},
        headers={"Origin": "http://localhost:5173"},
    ).json()
    signup(client, name="Second", email="profile-second@example.com")
    response = client.patch(
        "/users/me",
        json={"name": "First", "email": "profile-second@example.com"},
        headers={"Authorization": f"Bearer {first['access_token']}"},
    )
    assert response.status_code == 409
    assert client.patch("/users/me", json={"name": "No Auth", "email": "no-auth@example.com"}).status_code == 401


def test_refresh_rotates_tokens_and_reuse_revokes_session(client):
    login = signup(client).json()
    old_refresh = client.cookies.get("interviewiq_refresh")
    old_csrf = client.cookies.get("interviewiq_csrf")
    headers = {"Origin": "http://localhost:5173", "X-CSRF-Token": old_csrf}

    refreshed = client.post("/auth/refresh", headers=headers)
    assert refreshed.status_code == 200
    assert refreshed.json()["access_token"] != login["access_token"]
    assert client.cookies.get("interviewiq_refresh") != old_refresh

    client.cookies.clear()
    client.cookies.set("interviewiq_refresh", old_refresh, path="/auth")
    client.cookies.set("interviewiq_csrf", old_csrf, path="/auth")
    replay = client.post("/auth/refresh", headers=headers)
    assert replay.status_code == 401
    assert "reuse" in replay.json()["detail"]
    assert client.get(
        "/auth/me", headers={"Authorization": f"Bearer {refreshed.json()['access_token']}"}
    ).status_code == 401


def test_refresh_requires_valid_origin_and_csrf(client):
    signup(client)
    csrf = client.cookies.get("interviewiq_csrf")
    bad_origin = client.post("/auth/refresh", headers={"Origin": "https://attacker.example", "X-CSRF-Token": csrf})
    assert bad_origin.status_code == 403
    bad_csrf = client.post(
        "/auth/refresh",
        headers={"Origin": "http://localhost:5173", "X-CSRF-Token": "wrong"},
    )
    assert bad_csrf.status_code == 403


def test_logout_revokes_session_and_clears_cookies(client):
    response = signup(client).json()
    csrf = client.cookies.get("interviewiq_csrf")
    logout = client.post(
        "/auth/logout",
        headers={
            "Origin": "http://localhost:5173",
            "X-CSRF-Token": csrf,
        },
    )
    assert logout.status_code == 204
    assert client.get("/auth/me", headers={"Authorization": f"Bearer {response['access_token']}"}).status_code == 401
    assert client.cookies.get("interviewiq_refresh") is None


def test_other_user_cannot_access_interview_or_evaluation(client):
    owner = signup(client, "Owner", "owner@example.com").json()
    owner_headers = {"Authorization": f"Bearer {owner['access_token']}"}
    session = client.post("/interview/start", json={}, headers=owner_headers).json()
    with client.test_session_factory() as db:
        answer = Answer(
            session_id=session["id"],
            question_id=session["questions"][0]["id"],
            question_text=session["questions"][0]["question"],
            transcript="A test answer.",
            metrics={},
            scores={},
            overall_score=50,
            feedback=[],
        )
        db.add(answer)
        db.commit()
        answer_id = answer.id

    other = signup(client, "Other", "other@example.com").json()
    other_headers = {"Authorization": f"Bearer {other['access_token']}"}
    session_id = session["id"]
    assert client.get(f"/interview/{session_id}", headers=other_headers).status_code == 404
    assert client.get(f"/evaluation/session/{session_id}", headers=other_headers).status_code == 404
    assert client.get(f"/evaluation/answer/{answer_id}", headers=other_headers).status_code == 404
    answer_response = client.post(
        f"/interview/{session_id}/answer",
        headers=other_headers,
        data={"question_id": session["questions"][0]["id"]},
        files={"audio": ("answer.webm", b"not processed because the session is not owned", "audio/webm")},
    )
    assert answer_response.status_code == 404