from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Index, Numeric, String, Text, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import BILLING_PERIOD, BUSINESS_AREA, BillingPeriod, BusinessArea
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class ServiceCategory(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "service_categories"
    __table_args__ = (
        Index(
            "uq_service_categories_slug_active",
            "slug",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("service_categories.id", ondelete="RESTRICT"),
        index=True,
    )
    slug: Mapped[str] = mapped_column(String(160), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))
    is_published: Mapped[bool] = mapped_column(nullable=False, default=False, server_default=text("false"), index=True)

    parent: Mapped[ServiceCategory | None] = relationship(
        remote_side="ServiceCategory.id",
        back_populates="children",
    )
    children: Mapped[list[ServiceCategory]] = relationship(back_populates="parent")
    services: Mapped[list[Service]] = relationship(back_populates="category")


class Service(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "services"
    __table_args__ = (
        Index("uq_services_slug_active", "slug", unique=True, postgresql_where=text("deleted_at IS NULL")),
        Index("ix_services_area_published", "business_area", "is_published"),
    )

    category_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("service_categories.id", ondelete="RESTRICT"),
        index=True,
    )
    business_area: Mapped[BusinessArea] = mapped_column(BUSINESS_AREA, nullable=False)
    slug: Mapped[str] = mapped_column(String(160), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    summary: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))
    is_published: Mapped[bool] = mapped_column(nullable=False, default=False, server_default=text("false"))

    category: Mapped[ServiceCategory | None] = relationship(back_populates="services")
    packages: Mapped[list[ServicePackage]] = relationship(back_populates="service")


class ServicePackage(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "service_packages"
    __table_args__ = (
        Index(
            "uq_service_packages_service_slug_active",
            "service_id",
            "slug",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    service_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("services.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    slug: Mapped[str] = mapped_column(String(160), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    price_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR", server_default="INR")
    billing_period: Mapped[BillingPeriod | None] = mapped_column(BILLING_PERIOD)
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))
    is_published: Mapped[bool] = mapped_column(nullable=False, default=False, server_default=text("false"), index=True)

    service: Mapped[Service] = relationship(back_populates="packages")
    features: Mapped[list[PackageFeature]] = relationship(back_populates="package")


class PackageFeature(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "package_features"

    package_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("service_packages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))

    package: Mapped[ServicePackage] = relationship(back_populates="features")
