import uuid
from collections.abc import Callable, Generator
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.roles import RoleCode
from app.core.security import decode_access_token
from app.models.auth import User
from app.services.auth import AuthError, get_active_user

_bearer = HTTPBearer(auto_error=False)


def get_db() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def get_current_subject(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> str:
    payload = _access_payload(credentials)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token")
    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject:
        raise HTTPException(status_code=401, detail="Invalid token")
    return subject


def get_optional_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    session: Annotated[Session, Depends(get_db)],
) -> User | None:
    """Return the caller when a bearer token is present.

    A missing token is anonymous. An invalid token is still rejected.
    """
    if credentials is None:
        return None
    return get_current_user(credentials, session)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    session: Annotated[Session, Depends(get_db)],
) -> User:
    payload = _access_payload(credentials)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token")
    subject = payload.get("sub")
    try:
        user_id = uuid.UUID(subject) if isinstance(subject, str) else None
    except ValueError:
        user_id = None
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    try:
        return get_active_user(session, user_id)
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


def require_roles(*allowed: RoleCode | str) -> Callable[..., User]:
    allowed_codes = {role.value if isinstance(role, RoleCode) else role for role in allowed}

    def checker(user: Annotated[User, Depends(get_current_user)]) -> User:
        held = {link.role.code for link in user.roles if link.role.deleted_at is None}
        if allowed_codes and held.isdisjoint(allowed_codes):
            raise HTTPException(status_code=403, detail="You do not have access to this resource")
        return user

    return checker


def _access_payload(credentials: HTTPAuthorizationCredentials | None) -> dict:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        return decode_access_token(credentials.credentials)
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
