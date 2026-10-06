from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.rate_limit import limit_auth
from app.core.config import settings
from app.models.auth import User
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UserPublic,
)
from app.services.auth import (
    RESET_SENT,
    AuthError,
    PasswordResetNotifier,
    authenticate,
    logout,
    public_user,
    refresh_session,
    register_user,
    request_password_reset,
    reset_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])
REFRESH_COOKIE = "refresh_token"


def get_password_reset_notifier() -> PasswordResetNotifier:
    return PasswordResetNotifier()


def _raise(exc: AuthError) -> None:
    from fastapi import HTTPException

    raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        httponly=True,
        secure=settings.environment.lower() == "production",
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path="/api/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=REFRESH_COOKIE, path="/api/auth")


def _token_from_request(body_token: str | None, request: Request) -> str | None:
    if body_token:
        return body_token
    cookie = request.cookies.get(REFRESH_COOKIE)
    return cookie or None


@router.post("/register", response_model=AuthResponse, status_code=201, dependencies=[Depends(limit_auth)])
def register(
    payload: RegisterRequest,
    response: Response,
    session: Annotated[Session, Depends(get_db)],
) -> AuthResponse:
    try:
        result = register_user(
            session,
            email=str(payload.email),
            password=payload.password,
            full_name=payload.full_name,
            phone=payload.phone,
        )
    except AuthError as exc:
        _raise(exc)
    _set_refresh_cookie(response, result.refresh_token)
    return result


@router.post("/login", response_model=AuthResponse, dependencies=[Depends(limit_auth)])
def login(
    payload: LoginRequest,
    response: Response,
    session: Annotated[Session, Depends(get_db)],
) -> AuthResponse:
    try:
        result = authenticate(session, email=str(payload.email), password=payload.password)
    except AuthError as exc:
        _raise(exc)
    _set_refresh_cookie(response, result.refresh_token)
    return result


@router.post("/refresh", response_model=AuthResponse, dependencies=[Depends(limit_auth)])
def refresh(
    request: Request,
    response: Response,
    session: Annotated[Session, Depends(get_db)],
    payload: RefreshRequest | None = None,
) -> AuthResponse:
    raw = _token_from_request(None if payload is None else payload.refresh_token, request)
    if not raw:
        _raise(AuthError(401, "Invalid refresh token"))
    try:
        result = refresh_session(session, raw)
    except AuthError as exc:
        _raise(exc)
    _set_refresh_cookie(response, result.refresh_token)
    return result


@router.post("/logout", status_code=204)
def logout_session(
    request: Request,
    response: Response,
    session: Annotated[Session, Depends(get_db)],
    payload: LogoutRequest | None = None,
) -> None:
    raw = _token_from_request(None if payload is None else payload.refresh_token, request)
    logout(session, raw)
    _clear_refresh_cookie(response)


@router.get("/me", response_model=UserPublic)
def me(user: Annotated[User, Depends(get_current_user)]) -> UserPublic:
    return public_user(user)


@router.post("/forgot-password", response_model=MessageResponse, dependencies=[Depends(limit_auth)])
def forgot_password(
    payload: ForgotPasswordRequest,
    session: Annotated[Session, Depends(get_db)],
    notifier: Annotated[PasswordResetNotifier, Depends(get_password_reset_notifier)],
) -> MessageResponse:
    request_password_reset(session, str(payload.email), notifier)
    return MessageResponse(detail=RESET_SENT, code="reset_requested")


@router.post("/reset-password", response_model=MessageResponse, dependencies=[Depends(limit_auth)])
def reset_password_route(
    payload: ResetPasswordRequest,
    session: Annotated[Session, Depends(get_db)],
) -> MessageResponse:
    try:
        reset_password(session, payload.token, payload.password)
    except AuthError as exc:
        _raise(exc)
    return MessageResponse(detail="Password has been reset.", code="password_reset")
