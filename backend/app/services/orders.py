from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.listing import apply_sort, like_pattern, paginate
from app.models.auth import User
from app.models.orders import Order
from app.schemas.orders import OrderDetail, OrderRead
from app.services.access import is_staff
from app.services.api_error import ApiError


def _sort(statement, columns, sort, tie_break):
    try:
        return apply_sort(statement, columns, sort, tie_break)
    except ValueError as exc:
        raise ApiError(422, str(exc)) from exc


def _visible(statement, user: User):
    if is_staff(user):
        return statement
    return statement.where(Order.user_id == user.id)


def list_orders(
    session: Session,
    *,
    user: User,
    page: int,
    page_size: int,
    q: str | None,
    sort: str,
    status,
    user_id: UUID | None,
) -> tuple[list[OrderRead], int]:
    statement = _visible(select(Order).options(selectinload(Order.items)), user)
    if status is not None:
        statement = statement.where(Order.status == status)
    if user_id is not None and is_staff(user):
        statement = statement.where(Order.user_id == user_id)
    if q:
        pattern = like_pattern(q)
        statement = statement.where(or_(Order.order_number.ilike(pattern, escape="\\")))
    statement = _sort(
        statement,
        {"placed_at": Order.placed_at, "total": Order.total, "order_number": Order.order_number},
        sort,
        Order.id,
    )
    rows, total = paginate(session, statement, page, page_size)
    return [OrderRead.model_validate(row) for row in rows], total


def get_order(session: Session, order_id: UUID, *, user: User) -> OrderDetail | None:
    statement = _visible(
        select(Order).options(selectinload(Order.items), selectinload(Order.payments)).where(Order.id == order_id),
        user,
    )
    order = session.scalars(statement).first()
    if order is None:
        return None
    return OrderDetail.model_validate(order)
