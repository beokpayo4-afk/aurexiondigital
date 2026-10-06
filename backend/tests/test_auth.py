import uuid
from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.auth.router import get_password_reset_notifier
from app.api.deps import get_db, require_roles
from app.core.database import SessionLocal
from app.core.roles import RoleCode
from app.main import app
from app.middleware.errors import register_exception_handlers
from app.models.auth import User
from app.services.auth import PasswordResetNotifier, create_user_with_role

client = TestClient(app)


class CaptureNotifier(PasswordResetNotifier):
    def __init__(self) -> None:
        self.sent: dict[str, str] = {}

    def send(self, email: str, token: str) -> None:
        self.sent[email] = token


def _email(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4()}@example.com"


def _delete_user(email: str) -> None:
    with SessionLocal() as session:
        session.execute(text("DELETE FROM users WHERE email = :email"), {"email": email.lower()})
        session.commit()


def test_registration_creates_customer_and_hides_password() -> None:
    email = _email("register")
    try:
        response = client.post(
            "/api/auth/register",
            json={"email": email, "password": "correct-horse", "full_name": "Aurexion Customer"},
        )
        assert response.status_code == 201
        body = response.json()
        assert body["token_type"] == "bearer"
        assert body["access_token"]
        assert body["refresh_token"]
        assert body["user"]["email"] == email.lower()
        assert body["user"]["roles"] == ["CUSTOMER"]
        assert "password" not in body["user"]
        assert "password_hash" not in response.text
        assert "argon2" not in response.text
    finally:
        _delete_user(email)


def test_login_and_invalid_password() -> None:
    email = _email("login")
    password = "correct-horse"
    try:
        created = client.post(
            "/api/auth/register",
            json={"email": email, "password": password, "full_name": "Login User"},
        )
        assert created.status_code == 201
        success = client.post("/api/auth/login", json={"email": email, "password": password})
        failure = client.post("/api/auth/login", json={"email": email, "password": "wrong-horse"})
        unknown = client.post("/api/auth/login", json={"email": _email("missing"), "password": "wrong-horse"})
        assert success.status_code == 200
        assert success.json()["user"]["email"] == email.lower()
        assert failure.status_code == 401
        assert unknown.status_code == 401
        assert failure.json() == unknown.json()
        assert failure.json()["detail"] == "Invalid email or password"
    finally:
        _delete_user(email)


def test_protected_route_requires_access_token() -> None:
    email = _email("me")
    try:
        anonymous = client.get("/api/auth/me")
        assert anonymous.status_code == 401
        registered = client.post(
            "/api/auth/register",
            json={"email": email, "password": "correct-horse", "full_name": "Me User"},
        )
        token = registered.json()["access_token"]
        me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200
        assert me.json()["email"] == email.lower()
        assert "password_hash" not in me.text
    finally:
        _delete_user(email)


def test_role_authorization() -> None:
    customer_email = _email("customer")
    admin_email = _email("admin")
    try:
        customer = client.post(
            "/api/auth/register",
            json={"email": customer_email, "password": "correct-horse", "full_name": "Customer"},
        )
        with SessionLocal() as session:
            admin = create_user_with_role(
                session,
                email=admin_email,
                password="correct-horse",
                full_name="Admin",
                role=RoleCode.ADMIN,
            )
            admin_id = admin.id
        admin_login = client.post("/api/auth/login", json={"email": admin_email, "password": "correct-horse"})
        application = FastAPI()
        register_exception_handlers(application)

        @application.get("/admin-only")
        def admin_only(user: Annotated[User, Depends(require_roles(RoleCode.ADMIN))]) -> dict[str, str]:
            return {"email": user.email}

        with TestClient(application) as local:
            denied = local.get(
                "/admin-only",
                headers={"Authorization": f"Bearer {customer.json()['access_token']}"},
            )
            allowed = local.get(
                "/admin-only",
                headers={"Authorization": f"Bearer {admin_login.json()['access_token']}"},
            )
        assert denied.status_code == 403
        assert allowed.status_code == 200
        assert allowed.json()["email"] == admin_email.lower()
        assert admin_id is not None
    finally:
        _delete_user(customer_email)
        _delete_user(admin_email)


def test_refresh_logout_and_password_reset() -> None:
    email = _email("reset")
    notifier = CaptureNotifier()
    app.dependency_overrides[get_password_reset_notifier] = lambda: notifier
    try:
        registered = client.post(
            "/api/auth/register",
            json={"email": email, "password": "correct-horse", "full_name": "Reset User"},
        )
        refresh = client.post("/api/auth/refresh", json={"refresh_token": registered.json()["refresh_token"]})
        assert refresh.status_code == 200
        logout = client.post("/api/auth/logout", json={"refresh_token": refresh.json()["refresh_token"]})
        assert logout.status_code == 204
        reused = client.post("/api/auth/refresh", json={"refresh_token": refresh.json()["refresh_token"]})
        assert reused.status_code == 401

        forgot = client.post("/api/auth/forgot-password", json={"email": email})
        missing = client.post("/api/auth/forgot-password", json={"email": _email("nobody")})
        assert forgot.status_code == 200
        assert forgot.json() == missing.json()
        token = notifier.sent[email.lower()]
        reset = client.post("/api/auth/reset-password", json={"token": token, "password": "new-password"})
        assert reset.status_code == 200
        old_login = client.post("/api/auth/login", json={"email": email, "password": "correct-horse"})
        new_login = client.post("/api/auth/login", json={"email": email, "password": "new-password"})
        assert old_login.status_code == 401
        assert new_login.status_code == 200
    finally:
        app.dependency_overrides.pop(get_password_reset_notifier, None)
        _delete_user(email)


def test_get_db_yields_a_session() -> None:
    generator = get_db()
    session = next(generator)
    assert isinstance(session, Session)
    generator.close()
