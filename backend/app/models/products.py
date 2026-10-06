from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import CheckConstraint, ForeignKey, ForeignKeyConstraint, Index, Numeric, String, Text, UniqueConstraint, Uuid, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import (
    BILLING_PERIOD,
    BUSINESS_AREA,
    LISTING_CHANNEL,
    PRODUCT_TYPE,
    BillingPeriod,
    BusinessArea,
    ListingChannel,
    ProductType,
)
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class ProductCategory(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "product_categories"
    __table_args__ = (
        Index(
            "uq_product_categories_slug_active",
            "slug",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("product_categories.id", ondelete="RESTRICT"),
        index=True,
    )
    slug: Mapped[str] = mapped_column(String(160), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))
    is_published: Mapped[bool] = mapped_column(nullable=False, default=False, server_default=text("false"), index=True)

    parent: Mapped[ProductCategory | None] = relationship(remote_side="ProductCategory.id", back_populates="children")
    children: Mapped[list[ProductCategory]] = relationship(back_populates="parent")
    products: Mapped[list[Product]] = relationship(back_populates="category")


class Product(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "products"
    __table_args__ = (
        Index("uq_products_slug_active", "slug", unique=True, postgresql_where=text("deleted_at IS NULL")),
        Index("uq_products_sku_active", "sku", unique=True, postgresql_where=text("sku IS NOT NULL AND deleted_at IS NULL")),
        Index("ix_products_type_channel", "product_type", "listing_channel"),
    )

    category_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("product_categories.id", ondelete="RESTRICT"),
        index=True,
    )
    business_area: Mapped[BusinessArea] = mapped_column(BUSINESS_AREA, nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(160), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    summary: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    product_type: Mapped[ProductType] = mapped_column(PRODUCT_TYPE, nullable=False)
    listing_channel: Mapped[ListingChannel] = mapped_column(LISTING_CHANNEL, nullable=False)
    sku: Mapped[str | None] = mapped_column(String(80))
    demo_url: Mapped[str | None] = mapped_column(String(500))
    download_storage_key: Mapped[str | None] = mapped_column(String(500))
    is_downloadable: Mapped[bool] = mapped_column(nullable=False, default=False, server_default=text("false"))
    track_stock: Mapped[bool] = mapped_column(nullable=False, default=False, server_default=text("false"))
    stock_quantity: Mapped[int | None] = mapped_column()
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))
    is_published: Mapped[bool] = mapped_column(nullable=False, default=False, server_default=text("false"), index=True)

    category: Mapped[ProductCategory | None] = relationship(back_populates="products")
    variants: Mapped[list[ProductVariant]] = relationship(back_populates="product")
    features: Mapped[list[ProductFeature]] = relationship(back_populates="product")
    images: Mapped[list[ProductImage]] = relationship(back_populates="product", overlaps="variant")
    prices: Mapped[list[ProductPrice]] = relationship(back_populates="product", overlaps="variant")


class ProductVariant(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "product_variants"
    __table_args__ = (
        UniqueConstraint("id", "product_id", name="uq_product_variants_id_product"),
        Index(
            "uq_product_variants_sku_active",
            "sku",
            unique=True,
            postgresql_where=text("sku IS NOT NULL AND deleted_at IS NULL"),
        ),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sku: Mapped[str | None] = mapped_column(String(80))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    option_values: Mapped[dict[str, str] | None] = mapped_column(JSONB)
    stock_quantity: Mapped[int | None] = mapped_column()
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))
    is_published: Mapped[bool] = mapped_column(nullable=False, default=False, server_default=text("false"))

    product: Mapped[Product] = relationship(back_populates="variants")
    images: Mapped[list[ProductImage]] = relationship(back_populates="variant", overlaps="images,product")
    prices: Mapped[list[ProductPrice]] = relationship(back_populates="variant", overlaps="prices,product")


class ProductFeature(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "product_features"

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    value: Mapped[str | None] = mapped_column(String(500))
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))

    product: Mapped[Product] = relationship(back_populates="features")


class ProductImage(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "product_images"
    __table_args__ = (
        ForeignKeyConstraint(
            ["variant_id", "product_id"],
            ["product_variants.id", "product_variants.product_id"],
            name="fk_product_images_variant_product",
            ondelete="CASCADE",
        ),
        Index(
            "uq_product_images_primary",
            "product_id",
            unique=True,
            postgresql_where=text("is_primary AND variant_id IS NULL AND deleted_at IS NULL"),
        ),
        Index(
            "uq_product_images_variant_primary",
            "variant_id",
            unique=True,
            postgresql_where=text("is_primary AND variant_id IS NOT NULL AND deleted_at IS NULL"),
        ),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    variant_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), index=True)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    alt_text: Mapped[str | None] = mapped_column(String(255))
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))
    is_primary: Mapped[bool] = mapped_column(nullable=False, default=False, server_default=text("false"))

    product: Mapped[Product] = relationship(back_populates="images", overlaps="images,variant")
    variant: Mapped[ProductVariant | None] = relationship(
        back_populates="images",
        foreign_keys=[variant_id],
        overlaps="images,product",
    )


class ProductPrice(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "product_prices"
    __table_args__ = (
        ForeignKeyConstraint(
            ["variant_id", "product_id"],
            ["product_variants.id", "product_variants.product_id"],
            name="fk_product_prices_variant_product",
            ondelete="CASCADE",
        ),
        CheckConstraint("amount >= 0", name="amount_non_negative"),
        Index(
            "uq_product_prices_active_product",
            "product_id",
            unique=True,
            postgresql_where=text("variant_id IS NULL AND is_active AND deleted_at IS NULL"),
        ),
        Index(
            "uq_product_prices_active_variant",
            "variant_id",
            unique=True,
            postgresql_where=text("variant_id IS NOT NULL AND is_active AND deleted_at IS NULL"),
        ),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    variant_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    compare_at_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR", server_default="INR")
    billing_period: Mapped[BillingPeriod | None] = mapped_column(BILLING_PERIOD)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True, server_default=text("true"))

    product: Mapped[Product] = relationship(back_populates="prices", overlaps="prices,variant")
    variant: Mapped[ProductVariant | None] = relationship(
        back_populates="prices",
        foreign_keys=[variant_id],
        overlaps="prices,product",
    )
