import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password, verify_password
from app.core.web import public_url, storage_key
from app.main import app

client = TestClient(app)


def test_password_hash_round_trip() -> None:
    password_hash = hash_password("correct-horse")
    assert verify_password("correct-horse", password_hash)
    assert not verify_password("wrong-horse", password_hash)


def test_session_accepts_access_token() -> None:
    token = create_access_token("user-1")
    response = client.get("/api/v1/auth/session", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json() == {"subject": "user-1"}
    assert response.headers["x-content-type-options"] == "nosniff"


def test_public_urls_and_storage_keys_reject_escape_paths() -> None:
    assert public_url("https://example.com/demo") == "https://example.com/demo"
    assert public_url("/hero.jpg") == "/hero.jpg"
    with pytest.raises(ValueError):
        public_url("javascript:alert(1)")
    with pytest.raises(ValueError):
        public_url("//example.com")
    with pytest.raises(ValueError):
        storage_key("../private/file")
    assert storage_key("courses/starter.pdf") == "courses/starter.pdf"
