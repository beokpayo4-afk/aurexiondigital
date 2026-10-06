import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, VerifyMismatchError

from app.core.config import settings

_password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError):
        return False


def create_access_token(subject: str, expires_minutes: int | None = None) -> str:
    issued_at = datetime.now(timezone.utc)
    ttl = settings.access_token_expire_minutes if expires_minutes is None else expires_minutes
    payload: dict[str, Any] = {
        "sub": subject,
        "type": "access",
        "iat": issued_at,
        "exp": issued_at + timedelta(minutes=ttl),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def new_secret_token() -> str:
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def decode_access_token(token: str) -> dict[str, Any]:
    decoded = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
    if not isinstance(decoded, dict):
        raise jwt.InvalidTokenError("Token payload is invalid")
    return decoded
