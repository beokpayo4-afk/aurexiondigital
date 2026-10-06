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
from app.schemas.catalog import CourseCreate, CourseRead, CourseUpdate
from app.schemas.common import Page
from app.services import catalog
from app.services.access import is_staff

router = APIRouter(prefix="/courses", tags=["courses"])
_staff = require_roles(RoleCode.ADMIN, RoleCode.STAFF)

_SORT = "Sort field. Prefix with - for descending. Allowed: title, slug, created_at, sort_order."


@router.get(
    "",
    response_model=Page[CourseRead],
    summary="List courses",
    description="Public callers receive published courses only. Admin and staff also receive unpublished drafts. Deleted courses are never returned.",
)
def list_courses(
    page: Annotated[tuple[int, int], Depends(page_params)],
    q: Annotated[str | None, Depends(search_param)],
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
    sort: Annotated[str, Query(description=_SORT)] = "sort_order",
    business_area: Annotated[BusinessArea | None, Query(description="Filter by business area.")] = None,
    category_id: Annotated[UUID | None, Query(description="Filter by course category id.")] = None,
    level: Annotated[str | None, Query(max_length=50, description="Exact level match.")] = None,
    is_published: Annotated[
        bool | None,
        Query(description="Admin and staff only. Public requests always return published courses."),
    ] = None,
) -> Page[CourseRead]:
    page_number, page_size = page
    items, total = call_api(
        lambda: catalog.list_courses(
            session,
            staff=is_staff(user),
            page=page_number,
            page_size=page_size,
            q=q,
            sort=sort,
            business_area=business_area,
            category_id=category_id,
            level=level,
            is_published=is_published,
        )
    )
    return Page[CourseRead](items=items, page=page_number, page_size=page_size, total=total)


@router.get(
    "/{slug}",
    response_model=CourseRead,
    summary="Get a course by slug",
    description="Returns one course. Unpublished courses are visible only to admin and staff. Deleted courses are hidden from everyone.",
)
def get_course(
    slug: str,
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
) -> CourseRead:
    course = catalog.get_course_by_slug(session, slug, staff=is_staff(user))
    if course is None:
        not_found()
    return course


@router.post(
    "",
    response_model=CourseRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a course",
    description="Admin and staff only. A new course stays unpublished unless is_published is true.",
)
def create_course(
    data: CourseCreate,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> CourseRead:
    return call_api(lambda: catalog.create_course(session, data))


@router.put(
    "/{course_id}",
    response_model=CourseRead,
    summary="Update a course",
    description="Admin and staff only. The path uses the course id, not the slug.",
)
def update_course(
    course_id: UUID,
    data: CourseUpdate,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> CourseRead:
    course = call_api(lambda: catalog.update_course(session, course_id, data))
    if course is None:
        not_found()
    return course


@router.delete(
    "/{course_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a course",
    description="Admin and staff only. Soft-deletes the course so it no longer appears in public or staff lists.",
)
def delete_course(
    course_id: UUID,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> None:
    if not catalog.delete_course(session, course_id):
        not_found()
