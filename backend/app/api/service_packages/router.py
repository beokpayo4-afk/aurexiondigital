from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_optional_user, require_roles
from app.api.http import call_api, not_found
from app.api.listing import page_params, search_param
from app.core.roles import RoleCode
from app.models.auth import User
from app.models.enums import BillingPeriod
from app.schemas.catalog import ServicePackageCreate, ServicePackageRead, ServicePackageUpdate
from app.schemas.common import Page
from app.services import catalog
from app.services.access import is_staff

router = APIRouter(prefix="/service-packages", tags=["service-packages"])
_staff = require_roles(RoleCode.ADMIN, RoleCode.STAFF)

_SORT = "Sort field. Prefix with - for descending. Allowed: name, slug, created_at, sort_order, price_amount."


@router.get(
    "",
    response_model=Page[ServicePackageRead],
    summary="List service packages",
    description=(
        "Public callers receive published packages whose parent service is also published. "
        "Admin and staff can also see unpublished packages. Deleted packages and packages on deleted services are omitted."
    ),
)
def list_packages(
    page: Annotated[tuple[int, int], Depends(page_params)],
    q: Annotated[str | None, Depends(search_param)],
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
    sort: Annotated[str, Query(description=_SORT)] = "sort_order",
    service_id: Annotated[UUID | None, Query(description="Filter by parent service id.")] = None,
    billing_period: Annotated[BillingPeriod | None, Query(description="Filter by billing period.")] = None,
    is_published: Annotated[
        bool | None,
        Query(description="Admin and staff only. Public requests always return published packages."),
    ] = None,
) -> Page[ServicePackageRead]:
    page_number, page_size = page
    items, total = call_api(
        lambda: catalog.list_packages(
            session,
            staff=is_staff(user),
            page=page_number,
            page_size=page_size,
            q=q,
            sort=sort,
            service_id=service_id,
            billing_period=billing_period,
            is_published=is_published,
        )
    )
    return Page[ServicePackageRead](items=items, page=page_number, page_size=page_size, total=total)


@router.get(
    "/{package_id}",
    response_model=ServicePackageRead,
    summary="Get a service package",
    description="Public callers can read a package only when both the package and its service are published and not deleted.",
)
def get_package(
    package_id: UUID,
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
) -> ServicePackageRead:
    package = catalog.get_package(session, package_id, staff=is_staff(user))
    if package is None:
        not_found()
    return package


@router.post(
    "",
    response_model=ServicePackageRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a service package",
    description="Admin and staff only. The parent service must exist and must not be deleted.",
)
def create_package(
    data: ServicePackageCreate,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> ServicePackageRead:
    return call_api(lambda: catalog.create_package(session, data))


@router.put(
    "/{package_id}",
    response_model=ServicePackageRead,
    summary="Update a service package",
    description="Admin and staff only. Send only the fields that should change.",
)
def update_package(
    package_id: UUID,
    data: ServicePackageUpdate,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> ServicePackageRead:
    package = call_api(lambda: catalog.update_package(session, package_id, data))
    if package is None:
        not_found()
    return package


@router.delete(
    "/{package_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a service package",
    description="Admin and staff only. Soft-deletes the package so it no longer appears in public or staff lists.",
)
def delete_package(
    package_id: UUID,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> None:
    if not catalog.delete_package(session, package_id):
        not_found()
