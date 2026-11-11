from app.services import interview_service


def test_report_empty_session(auth_client):
    sid = auth_client.post("/interview/start", json={"num_questions": 2}).json()["id"]
    r = auth_client.get(f"/evaluation/session/{sid}").json()
    assert r["answered"] == 0 and r["total_questions"] == 2 and r["average_score"] == 0


def test_report_is_available_immediately_after_answer_submission(auth_client, monkeypatch):
    monkeypatch.setattr(
        interview_service,
        "transcribe",
        lambda _path: {
            "text": "During the project I built a solution and improved the result.",
            "words": [
                {"word": "During", "start": 0.0, "end": 0.3},
                {"word": "the", "start": 0.31, "end": 0.45},
                {"word": "project", "start": 0.46, "end": 0.8},
                {"word": "I", "start": 0.81, "end": 0.9},
                {"word": "built", "start": 0.91, "end": 1.2},
                {"word": "a", "start": 1.21, "end": 1.3},
                {"word": "solution", "start": 1.31, "end": 1.7},
                {"word": "today", "start": 1.71, "end": 2.0},
            ],
            "duration": 2.0,
            "language": "en",
        },
    )
    monkeypatch.setattr(
        interview_service,
        "evaluate_text",
        lambda _text, _question: {
            "fillers": {"total": 0, "per_100_words": 0.0, "breakdown": {}},
            "relevance_similarity": 0.6,
            "relevance_score": 75.0,
            "star": {"present": {"situation": True, "task": True, "action": True, "result": True}, "score": 100.0},
            "concepts": {"matched": [], "missing": [], "coverage": None},
        },
    )
    session = auth_client.post("/interview/start", json={"num_questions": 1}).json()
    answer_response = auth_client.post(
        f"/interview/{session['id']}/answer",
        data={"question_id": session["questions"][0]["id"]},
        files={"audio": ("answer.wav", b"a" * 3000, "audio/wav")},
    )
    assert answer_response.status_code == 200

    report_response = auth_client.get(f"/evaluation/session/{session['id']}")
    assert report_response.status_code == 200
    assert "no-store" in report_response.headers["cache-control"]
    report = report_response.json()
    assert report["answered"] == 1
    assert report["answers"][0]["id"] == answer_response.json()["id"]
    assert report["answers"][0]["transcript"]


def test_missing_answer(auth_client):
    assert auth_client.get("/evaluation/answer/1").status_code == 404


def test_evaluation_endpoints_require_authentication(client):
    assert client.get("/evaluation/session/1").status_code == 401
    assert client.get("/evaluation/answer/1").status_code == 401
