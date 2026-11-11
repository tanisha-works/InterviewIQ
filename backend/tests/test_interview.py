def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_start_session(auth_client):
    r = auth_client.post("/interview/start", json={"role": "python_developer", "num_questions": 3})
    assert r.status_code == 200 and len(r.json()["questions"]) == 3


def test_session_options_persist_and_filter_question_type(auth_client):
    response = auth_client.post(
        "/interview/start",
        json={
            "role": "python_developer",
            "num_questions": 5,
            "difficulty": "Hard",
            "interview_type": "Technical",
            "duration_minutes": 30,
        },
    )
    assert response.status_code == 200
    session = response.json()
    assert session["difficulty"] == "Hard"
    assert session["interview_type"] == "Technical"
    assert session["duration_minutes"] == 30
    assert len(session["questions"]) == 5
    assert all(question["category"] == "technical" for question in session["questions"])

    fetched = auth_client.get(f"/interview/{session['id']}").json()
    assert fetched["interview_type"] == "Technical"
    assert fetched["duration_minutes"] == 30
    listed = auth_client.get("/interview").json()[0]
    assert listed["difficulty"] == "Hard"
    assert listed["interview_type"] == "Technical"
    report = auth_client.get(f"/evaluation/session/{session['id']}").json()
    assert report["difficulty"] == "Hard"
    assert report["duration_minutes"] == 30


def test_bad_audio_format(auth_client):
    sid = auth_client.post("/interview/start", json={}).json()["id"]
    r = auth_client.post(f"/interview/{sid}/answer", data={"question_id": "x"}, files={"audio": ("a.txt", b"hi", "text/plain")})
    assert r.status_code == 400


def test_unknown_session(auth_client):
    assert auth_client.get("/interview/999").status_code == 404


def test_list_interviews_is_scoped_to_authenticated_user(client):
    owner = client.post(
        "/auth/signup",
        json={"name": "Session Owner", "email": "session-owner@example.com", "password": "Correct-Horse-42"},
        headers={"Origin": "http://localhost:5173"},
    ).json()
    owner_headers = {"Authorization": f"Bearer {owner['access_token']}"}
    created = client.post("/interview/start", json={"role": "python_developer", "num_questions": 3}, headers=owner_headers)
    assert created.status_code == 200

    listed = client.get("/interview", headers=owner_headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    summary = listed.json()[0]
    assert summary["id"] == created.json()["id"]
    assert summary["answered"] == 0
    assert summary["total_questions"] == 3

    other = client.post(
        "/auth/signup",
        json={"name": "Other Candidate", "email": "other-candidate@example.com", "password": "Correct-Horse-42"},
        headers={"Origin": "http://localhost:5173"},
    ).json()
    assert client.get("/interview", headers={"Authorization": f"Bearer {other['access_token']}"}).json() == []


def test_interview_endpoints_require_authentication(client):
    assert client.post("/interview/start", json={}).status_code == 401
    assert client.get("/interview/1").status_code == 401
    assert client.get("/interview").status_code == 401
