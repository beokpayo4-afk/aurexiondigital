from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, Text, Uuid, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import BUSINESS_AREA, LEAD_STATUS, QUOTE_STATUS, BusinessArea, LeadStatus, QuoteStatus
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class _ContactFields:
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(32))


class ContactSubmission(_ContactFields, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "contact_submissions"
    __table_args__ = (Index("ix_contact_submissions_status_created", "status", "created_at"),)

    company_name: Mapped[str | None] = mapped_column(String(200))
    promote: Mapped[str | None] = mapped_column(Text)
    interest: Mapped[str | None] = mapped_column(String(40))
    channel: Mapped[str | None] = mapped_column(String(20))
    budget: Mapped[str | None] = mapped_column(String(80))
    target_location: Mapped[str | None] = mapped_column(String(200))
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[LeadStatus] = mapped_column(LEAD_STATUS, nullable=False, index=True)
    source_path: Mapped[str | None] = mapped_column(String(255))


class ServiceEnquiry(_ContactFields, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "service_enquiries"
    __table_args__ = (Index("ix_service_enquiries_status_created", "status", "created_at"),)

    user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True)
    service_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("services.id", ondelete="SET NULL"),
        index=True,
    )
    company_name: Mapped[str | None] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[LeadStatus] = mapped_column(LEAD_STATUS, nullable=False)
    assigned_to_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
    )

    user: Mapped[User | None] = relationship("User", foreign_keys=[user_id])
    assigned_to: Mapped[User | None] = relationship("User", foreign_keys=[assigned_to_user_id])
    service: Mapped[Service | None] = relationship("Service")


class QuoteRequest(_ContactFields, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "quote_requests"
    __table_args__ = (Index("ix_quote_requests_status_created", "status", "created_at"),)

    user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True)
    service_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("services.id", ondelete="SET NULL"),
        index=True,
    )
    business_area: Mapped[BusinessArea | None] = mapped_column(BUSINESS_AREA)
    organization: Mapped[str | None] = mapped_column(String(200))
    product_service: Mapped[str | None] = mapped_column(String(200))
    target_location: Mapped[str | None] = mapped_column(String(200))
    target_audience: Mapped[str | None] = mapped_column(Text)
    estimated_budget: Mapped[str | None] = mapped_column(String(80))
    channels: Mapped[list | None] = mapped_column(JSONB)
    requirements: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[QuoteStatus] = mapped_column(QUOTE_STATUS, nullable=False)
    response_message: Mapped[str | None] = mapped_column(Text)
    response_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    responded_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )

    user: Mapped[User | None] = relationship("User", foreign_keys=[user_id])
    responded_by: Mapped[User | None] = relationship("User", foreign_keys=[responded_by_user_id])
    service: Mapped[Service | None] = relationship("Service")


class MarketingCampaignRequest(_ContactFields, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "marketing_campaign_requests"
    __table_args__ = (Index("ix_marketing_campaign_requests_status_created", "status", "created_at"),)

    user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True)
    service_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("services.id", ondelete="SET NULL"),
        index=True,
    )
    organization: Mapped[str | None] = mapped_column(String(200))
    brief: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[LeadStatus] = mapped_column(LEAD_STATUS, nullable=False)

    user: Mapped[User | None] = relationship("User")
    service: Mapped[Service | None] = relationship("Service")
