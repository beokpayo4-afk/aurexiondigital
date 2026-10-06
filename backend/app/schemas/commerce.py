from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import OrderStatus, PaymentStatus


class CartItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    slug: str
    name: str
    quantity: int
    unit_price: Decimal
    currency: str
    line_total: Decimal
    is_downloadable: bool


class CartRead(BaseModel):
    id: UUID
    guest_token: str | None
    currency: str
    subtotal: Decimal
    items: list[CartItemRead]


class CartItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(default=1, ge=1, le=99)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1, le=99)


class PaymentSessionRead(BaseModel):
    enabled: bool
    provider: str | None
    publishable_key: str | None
    currency: str
    status: PaymentStatus
    reference: str | None


class CheckoutRead(BaseModel):
    order_id: UUID
    order_number: str
    status: OrderStatus
    currency: str
    total: Decimal
    placed_at: datetime
    payment: PaymentSessionRead


class DownloadAvailability(BaseModel):
    order_item_id: UUID
    name: str
    available: bool
