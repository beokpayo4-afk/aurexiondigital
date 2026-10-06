from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Numeric, String, Text, Uuid, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import (
    BUSINESS_AREA,
    CERTIFICATE_STATUS,
    ENROLLMENT_SOURCE,
    ENROLLMENT_STATUS,
    LESSON_CONTENT_TYPE,
    BusinessArea,
    CertificateStatus,
    EnrollmentSource,
    EnrollmentStatus,
    LessonContentType,
)
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class CourseCategory(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "course_categories"
    __table_args__ = (
        Index(
            "uq_course_categories_slug_active",
            "slug",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("course_categories.id", ondelete="RESTRICT"),
        index=True,
    )
    slug: Mapped[str] = mapped_column(String(160), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))
    is_published: Mapped[bool] = mapped_column(nullable=False, default=False, server_default=text("false"), index=True)

    parent: Mapped[CourseCategory | None] = relationship(remote_side="CourseCategory.id", back_populates="children")
    children: Mapped[list[CourseCategory]] = relationship(back_populates="parent")
    courses: Mapped[list[Course]] = relationship(back_populates="category")


class Course(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "courses"
    __table_args__ = (
        Index("uq_courses_slug_active", "slug", unique=True, postgresql_where=text("deleted_at IS NULL")),
        CheckConstraint("price_amount IS NULL OR price_amount >= 0", name="price_non_negative"),
    )

    category_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("course_categories.id", ondelete="RESTRICT"),
        index=True,
    )
    business_area: Mapped[BusinessArea] = mapped_column(BUSINESS_AREA, nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(160), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    summary: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    price_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR", server_default="INR")
    level: Mapped[str | None] = mapped_column(String(50))
    duration_label: Mapped[str | None] = mapped_column(String(80))
    thumbnail_url: Mapped[str | None] = mapped_column(String(500))
    learning_outcomes: Mapped[list] = mapped_column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))
    certificate_enabled: Mapped[bool] = mapped_column(nullable=False, default=False, server_default=text("false"))
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))
    is_published: Mapped[bool] = mapped_column(nullable=False, default=False, server_default=text("false"), index=True)

    category: Mapped[CourseCategory | None] = relationship(back_populates="courses")
    modules: Mapped[list[CourseModule]] = relationship(back_populates="course")
    resources: Mapped[list[CourseResource]] = relationship(back_populates="course")
    enrollments: Mapped[list[CourseEnrollment]] = relationship(back_populates="course")


class CourseModule(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "course_modules"

    course_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))

    course: Mapped[Course] = relationship(back_populates="modules")
    lessons: Mapped[list[CourseLesson]] = relationship(back_populates="module")


class CourseLesson(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "course_lessons"

    module_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("course_modules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content_type: Mapped[LessonContentType] = mapped_column(LESSON_CONTENT_TYPE, nullable=False)
    body: Mapped[str | None] = mapped_column(Text)
    external_url: Mapped[str | None] = mapped_column(String(500))
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))
    is_preview: Mapped[bool] = mapped_column(nullable=False, default=False, server_default=text("false"))

    module: Mapped[CourseModule] = relationship(back_populates="lessons")
    resources: Mapped[list[CourseResource]] = relationship(back_populates="lesson")
    progress_rows: Mapped[list[CourseProgress]] = relationship(back_populates="lesson")


class CourseResource(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "course_resources"
    __table_args__ = (
        CheckConstraint(
            "(course_id IS NOT NULL AND lesson_id IS NULL) OR (course_id IS NULL AND lesson_id IS NOT NULL)",
            name="one_parent",
        ),
        CheckConstraint("file_url IS NOT NULL OR external_url IS NOT NULL", name="resource_location"),
    )

    course_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        index=True,
    )
    lesson_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("course_lessons.id", ondelete="CASCADE"),
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    file_url: Mapped[str | None] = mapped_column(String(500))
    external_url: Mapped[str | None] = mapped_column(String(500))
    storage_key: Mapped[str | None] = mapped_column(String(500))
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))

    course: Mapped[Course | None] = relationship(back_populates="resources")
    lesson: Mapped[CourseLesson | None] = relationship(back_populates="resources")


class CourseEnrollment(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "course_enrollments"
    __table_args__ = (
        Index(
            "uq_course_enrollments_user_course_active",
            "user_id",
            "course_id",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "uq_course_enrollments_order_item",
            "order_item_id",
            unique=True,
            postgresql_where=text("order_item_id IS NOT NULL"),
        ),
        Index("ix_course_enrollments_status", "status"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("courses.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    order_item_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("order_items.id", ondelete="SET NULL"),
        index=True,
    )
    status: Mapped[EnrollmentStatus] = mapped_column(ENROLLMENT_STATUS, nullable=False)
    source: Mapped[EnrollmentSource] = mapped_column(ENROLLMENT_SOURCE, nullable=False)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)

    user: Mapped[User] = relationship("User")
    course: Mapped[Course] = relationship(back_populates="enrollments")
    order_item: Mapped[OrderItem | None] = relationship("OrderItem", back_populates="enrollment")
    progress_rows: Mapped[list[CourseProgress]] = relationship(back_populates="enrollment")
    certificate: Mapped[Certificate | None] = relationship(back_populates="enrollment")


class CourseProgress(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "course_progress"
    __table_args__ = (Index("uq_course_progress_enrollment_lesson", "enrollment_id", "lesson_id", unique=True),)

    enrollment_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("course_enrollments.id", ondelete="CASCADE"),
        nullable=False,
    )
    lesson_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("course_lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    enrollment: Mapped[CourseEnrollment] = relationship(back_populates="progress_rows")
    lesson: Mapped[CourseLesson] = relationship(back_populates="progress_rows")


class Certificate(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "certificates"
    __table_args__ = (
        Index("uq_certificates_number", "certificate_number", unique=True),
        Index("uq_certificates_enrollment", "enrollment_id", unique=True),
    )

    enrollment_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("course_enrollments.id", ondelete="RESTRICT"),
        nullable=False,
    )
    certificate_number: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[CertificateStatus] = mapped_column(CERTIFICATE_STATUS, nullable=False, index=True)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)

    enrollment: Mapped[CourseEnrollment] = relationship(back_populates="certificate")
