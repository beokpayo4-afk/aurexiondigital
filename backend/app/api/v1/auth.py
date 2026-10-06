from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_current_subject
from app.schemas.auth import SessionResponse

router = APIRouter()


@router.get("/auth/session", response_model=SessionResponse)
def session(subject: Annotated[str, Depends(get_current_subject)]) -> SessionResponse:
    return SessionResponse(subject=subject)
