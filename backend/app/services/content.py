from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.listing import apply_sort, like_pattern, paginate
from app.models.content import Testimonial
from app.schemas.content import TestimonialUpdate, TestimonialWrite
from app.services.api_error import ApiError

_TESTIMONIAL_SORT = {
    "author_name": Testimonial.author_name,
    "created_at": Testimonial.created_at,
    "sort_order": Testimonial.sort_order,
}


def list_testimonials(
    session: Session,
    *,
    staff: bool,
    page: int,
    page_size: int,
    sort: str,
    q: str | None = None,
) -> tuple[list[Testimonial], int]:
    statement = select(Testimonial).where(Testimonial.deleted_at.is_(None))
    if not staff:
        statement = statement.where(Testimonial.is_published.is_(True))
    if q:
        pattern = like_pattern(q)
        statement = statement.where(
            or_(
                Testimonial.author_name.ilike(pattern, escape="\\"),
                Testimonial.author_role.ilike(pattern, escape="\\"),
                Testimonial.body.ilike(pattern, escape="\\"),
            )
        )
    try:
        statement = apply_sort(statement, _TESTIMONIAL_SORT, sort, Testimonial.id)
    except ValueError as exc:
        raise ApiError(422, str(exc)) from exc
    return paginate(session, statement, page, page_size)


def _blank(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def create_testimonial(session: Session, data: TestimonialWrite) -> Testimonial:
    row = Testimonial(
        author_name=data.author_name.strip(),
        author_role=_blank(data.author_role),
        body=data.body.strip(),
        rating=data.rating,
        business_area=data.business_area,
        sort_order=data.sort_order,
        is_published=data.is_published,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def update_testimonial(session: Session, testimonial_id: UUID, data: TestimonialUpdate) -> Testimonial | None:
    row = session.get(Testimonial, testimonial_id)
    if row is None or row.deleted_at is not None:
        return None
    changes = data.model_dump(exclude_unset=True)
    if "author_name" in changes and changes["author_name"] is not None:
        changes["author_name"] = changes["author_name"].strip()
    if "author_role" in changes:
        changes["author_role"] = _blank(changes["author_role"])
    if "body" in changes and changes["body"] is not None:
        changes["body"] = changes["body"].strip()
    for key, value in changes.items():
        setattr(row, key, value)
    session.commit()
    session.refresh(row)
    return row


def delete_testimonial(session: Session, testimonial_id: UUID) -> bool:
    row = session.get(Testimonial, testimonial_id)
    if row is None or row.deleted_at is not None:
        return False
    row.deleted_at = datetime.now(timezone.utc)
    session.commit()
    return True
