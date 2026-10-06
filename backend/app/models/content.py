from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Index, String, Text, Uuid, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.enums import BUSINESS_AREA, BusinessArea
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class HomepageSection(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "homepage_sections"
    __table_args__ = (
        Index(
            "uq_homepage_sections_key_active",
            "section_key",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    section_key: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str | None] = mapped_column(String(200))
    subtitle: Mapped[str | None] = mapped_column(String(300))
    body: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))
    is_published: Mapped[bool] = mapped_column(nullable=False, default=False, server_default=text("false"), index=True)
    config_json: Mapped[dict[str, object] | None] = mapped_column(JSONB)


class Banner(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "banners"
    __table_args__ = (Index("ix_banners_published_sort", "is_published", "sort_order"),)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(300))
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    link_url: Mapped[str | None] = mapped_column(String(500))
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))
    is_published: Mapped[bool] = mapped_column(nullable=False, default=False, server_default=text("false"))


class Testimonial(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "testimonials"
    __table_args__ = (
        Index("ix_testimonials_published_sort", "is_published", "sort_order"),
        CheckConstraint("rating IS NULL OR (rating >= 1 AND rating <= 5)", name="rating_range"),
    )

    author_name: Mapped[str] = mapped_column(String(200), nullable=False)
    author_role: Mapped[str | None] = mapped_column(String(150))
    body: Mapped[str] = mapped_column(Text, nullable=False)
    rating: Mapped[int | None] = mapped_column()
    business_area: Mapped[BusinessArea | None] = mapped_column(BUSINESS_AREA, index=True)
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))
    is_published: Mapped[bool] = mapped_column(nullable=False, default=False, server_default=text("false"))


class FAQ(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "faqs"
    __table_args__ = (Index("ix_faqs_published_sort", "is_published", "sort_order"),)

    question: Mapped[str] = mapped_column(String(300), nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))
    is_published: Mapped[bool] = mapped_column(nullable=False, default=False, server_default=text("false"))


class BlogPost(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "blog_posts"
    __table_args__ = (
        Index("uq_blog_posts_slug_active", "slug", unique=True, postgresql_where=text("deleted_at IS NULL")),
        Index("ix_blog_posts_published_at", "is_published", "published_at"),
    )

    slug: Mapped[str] = mapped_column(String(160), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    excerpt: Mapped[str | None] = mapped_column(Text)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_published: Mapped[bool] = mapped_column(nullable=False, default=False, server_default=text("false"))


class SEOSetting(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "seo_settings"
    __table_args__ = (
        Index("uq_seo_settings_path_active", "path", unique=True, postgresql_where=text("deleted_at IS NULL")),
        Index("ix_seo_settings_entity", "entity_type", "entity_id"),
    )

    path: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(50))
    entity_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True))
    meta_title: Mapped[str | None] = mapped_column(String(180))
    meta_description: Mapped[str | None] = mapped_column(String(320))
    og_image_url: Mapped[str | None] = mapped_column(String(500))
    canonical_path: Mapped[str | None] = mapped_column(String(255))
    robots: Mapped[str | None] = mapped_column(String(80))


class SiteSetting(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "site_settings"
    __table_args__ = (Index("uq_site_settings_key", "key", unique=True),)

    key: Mapped[str] = mapped_column(String(80), nullable=False)
    value: Mapped[str | None] = mapped_column(Text)


class SocialLink(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "social_links"
    __table_args__ = (Index("ix_social_links_published_sort", "is_published", "sort_order"),)

    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))
    is_published: Mapped[bool] = mapped_column(nullable=False, default=False, server_default=text("false"))
