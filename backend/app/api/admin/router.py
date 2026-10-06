from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.api.http import call_api
from app.api.listing import page_params, search_param
from app.core.roles import RoleCode
from app.models.auth import User
from app.schemas.common import Page
from app.schemas.content_admin import ActivityRead, AdminSummary, PersonRead
from app.services import dashboard

router = APIRouter(prefix="/admin", tags=["admin"])
_staff = require_roles(RoleCode.ADMIN, RoleCode.STAFF)


@router.get(
    "/summary",
    response_model=AdminSummary,
    summary="Dashboard counts",
    description="Admin and staff only. Revenue is the sum of paid and fulfilled order totals when those orders share one currency.",
)
def summary(session: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(_staff)]) -> AdminSummary:
    return dashboard.build_summary(session)


@router.get("/staff", response_model=list[PersonRead], summary="List admin and staff accounts")
def staff(session: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(_staff)]) -> list[PersonRead]:
    return dashboard.list_staff(session)


@router.get("/customers", response_model=Page[PersonRead], summary="List customers")
def customers(
    page: Annotated[tuple[int, int], Depends(page_params)],
    q: Annotated[str | None, Depends(search_param)],
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
    sort: Annotated[str, Query()] = "full_name",
) -> Page[PersonRead]:
    items, total = call_api(
        lambda: dashboard.list_people(session, role_code=RoleCode.CUSTOMER.value, page=page[0], page_size=page[1], sort=sort, q=q)
    )
    return Page[PersonRead](items=items, page=page[0], page_size=page[1], total=total)


@router.get("/students", response_model=Page[PersonRead], summary="List students")
def students(
    page: Annotated[tuple[int, int], Depends(page_params)],
    q: Annotated[str | None, Depends(search_param)],
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
    sort: Annotated[str, Query()] = "full_name",
) -> Page[PersonRead]:
    items, total = call_api(
        lambda: dashboard.list_people(session, role_code=RoleCode.STUDENT.value, page=page[0], page_size=page[1], sort=sort, q=q)
    )
    return Page[PersonRead](items=items, page=page[0], page_size=page[1], total=total)


@router.get("/activity", response_model=Page[ActivityRead], summary="List activity logs")
def activity(
    page: Annotated[tuple[int, int], Depends(page_params)],
    q: Annotated[str | None, Depends(search_param)],
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
    sort: Annotated[str, Query()] = "-created_at",
) -> Page[ActivityRead]:
    items, total = call_api(lambda: dashboard.list_activity(session, page=page[0], page_size=page[1], sort=sort, q=q))
    return Page[ActivityRead](items=items, page=page[0], page_size=page[1], total=total)
