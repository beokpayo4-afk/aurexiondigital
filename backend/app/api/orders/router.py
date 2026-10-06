from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.api.http import call_api, not_found
from app.api.listing import page_params, search_param
from app.models.auth import User
from app.models.enums import OrderStatus
from app.schemas.common import Page
from app.schemas.orders import OrderDetail, OrderRead
from app.services import orders

router = APIRouter(prefix="/orders", tags=["orders"])

_SORT = "Sort field. Prefix with - for descending. Allowed: placed_at, total, order_number."


@router.get(
    "",
    response_model=Page[OrderRead],
    summary="List orders",
    description=(
        "Authentication required. Customers and students see only their own orders. "
        "Admin and staff see every order and may filter by user_id. Orders are permanent records and are not soft-deleted."
    ),
)
def list_orders(
    page: Annotated[tuple[int, int], Depends(page_params)],
    q: Annotated[str | None, Depends(search_param)],
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    sort: Annotated[str, Query(description=_SORT)] = "-placed_at",
    status_filter: Annotated[OrderStatus | None, Query(alias="status", description="Filter by order status.")] = None,
    user_id: Annotated[UUID | None, Query(description="Admin and staff only. Limit the list to one customer.")] = None,
) -> Page[OrderRead]:
    page_number, page_size = page
    items, total = call_api(
        lambda: orders.list_orders(
            session,
            user=user,
            page=page_number,
            page_size=page_size,
            q=q,
            sort=sort,
            status=status_filter,
            user_id=user_id,
        )
    )
    return Page[OrderRead](items=items, page=page_number, page_size=page_size, total=total)


@router.get(
    "/{order_id}",
    response_model=OrderDetail,
    summary="Get an order",
    description="Authentication required. A customer receives 404 for an order that belongs to someone else. The detail includes line items and payment status.",
)
def get_order(
    order_id: UUID,
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> OrderDetail:
    order = orders.get_order(session, order_id, user=user)
    if order is None:
        not_found()
    return order
