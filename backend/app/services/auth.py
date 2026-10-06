import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.roles import RoleCode
from app.core.security import create_access_token, hash_password, hash_token, new_secret_token, verify_password
from app.core.config import settings
from app.models.auth import User
from app.repositories import auth as auth_repo
from app.schemas.auth import AuthResponse, UserPublic

INVALID_CREDENTIALS = "Invalid email or password"
RESET_SENT = "If an account exists for that email, password reset instructions have been sent."
RESET_INVALID = "Invalid or expired reset token."


class AuthError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class PasswordResetNotifier:
    def send(self, email: str, token: str) -> None:
        return None


def normalize_email(email: str) -> str:
    return email.strip().lower()


def public_user(user: User) -> UserPublic:
    roles = sorted(link.role.code for link in user.roles if link.role.deleted_at is None)
    return UserPublic(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        roles=roles,
    )


def _issue_session(session: Session, user: User) -> AuthResponse:
    raw_refresh = new_secret_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    auth_repo.add_refresh_token(session, user.id, hash_token(raw_refresh), expires_at)
    session.commit()
    session.refresh(user)
    user = auth_repo.get_user_by_id(session, user.id) or user
    return AuthResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=raw_refresh,
        expires_in=settings.access_token_expire_minutes * 60,
        user=public_user(user),
    )


def register_user(
    session: Session,
    *,
    email: str,
    password: str,
    full_name: str,
    phone: str | None,
) -> AuthResponse:
    normalized = normalize_email(email)
    if auth_repo.get_user_by_email(session, normalized) is not None:
        raise AuthError(409, "An account with that email already exists")
    role = auth_repo.get_role(session, RoleCode.CUSTOMER)
    user = User(
        email=normalized,
        password_hash=hash_password(password),
        full_name=full_name.strip(),
        phone=phone.strip() if phone else None,
        is_active=True,
    )
    user.roles.append(_link(role))
    session.add(user)
    try:
        session.flush()
    except IntegrityError as exc:
        session.rollback()
        raise AuthError(409, "An account with that email already exists") from exc
    return _issue_session(session, user)


def _link(role):
    from app.models.auth import UserRole

    return UserRole(role=role)


def create_user_with_role(
    session: Session,
    *,
    email: str,
    password: str,
    full_name: str,
    role: RoleCode,
) -> User:
    normalized = normalize_email(email)
    role_row = auth_repo.get_role(session, role)
    user = User(
        email=normalized,
        password_hash=hash_password(password),
        full_name=full_name.strip(),
        is_active=True,
    )
    user.roles.append(_link(role_row))
    session.add(user)
    session.commit()
    loaded = auth_repo.get_user_by_id(session, user.id)
    if loaded is None:
        raise AuthError(500, "Could not create the account")
    return loaded


_DUMMY_PASSWORD_HASH = hash_password("aurexion-timing-placeholder")


def authenticate(session: Session, *, email: str, password: str) -> AuthResponse:
    user = auth_repo.get_user_by_email(session, normalize_email(email))
    if user is None or not user.is_active:
        verify_password(password, _DUMMY_PASSWORD_HASH)
        raise AuthError(401, INVALID_CREDENTIALS)
    if not verify_password(password, user.password_hash):
        raise AuthError(401, INVALID_CREDENTIALS)
    return _issue_session(session, user)


def refresh_session(session: Session, raw_token: str) -> AuthResponse:
    now = datetime.now(timezone.utc)
    row = auth_repo.get_refresh_token(session, hash_token(raw_token))
    if row is None:
        raise AuthError(401, "Invalid refresh token")
    if row.revoked_at is not None:
        auth_repo.revoke_refresh_tokens(session, row.user_id, now)
        session.commit()
        raise AuthError(401, "Invalid refresh token")
    if row.expires_at <= now:
        raise AuthError(401, "Invalid refresh token")
    user = auth_repo.get_user_by_id(session, row.user_id)
    if user is None or not user.is_active:
        raise AuthError(401, "Invalid refresh token")
    row.revoked_at = now
    return _issue_session(session, user)


def logout(session: Session, raw_token: str | None) -> None:
    if not raw_token:
        return
    row = auth_repo.get_refresh_token(session, hash_token(raw_token))
    if row is not None and row.revoked_at is None:
        row.revoked_at = datetime.now(timezone.utc)
        session.commit()


def request_password_reset(session: Session, email: str, notifier: PasswordResetNotifier) -> None:
    user = auth_repo.get_user_by_email(session, normalize_email(email))
    if user is None or not user.is_active:
        return
    raw = new_secret_token()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.password_reset_expire_minutes)
    auth_repo.add_password_reset_token(session, user.id, hash_token(raw), expires_at)
    session.commit()
    notifier.send(user.email, raw)


def reset_password(session: Session, raw_token: str, new_password: str) -> None:
    now = datetime.now(timezone.utc)
    row = auth_repo.get_password_reset_token(session, hash_token(raw_token))
    if row is None or row.used_at is not None or row.expires_at <= now:
        raise AuthError(400, RESET_INVALID)
    user = auth_repo.get_user_by_id(session, row.user_id)
    if user is None or not user.is_active:
        raise AuthError(400, RESET_INVALID)
    user.password_hash = hash_password(new_password)
    row.used_at = now
    auth_repo.revoke_refresh_tokens(session, user.id, now)
    session.commit()


def get_active_user(session: Session, user_id: uuid.UUID) -> User:
    user = auth_repo.get_user_by_id(session, user_id)
    if user is None or not user.is_active:
        raise AuthError(401, "Authentication required")
    return user
