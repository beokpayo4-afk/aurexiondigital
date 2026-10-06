from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.listing import apply_sort, like_pattern, paginate
from app.core.roles import RoleCode
from app.models.admin import ActivityLog
from app.models.auth import Role, User, UserRole
from app.models.courses import Course
from app.models.enums import LeadStatus, OrderStatus, QuoteStatus
from app.models.leads import QuoteRequest, ServiceEnquiry
from app.models.orders import Order
from app.models.products import Product
from app.schemas.content_admin import ActivityRead, AdminSummary, CountItem, PersonRead
from app.services.api_error import ApiError


def _count(session: Session, statement) -> int:
    return int(session.scalar(statement) or 0)


def _people_ids(role_code: str):
    return (
        select(User.id)
        .join(User.roles)
        .join(UserRole.role)
        .where(Role.code == role_code, User.deleted_at.is_(None), Role.deleted_at.is_(None))
        .distinct()
    )


def _lead_status_counts(session: Session, model, statuses) -> list[CountItem]:
    rows = session.execute(
        select(model.status, func.count()).where(model.deleted_at.is_(None)).group_by(model.status)
    ).all()
    found: dict[str, int] = {}
    for status, count in rows:
        key = status.value if hasattr(status, "value") else str(status)
        found[key] = int(count)
    return [CountItem(label=status.value, value=found.get(status.value, 0)) for status in statuses]


def build_summary(session: Session) -> AdminSummary:
    paid_statuses = (OrderStatus.PAID, OrderStatus.FULFILLED)
    currencies = list(session.scalars(select(Order.currency).where(Order.status.in_(paid_statuses)).distinct()).all())
    if len(set(currencies)) > 1:
        revenue = None
        revenue_currency = None
    else:
        revenue = session.scalar(select(func.coalesce(func.sum(Order.total), 0)).where(Order.status.in_(paid_statuses)))
        revenue_currency = currencies[0] if currencies else "INR"
    order_rows = session.execute(select(Order.status, func.count()).group_by(Order.status)).all()
    order_found = {(status.value if hasattr(status, "value") else str(status)): int(count) for status, count in order_rows}
    return AdminSummary(
        customers=_count(session, select(func.count()).select_from(_people_ids(RoleCode.CUSTOMER.value).subquery())),
        students=_count(session, select(func.count()).select_from(_people_ids(RoleCode.STUDENT.value).subquery())),
        products=_count(session, select(func.count()).select_from(Product).where(Product.deleted_at.is_(None))),
        courses=_count(session, select(func.count()).select_from(Course).where(Course.deleted_at.is_(None))),
        orders=_count(session, select(func.count()).select_from(Order)),
        enquiries=_count(session, select(func.count()).select_from(ServiceEnquiry).where(ServiceEnquiry.deleted_at.is_(None))),
        quote_requests=_count(session, select(func.count()).select_from(QuoteRequest).where(QuoteRequest.deleted_at.is_(None))),
        revenue=revenue,
        revenue_currency=revenue_currency,
        orders_by_status=[CountItem(label=status.value, value=order_found.get(status.value, 0)) for status in OrderStatus],
        quotes_by_status=_lead_status_counts(session, QuoteRequest, QuoteStatus),
        enquiries_by_status=_lead_status_counts(session, ServiceEnquiry, LeadStatus),
    )


def list_staff(session: Session) -> list[PersonRead]:
    staff_ids = _people_ids(RoleCode.ADMIN.value).union(_people_ids(RoleCode.STAFF.value))
    statement = (
        select(User)
        .where(User.id.in_(staff_ids), User.deleted_at.is_(None), User.is_active.is_(True))
        .order_by(User.full_name.asc())
    )
    rows = session.scalars(statement).all()
    return [
        PersonRead(id=row.id, full_name=row.full_name, email=row.email, phone=row.phone, is_active=row.is_active, created_at=row.created_at)
        for row in rows
    ]


def list_people(session: Session, *, role_code: str, page: int, page_size: int, sort: str, q: str | None):
    statement = select(User).where(User.id.in_(_people_ids(role_code)))
    if q:
        pattern = like_pattern(q)
        statement = statement.where(
            or_(
                User.full_name.ilike(pattern, escape="\\"),
                User.email.ilike(pattern, escape="\\"),
                User.phone.ilike(pattern, escape="\\"),
            )
        )
    columns = {"full_name": User.full_name, "email": User.email, "created_at": User.created_at}
    try:
        statement = apply_sort(statement, columns, sort, User.id)
    except ValueError as exc:
        raise ApiError(422, str(exc)) from exc
    rows, total = paginate(session, statement, page, page_size)
    items = [
        PersonRead(id=row.id, full_name=row.full_name, email=row.email, phone=row.phone, is_active=row.is_active, created_at=row.created_at)
        for row in rows
    ]
    return items, total


def list_activity(session: Session, *, page: int, page_size: int, sort: str, q: str | None):
    statement = select(ActivityLog).options(selectinload(ActivityLog.actor))
    if q:
        pattern = like_pattern(q)
        statement = statement.where(or_(ActivityLog.action.ilike(pattern, escape="\\"), ActivityLog.entity_type.ilike(pattern, escape="\\")))
    columns = {"created_at": ActivityLog.created_at, "action": ActivityLog.action, "entity_type": ActivityLog.entity_type}
    try:
        statement = apply_sort(statement, columns, sort, ActivityLog.id)
    except ValueError as exc:
        raise ApiError(422, str(exc)) from exc
    rows, total = paginate(session, statement, page, page_size)
    items = [
        ActivityRead(
            id=row.id,
            action=row.action,
            entity_type=row.entity_type,
            entity_id=row.entity_id if isinstance(row.entity_id, UUID) else row.entity_id,
            actor_email=row.actor.email if row.actor is not None else None,
            created_at=row.created_at,
        )
        for row in rows
    ]
    return items, total
