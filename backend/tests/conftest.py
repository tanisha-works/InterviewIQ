import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("JWT_SECRET", "test-only-secret-key-with-at-least-32-bytes")
os.environ.setdefault("AUTH_COOKIE_SECURE", "false")

from app.database import Base, get_db
from app.main import app


@pytest.fixture()
def test_session_factory():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine)
    yield TestSession
    engine.dispose()


@pytest.fixture()
def client(test_session_factory):
    def override():
        with test_session_factory() as db:
            yield db

    app.dependency_overrides[get_db] = override
    test_client = TestClient(app)
    test_client.test_session_factory = test_session_factory
    yield test_client  # not used as context manager -> ML models are not loaded
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_client(client):
    response = client.post(
        "/auth/signup",
        json={"name": "Test Candidate", "email": "candidate@example.com", "password": "Correct-Horse-42"},
        headers={"Origin": "http://localhost:5173"},
    )
    assert response.status_code == 201
    client.headers.update({"Authorization": f"Bearer {response.json()['access_token']}"})
    return client
