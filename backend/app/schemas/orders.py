from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import OrderItemType, OrderStatus, PaymentStatus


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    item_type: OrderItemType
    product_id: UUID | None
    variant_id: UUID | None
    package_id: UUID | None
    course_id: UUID | None
    name_snapshot: str
    unit_price: Decimal
    quantity: int
    line_total: Decimal


class PaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    amount: Decimal
    currency: str
    status: PaymentStatus


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_number: str
    user_id: UUID
    status: OrderStatus
    currency: str
    subtotal: Decimal
    total: Decimal
    placed_at: datetime
    items: list[OrderItemRead]


class OrderDetail(OrderRead):
    customer_name: str | None = None
    customer_email: str | None = None
    customer_phone: str | None = None
    ship_line1: str | None = None
    ship_line2: str | None = None
    ship_city: str | None = None
    ship_state: str | None = None
    ship_postal_code: str | None = None
    ship_country: str | None = None
    bill_line1: str | None = None
    bill_line2: str | None = None
    bill_city: str | None = None
    bill_state: str | None = None
    bill_postal_code: str | None = None
    bill_country: str | None = None
    payments: list[PaymentRead]
