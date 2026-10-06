from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_optional_user, require_roles
from app.api.http import call_api, not_found
from app.api.listing import page_params, search_param
from app.core.roles import RoleCode
from app.models.auth import User
from app.models.enums import BusinessArea
from app.schemas.catalog import ServiceCreate, ServiceRead, ServiceUpdate
from app.schemas.common import Page
from app.services import catalog
from app.services.access import is_staff

router = APIRouter(prefix="/services", tags=["services"])
_staff = require_roles(RoleCode.ADMIN, RoleCode.STAFF)

_SORT = "Sort field. Prefix with - for descending. Allowed: name, slug, created_at, sort_order."


@router.get(
    "",
    response_model=Page[ServiceRead],
    summary="List services",
    description=(
        "Public callers receive published services only. Admin and staff also receive unpublished drafts. "
        "Deleted services are never returned. Each service includes its visible packages."
    ),
)
def list_services(
    page: Annotated[tuple[int, int], Depends(page_params)],
    q: Annotated[str | None, Depends(search_param)],
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
    sort: Annotated[str, Query(description=_SORT)] = "sort_order",
    business_area: Annotated[BusinessArea | None, Query(description="Filter by business area.")] = None,
    category_id: Annotated[UUID | None, Query(description="Filter by service category id.")] = None,
    is_published: Annotated[
        bool | None,
        Query(description="Admin and staff only. Public requests always return published services."),
    ] = None,
) -> Page[ServiceRead]:
    page_number, page_size = page
    items, total = call_api(
        lambda: catalog.list_services(
            session,
            staff=is_staff(user),
            page=page_number,
            page_size=page_size,
            q=q,
            sort=sort,
            business_area=business_area,
            category_id=category_id,
            is_published=is_published,
        )
    )
    return Page[ServiceRead](items=items, page=page_number, page_size=page_size, total=total)


@router.get(
    "/{slug}",
    response_model=ServiceRead,
    summary="Get a service by slug",
    description="Returns one service. Unpublished and deleted services are visible only to admin and staff, and deleted services are hidden from everyone.",
)
def get_service(
    slug: str,
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
) -> ServiceRead:
    service = catalog.get_service_by_slug(session, slug, staff=is_staff(user))
    if service is None:
        not_found()
    return service


@router.post(
    "",
    response_model=ServiceRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a service",
    description="Admin and staff only. A new service stays unpublished unless is_published is true, so it does not appear on public routes until it is published.",
)
def create_service(
    data: ServiceCreate,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> ServiceRead:
    return call_api(lambda: catalog.create_service(session, data))


@router.put(
    "/{service_id}",
    response_model=ServiceRead,
    summary="Update a service",
    description="Admin and staff only. Send only the fields that should change. The path uses the service id, not the slug.",
)
def update_service(
    service_id: UUID,
    data: ServiceUpdate,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> ServiceRead:
    service = call_api(lambda: catalog.update_service(session, service_id, data))
    if service is None:
        not_found()
    return service


@router.delete(
    "/{service_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a service",
    description="Admin and staff only. Soft-deletes the service and its packages. The record no longer appears on public or staff list routes.",
)
def delete_service(
    service_id: UUID,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> None:
    if not catalog.delete_service(session, service_id):
        not_found()
