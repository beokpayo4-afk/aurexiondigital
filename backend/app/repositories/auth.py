import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.roles import DEFAULT_ROLE_NAMES, RoleCode
from app.models.auth import PasswordResetToken, RefreshToken, Role, User, UserRole


def _user_query():
    return select(User).options(selectinload(User.roles).selectinload(UserRole.role))


def get_user_by_email(session: Session, email: str) -> User | None:
    return session.scalar(_user_query().where(User.email == email, User.deleted_at.is_(None)))


def get_user_by_id(session: Session, user_id: uuid.UUID) -> User | None:
    return session.scalar(_user_query().where(User.id == user_id, User.deleted_at.is_(None)))


def ensure_default_roles(session: Session) -> None:
    existing = set(session.scalars(select(Role.code).where(Role.deleted_at.is_(None))).all())
    for code, name in DEFAULT_ROLE_NAMES.items():
        if code.value not in existing:
            session.add(Role(code=code.value, name=name))
    session.flush()


def get_role(session: Session, code: RoleCode) -> Role:
    ensure_default_roles(session)
    role = session.scalar(select(Role).where(Role.code == code.value, Role.deleted_at.is_(None)))
    if role is None:
        raise RuntimeError(f"Role {code.value} is not available")
    return role


def add_refresh_token(session: Session, user_id: uuid.UUID, token_hash: str, expires_at: datetime) -> RefreshToken:
    row = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
    session.add(row)
    session.flush()
    return row


def get_refresh_token(session: Session, token_hash: str) -> RefreshToken | None:
    return session.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))


def revoke_refresh_tokens(session: Session, user_id: uuid.UUID, revoked_at: datetime) -> None:
    rows = session.scalars(
        select(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
    ).all()
    for row in rows:
        row.revoked_at = revoked_at


def add_password_reset_token(
    session: Session,
    user_id: uuid.UUID,
    token_hash: str,
    expires_at: datetime,
) -> PasswordResetToken:
    row = PasswordResetToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
    session.add(row)
    session.flush()
    return row


def get_password_reset_token(session: Session, token_hash: str) -> PasswordResetToken | None:
    return session.scalar(select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash))
