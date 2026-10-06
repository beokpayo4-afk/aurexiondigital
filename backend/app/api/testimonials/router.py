from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_optional_user, require_roles
from app.api.http import call_api, not_found
from app.api.listing import page_params, search_param
from app.core.roles import RoleCode
from app.models.auth import User
from app.schemas.common import Page
from app.schemas.content import TestimonialRead, TestimonialUpdate, TestimonialWrite
from app.services import content
from app.services.access import is_staff

router = APIRouter(prefix="/testimonials", tags=["testimonials"])
_staff = require_roles(RoleCode.ADMIN, RoleCode.STAFF)

_SORT = "Sort field. Prefix with - for descending. Allowed: author_name, created_at, sort_order."


@router.get(
    "",
    response_model=Page[TestimonialRead],
    summary="List testimonials",
    description=(
        "Public callers receive published testimonials only. Admin and staff also receive unpublished drafts. "
        "Deleted testimonials are never returned."
    ),
)
def list_testimonials(
    page: Annotated[tuple[int, int], Depends(page_params)],
    q: Annotated[str | None, Depends(search_param)],
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
    sort: Annotated[str, Query(description=_SORT)] = "sort_order",
) -> Page[TestimonialRead]:
    page_number, page_size = page
    items, total = call_api(
        lambda: content.list_testimonials(
            session,
            staff=is_staff(user),
            page=page_number,
            page_size=page_size,
            sort=sort,
            q=q,
        )
    )
    return Page[TestimonialRead](items=items, page=page_number, page_size=page_size, total=total)


@router.post("", response_model=TestimonialRead, status_code=status.HTTP_201_CREATED, summary="Create a testimonial")
def create_testimonial(
    data: TestimonialWrite,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> TestimonialRead:
    return call_api(lambda: content.create_testimonial(session, data))


@router.put("/{testimonial_id}", response_model=TestimonialRead, summary="Update a testimonial")
def update_testimonial(
    testimonial_id: UUID,
    data: TestimonialUpdate,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> TestimonialRead:
    row = call_api(lambda: content.update_testimonial(session, testimonial_id, data))
    if row is None:
        not_found()
    return row


@router.delete("/{testimonial_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a testimonial")
def delete_testimonial(
    testimonial_id: UUID,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> None:
    if not content.delete_testimonial(session, testimonial_id):
        not_found()
