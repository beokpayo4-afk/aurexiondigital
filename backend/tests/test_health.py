from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "Aurexion Digital API"
    assert response.headers["X-Request-ID"]


def test_session_requires_token() -> None:
    response = client.get("/api/v1/auth/session")
    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication required",
        "code": "unauthorized",
    }
