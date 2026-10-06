from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_optional_user, require_roles
from app.api.http import call_api, not_found
from app.api.listing import page_params, search_param
from app.core.roles import RoleCode
from app.models.auth import User
from app.schemas.catalog import CategoryCreate, CategoryRead, CategoryUpdate
from app.schemas.common import Page
from app.services import catalog
from app.services.access import is_staff

router = APIRouter(prefix="/categories", tags=["categories"])
_staff = require_roles(RoleCode.ADMIN, RoleCode.STAFF)
Kind = Literal["service", "product", "course"]

_SORT = "Sort field. Prefix with - for descending. Allowed: name, slug, created_at, sort_order."


@router.get(
    "",
    response_model=Page[CategoryRead],
    summary="List categories",
    description=(
        "Lists service, product, or course categories. The kind query parameter is required because each kind is stored separately. "
        "Public callers receive published categories only. Deleted categories are never returned."
    ),
)
def list_categories(
    page: Annotated[tuple[int, int], Depends(page_params)],
    q: Annotated[str | None, Depends(search_param)],
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
    kind: Annotated[Kind, Query(description="service, product, or course.")],
    sort: Annotated[str, Query(description=_SORT)] = "sort_order",
    parent_id: Annotated[UUID | None, Query(description="Filter by parent category id.")] = None,
    is_published: Annotated[
        bool | None,
        Query(description="Admin and staff only. Public requests always return published categories."),
    ] = None,
) -> Page[CategoryRead]:
    page_number, page_size = page
    items, total = call_api(
        lambda: catalog.list_categories(
            session,
            kind=kind,
            staff=is_staff(user),
            page=page_number,
            page_size=page_size,
            q=q,
            sort=sort,
            parent_id=parent_id,
            is_published=is_published,
        )
    )
    return Page[CategoryRead](items=items, page=page_number, page_size=page_size, total=total)


@router.post(
    "",
    response_model=CategoryRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a category",
    description="Admin and staff only. kind selects the service, product, or course category table.",
)
def create_category(
    data: CategoryCreate,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> CategoryRead:
    return call_api(lambda: catalog.create_category(session, data))


@router.put(
    "/{category_id}",
    response_model=CategoryRead,
    summary="Update a category",
    description="Admin and staff only. The category id is looked up across service, product, and course categories.",
)
def update_category(
    category_id: UUID,
    data: CategoryUpdate,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> CategoryRead:
    category = call_api(lambda: catalog.update_category(session, category_id, data))
    if category is None:
        not_found()
    return category


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a category",
    description="Admin and staff only. Soft-deletes the category. Fails with 409 when a live child category or catalog record still uses it.",
)
def delete_category(
    category_id: UUID,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> None:
    deleted = call_api(lambda: catalog.delete_category(session, category_id))
    if not deleted:
        not_found()
