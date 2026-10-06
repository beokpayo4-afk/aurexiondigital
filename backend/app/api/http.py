from collections.abc import Callable
from typing import TypeVar

from fastapi import HTTPException

from app.services.api_error import ApiError

T = TypeVar("T")


def not_found() -> None:
    raise HTTPException(status_code=404, detail="Not found")


def call_api(func: Callable[[], T]) -> T:
    try:
        return func()
    except ApiError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
