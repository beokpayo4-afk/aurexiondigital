from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import EnrollmentStatus, OrderStatus
from app.schemas.commerce import PaymentSessionRead


class LessonOutline(BaseModel):
    id: UUID
    title: str
    content_type: str
    is_preview: bool
    body: str | None = None


class ModuleOutline(BaseModel):
    id: UUID
    title: str
    lessons: list[LessonOutline]


class ResourceAvailability(BaseModel):
    id: UUID
    title: str
    available: bool


class CourseOutline(BaseModel):
    id: UUID
    slug: str
    title: str
    summary: str | None
    description: str | None
    level: str | None
    duration_label: str | None
    thumbnail_url: str | None
    learning_outcomes: list[str]
    certificate_enabled: bool
    price_amount: Decimal | None
    currency: str
    modules: list[ModuleOutline]
    resources: list[ResourceAvailability]
    enrollment_status: EnrollmentStatus | None


class AcademyCheckoutRequest(BaseModel):
    course_id: UUID


class AcademyCheckoutRead(BaseModel):
    order_id: UUID
    order_number: str
    status: OrderStatus
    course_id: UUID
    enrollment_status: EnrollmentStatus
    placed_at: datetime
    payment: PaymentSessionRead


class LessonStudy(BaseModel):
    id: UUID
    title: str
    content_type: str
    body: str | None
    external_url: str | None
    completed: bool


class ModuleStudy(BaseModel):
    id: UUID
    title: str
    lessons: list[LessonStudy]


class CertificateRead(BaseModel):
    enabled: bool
    number: str | None
    status: str | None


class LearnCourse(BaseModel):
    course_id: UUID
    title: str
    progress_percent: int = Field(ge=0, le=100)
    certificate: CertificateRead
    modules: list[ModuleStudy]
    resources: list[ResourceAvailability]


class EnrollmentSummary(BaseModel):
    enrollment_id: UUID
    course_id: UUID
    slug: str
    title: str
    status: EnrollmentStatus
    progress_percent: int = Field(ge=0, le=100)
    certificate: CertificateRead


class ProgressRead(BaseModel):
    lesson_id: UUID
    completed: bool
    progress_percent: int = Field(ge=0, le=100)
    certificate: CertificateRead
