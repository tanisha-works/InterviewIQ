from io import BytesIO

from pypdf import PdfWriter

from app.config import settings
from app.services.resume_services import extract_skills


def test_extract_skills():
    s = extract_skills("Built APIs with Python, FastAPI and PostgreSQL. Also C++ and SQL.")
    assert {"python", "fastapi", "postgresql", "c++", "sql"} <= set(s)


def test_non_pdf_rejected(auth_client):
    r = auth_client.post("/resume/upload", files={"file": ("cv.txt", b"hello", "text/plain")})
    assert r.status_code == 400


def test_pdf_upload_returns_resume_id(auth_client):
    pdf = BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(width=72, height=72)
    writer.write(pdf)

    response = auth_client.post(
        "/resume/upload",
        files={"file": ("resume.pdf", pdf.getvalue(), "application/pdf")},
    )

    assert response.status_code == 200
    assert response.json()["id"] > 0
    assert response.json()["filename"] == "resume.pdf"


def test_resume_endpoints_require_authentication(client):
    assert client.post("/resume/upload", files={"file": ("cv.pdf", b"pdf", "application/pdf")}).status_code == 401
    assert client.get("/resume/1").status_code == 401


def test_resume_is_private_to_owner(client):
    first = client.post(
        "/auth/signup",
        json={"name": "First User", "email": "first@example.com", "password": "Correct-Horse-42"},
        headers={"Origin": "http://localhost:5173"},
    ).json()
    client.headers.update({"Authorization": f"Bearer {first['access_token']}"})
    pdf = BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(width=72, height=72)
    writer.write(pdf)
    resume = client.post("/resume/upload", files={"file": ("first.pdf", pdf.getvalue(), "application/pdf")}).json()

    second = client.post(
        "/auth/signup",
        json={"name": "Second User", "email": "second@example.com", "password": "Correct-Horse-42"},
        headers={"Origin": "http://localhost:5173"},
    ).json()
    client.headers.update({"Authorization": f"Bearer {second['access_token']}"})
    assert client.get(f"/resume/{resume['id']}").status_code == 404
    assert client.post("/interview/start", json={"resume_id": resume["id"]}).status_code == 404


def test_delete_resume_is_owner_scoped_and_detaches_sessions(auth_client):
    pdf = BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(width=72, height=72)
    writer.write(pdf)
    uploaded = auth_client.post(
        "/resume/upload", files={"file": ("delete.pdf", pdf.getvalue(), "application/pdf")}
    ).json()
    session = auth_client.post("/interview/start", json={"resume_id": uploaded["id"]}).json()

    removed = auth_client.delete(f"/resume/{uploaded['id']}")
    assert removed.status_code == 204
    assert auth_client.get(f"/resume/{uploaded['id']}").status_code == 404
    assert auth_client.get(f"/interview/{session['id']}").status_code == 200

    with auth_client.test_session_factory() as db:
        from app.models import InterviewSession

        assert db.get(InterviewSession, session["id"]).resume_id is None


def test_cors_allows_configured_origin(client):
    origin = settings.cors_origins.split(",")[0].strip()
    response = client.options(
        "/resume/upload",
        headers={"Origin": origin, "Access-Control-Request-Method": "POST"},
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
