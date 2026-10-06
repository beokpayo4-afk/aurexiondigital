from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.models.enums import OrderItemType, OrderStatus, PaymentStatus


class CartItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    item_type: OrderItemType
    product_id: UUID | None
    package_id: UUID | None
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
    product_id: UUID | None = None
    package_id: UUID | None = None
    quantity: int = Field(default=1, ge=1, le=99)

    @model_validator(mode="after")
    def one_target(self) -> "CartItemCreate":
        if (self.product_id is None) == (self.package_id is None):
            raise ValueError("Provide a product or a service package")
        return self


class AddressWrite(BaseModel):
    line1: str = Field(min_length=1, max_length=200)
    line2: str = Field(default="", max_length=200)
    city: str = Field(min_length=1, max_length=120)
    state: str = Field(min_length=1, max_length=120)
    postal_code: str = Field(min_length=1, max_length=20)
    country: str = Field(default="India", min_length=1, max_length=80)


class CheckoutCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    phone: str = Field(min_length=8, max_length=30)
    shipping: AddressWrite
    billing: AddressWrite | None = None
    billing_same_as_shipping: bool = True


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
    email_sent: bool
    payment: PaymentSessionRead


class DownloadAvailability(BaseModel):
    order_item_id: UUID
    name: str
    available: bool
