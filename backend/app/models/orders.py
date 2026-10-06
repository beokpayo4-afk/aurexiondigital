from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, ForeignKeyConstraint, Index, Numeric, String, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import ORDER_ITEM_TYPE, ORDER_STATUS, PAYMENT_STATUS, OrderItemType, OrderStatus, PaymentStatus
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin

_ITEM_TARGET = (
    "(item_type = 'product' AND product_id IS NOT NULL AND package_id IS NULL AND course_id IS NULL) OR "
    "(item_type = 'package' AND package_id IS NOT NULL AND product_id IS NULL AND course_id IS NULL) OR "
    "(item_type = 'course' AND course_id IS NOT NULL AND product_id IS NULL AND package_id IS NULL)"
)


class Cart(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "carts"
    __table_args__ = (
        CheckConstraint(
            "(user_id IS NOT NULL AND guest_token IS NULL) OR (user_id IS NULL AND guest_token IS NOT NULL)",
            name="one_owner",
        ),
        Index(
            "uq_carts_user_active",
            "user_id",
            unique=True,
            postgresql_where=text("user_id IS NOT NULL AND deleted_at IS NULL"),
        ),
        Index(
            "uq_carts_guest_active",
            "guest_token",
            unique=True,
            postgresql_where=text("guest_token IS NOT NULL AND deleted_at IS NULL"),
        ),
    )

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    guest_token: Mapped[str | None] = mapped_column(String(80))

    user: Mapped[User | None] = relationship("User")
    items: Mapped[list[CartItem]] = relationship(back_populates="cart")


class CartItem(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "cart_items"
    __table_args__ = (
        CheckConstraint(_ITEM_TARGET, name="one_target"),
        CheckConstraint("variant_id IS NULL OR product_id IS NOT NULL", name="variant_requires_product"),
        CheckConstraint("quantity > 0", name="quantity_positive"),
        ForeignKeyConstraint(
            ["variant_id", "product_id"],
            ["product_variants.id", "product_variants.product_id"],
            name="fk_cart_items_variant_product",
        ),
    )

    cart_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("carts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    item_type: Mapped[OrderItemType] = mapped_column(ORDER_ITEM_TYPE, nullable=False)
    product_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("products.id", ondelete="RESTRICT"))
    variant_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True))
    package_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("service_packages.id", ondelete="RESTRICT"),
    )
    course_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("courses.id", ondelete="RESTRICT"))
    quantity: Mapped[int] = mapped_column(nullable=False, default=1, server_default=text("1"))
    unit_price_snapshot: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    cart: Mapped[Cart] = relationship(back_populates="items")


class Order(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "orders"
    __table_args__ = (
        Index("uq_orders_order_number", "order_number", unique=True),
        Index("ix_orders_user_status", "user_id", "status"),
        Index("ix_orders_placed_at", "placed_at"),
        CheckConstraint("subtotal >= 0 AND total >= 0", name="totals_non_negative"),
    )

    order_number: Mapped[str] = mapped_column(String(40), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    status: Mapped[OrderStatus] = mapped_column(ORDER_STATUS, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR", server_default="INR")
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    placed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)

    user: Mapped[User] = relationship("User")
    items: Mapped[list[OrderItem]] = relationship(back_populates="order")
    payments: Mapped[list[Payment]] = relationship(back_populates="order")


class OrderItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "order_items"
    __table_args__ = (
        CheckConstraint(_ITEM_TARGET, name="one_target"),
        CheckConstraint("variant_id IS NULL OR product_id IS NOT NULL", name="variant_requires_product"),
        CheckConstraint("quantity > 0 AND unit_price >= 0 AND line_total >= 0", name="amounts_valid"),
        ForeignKeyConstraint(
            ["variant_id", "product_id"],
            ["product_variants.id", "product_variants.product_id"],
            name="fk_order_items_variant_product",
        ),
        Index("ix_order_items_order_id", "order_id"),
    )

    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
    )
    item_type: Mapped[OrderItemType] = mapped_column(ORDER_ITEM_TYPE, nullable=False)
    product_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("products.id", ondelete="RESTRICT"))
    variant_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True))
    package_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("service_packages.id", ondelete="RESTRICT"),
    )
    course_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("courses.id", ondelete="RESTRICT"))
    name_snapshot: Mapped[str] = mapped_column(String(200), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    order: Mapped[Order] = relationship(back_populates="items")
    enrollment: Mapped[CourseEnrollment | None] = relationship("CourseEnrollment", back_populates="order_item")


class Payment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "payments"
    __table_args__ = (
        Index("ix_payments_order_status", "order_id", "status"),
        CheckConstraint("amount >= 0", name="amount_non_negative"),
    )

    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("orders.id", ondelete="RESTRICT"),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR", server_default="INR")
    status: Mapped[PaymentStatus] = mapped_column(PAYMENT_STATUS, nullable=False)
    provider: Mapped[str | None] = mapped_column(String(50))

    order: Mapped[Order] = relationship(back_populates="payments")
    transactions: Mapped[list[PaymentTransaction]] = relationship(back_populates="payment")


class PaymentTransaction(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "payment_transactions"
    __table_args__ = (
        Index("ix_payment_transactions_provider_reference", "provider_reference"),
        CheckConstraint("amount >= 0", name="amount_non_negative"),
    )

    payment_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("payments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(PAYMENT_STATUS, nullable=False, index=True)
    provider_reference: Mapped[str | None] = mapped_column(String(120))

    payment: Mapped[Payment] = relationship(back_populates="transactions")
