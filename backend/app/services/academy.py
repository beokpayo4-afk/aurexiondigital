from __future__ import annotations

import secrets
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.roles import RoleCode
from app.models.auth import UserRole
from app.models.courses import Certificate, Course, CourseEnrollment, CourseLesson, CourseModule, CourseProgress, CourseResource
from app.models.enums import CertificateStatus, EnrollmentSource, EnrollmentStatus, OrderItemType, OrderStatus, PaymentStatus
from app.models.orders import Order, OrderItem, Payment, PaymentTransaction
from app.repositories import auth as auth_repo
from app.schemas.academy import (
    AcademyCheckoutRead,
    CertificateRead,
    CourseOutline,
    EnrollmentSummary,
    LearnCourse,
    LessonOutline,
    LessonStudy,
    ModuleOutline,
    ModuleStudy,
    ProgressRead,
    ResourceAvailability,
)
from app.schemas.commerce import PaymentSessionRead
from app.services import payments
from app.services.api_error import ApiError


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _money(value: Decimal) -> Decimal:
    return Decimal(value).quantize(Decimal("0.01"))


def _course_query():
    return select(Course).options(
        selectinload(Course.modules).selectinload(CourseModule.lessons),
        selectinload(Course.resources),
    )


def _sorted_modules(course: Course) -> list[CourseModule]:
    modules = [module for module in course.modules if module.deleted_at is None]
    modules.sort(key=lambda module: (module.sort_order, module.title))
    return modules


def _sorted_lessons(module: CourseModule) -> list[CourseLesson]:
    lessons = [lesson for lesson in module.lessons if lesson.deleted_at is None]
    lessons.sort(key=lambda lesson: (lesson.sort_order, lesson.title))
    return lessons


def _resource_rows(course: Course) -> list[CourseResource]:
    rows = [row for row in course.resources if row.deleted_at is None]
    rows.sort(key=lambda row: (row.sort_order, row.title))
    return rows


def _resource_available(row: CourseResource) -> bool:
    return bool(row.storage_key and settings.download_storage_dir.strip())


def _enrollment(session: Session, *, user_id: UUID, course_id: UUID) -> CourseEnrollment | None:
    return session.scalars(
        select(CourseEnrollment)
        .options(selectinload(CourseEnrollment.progress_rows), selectinload(CourseEnrollment.certificate))
        .where(
            CourseEnrollment.user_id == user_id,
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.deleted_at.is_(None),
        )
    ).first()


def _active(enrollment: CourseEnrollment | None) -> bool:
    return enrollment is not None and enrollment.status in {EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED}


def outline(session: Session, slug: str, *, user_id: UUID | None) -> CourseOutline | None:
    course = session.scalars(_course_query().where(Course.slug == slug, Course.deleted_at.is_(None), Course.is_published.is_(True))).first()
    if course is None:
        return None
    modules: list[ModuleOutline] = []
    for module in _sorted_modules(course):
        lessons: list[LessonOutline] = []
        for lesson in _sorted_lessons(module):
            lessons.append(
                LessonOutline(
                    id=lesson.id,
                    title=lesson.title,
                    content_type=lesson.content_type.value,
                    is_preview=lesson.is_preview,
                    body=lesson.body if lesson.is_preview else None,
                )
            )
        modules.append(ModuleOutline(id=module.id, title=module.title, lessons=lessons))
    enrollment = _enrollment(session, user_id=user_id, course_id=course.id) if user_id else None
    return CourseOutline(
        id=course.id,
        slug=course.slug,
        title=course.title,
        summary=course.summary,
        description=course.description,
        level=course.level,
        duration_label=course.duration_label,
        thumbnail_url=course.thumbnail_url,
        learning_outcomes=list(course.learning_outcomes or []),
        certificate_enabled=course.certificate_enabled,
        price_amount=course.price_amount,
        currency=course.currency,
        modules=modules,
        resources=[ResourceAvailability(id=row.id, title=row.title, available=False) for row in _resource_rows(course)],
        enrollment_status=enrollment.status if enrollment else None,
    )


def _payment_read(payment: Payment, reference: str | None) -> PaymentSessionRead:
    config = payments.public_config()
    return PaymentSessionRead(
        enabled=config.enabled,
        provider=config.provider,
        publishable_key=config.publishable_key,
        currency=config.currency,
        status=payment.status,
        reference=reference,
    )


def _checkout_read(order: Order, payment: Payment, *, course_id: UUID, enrollment_status: EnrollmentStatus, reference: str | None) -> AcademyCheckoutRead:
    return AcademyCheckoutRead(
        order_id=order.id,
        order_number=order.order_number,
        status=order.status,
        course_id=course_id,
        enrollment_status=enrollment_status,
        placed_at=order.placed_at,
        payment=_payment_read(payment, reference),
    )


def buy_course(session: Session, *, user_id: UUID, course_id: UUID) -> AcademyCheckoutRead:
    course = session.get(Course, course_id)
    if course is None or course.deleted_at is not None or not course.is_published:
        raise ApiError(404, "This course is not published")
    if course.price_amount is None:
        raise ApiError(422, "This course does not have a published price")
    existing = _enrollment(session, user_id=user_id, course_id=course.id)
    if existing is not None and existing.status in {EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED}:
        raise ApiError(409, "You are already enrolled in this course")
    if existing is not None and existing.status == EnrollmentStatus.CANCELLED:
        raise ApiError(409, "This enrollment is not active")
    if existing is not None and existing.status == EnrollmentStatus.PENDING and existing.order_item_id is not None:
        item = session.get(OrderItem, existing.order_item_id)
        order = session.get(Order, item.order_id) if item is not None else None
        payment = None
        if order is not None:
            payment = session.scalars(select(Payment).where(Payment.order_id == order.id)).first()
        if order is not None and payment is not None and order.status == OrderStatus.PENDING:
            return _checkout_read(order, payment, course_id=course.id, enrollment_status=existing.status, reference=None)
    amount = _money(course.price_amount)
    order = Order(
        order_number=f"AX-{secrets.token_hex(4).upper()}",
        user_id=user_id,
        status=OrderStatus.PENDING,
        currency=course.currency or "INR",
        subtotal=amount,
        total=amount,
    )
    session.add(order)
    session.flush()
    item = OrderItem(
        order_id=order.id,
        item_type=OrderItemType.COURSE,
        course_id=course.id,
        name_snapshot=course.title,
        unit_price=amount,
        quantity=1,
        line_total=amount,
    )
    session.add(item)
    session.flush()
    if existing is None:
        enrollment = CourseEnrollment(
            user_id=user_id,
            course_id=course.id,
            order_item_id=item.id,
            status=EnrollmentStatus.PENDING,
            source=EnrollmentSource.ORDER,
        )
        session.add(enrollment)
    else:
        existing.order_item_id = item.id
        existing.status = EnrollmentStatus.PENDING
        existing.source = EnrollmentSource.ORDER
        enrollment = existing
    config = payments.public_config()
    payment = Payment(
        order_id=order.id,
        amount=amount,
        currency=config.currency,
        status=PaymentStatus.PENDING,
        provider=config.provider,
    )
    session.add(payment)
    session.flush()
    reference = payments.begin_reference(payment.id)
    if reference:
        session.add(
            PaymentTransaction(
                payment_id=payment.id,
                amount=amount,
                status=PaymentStatus.PENDING,
                provider_reference=reference,
            )
        )
    session.commit()
    session.refresh(order)
    return _checkout_read(order, payment, course_id=course.id, enrollment_status=enrollment.status, reference=reference)


def grant_student(session: Session, user_id: UUID) -> None:
    user = auth_repo.get_user_by_id(session, user_id)
    if user is None:
        return
    if any(link.role.code == RoleCode.STUDENT.value and link.role.deleted_at is None for link in user.roles):
        return
    role = auth_repo.get_role(session, RoleCode.STUDENT)
    session.add(UserRole(user_id=user.id, role_id=role.id))


def fulfill_paid_order(session: Session, order: Order) -> None:
    items = session.scalars(select(OrderItem).where(OrderItem.order_id == order.id, OrderItem.course_id.is_not(None))).all()
    for item in items:
        enrollment = session.scalars(
            select(CourseEnrollment).where(CourseEnrollment.order_item_id == item.id, CourseEnrollment.deleted_at.is_(None))
        ).first()
        if enrollment is None and item.course_id is not None:
            enrollment = _enrollment(session, user_id=order.user_id, course_id=item.course_id)
        if enrollment is None or enrollment.status != EnrollmentStatus.PENDING:
            continue
        enrollment.status = EnrollmentStatus.ACTIVE
        grant_student(session, order.user_id)


def _lesson_ids(course: Course) -> list[UUID]:
    ids: list[UUID] = []
    for module in _sorted_modules(course):
        ids.extend(lesson.id for lesson in _sorted_lessons(module))
    return ids


def _progress_percent(total: int, completed: int) -> int:
    if total == 0:
        return 0
    return round(completed * 100 / total)


def _certificate(course: Course, enrollment: CourseEnrollment) -> CertificateRead:
    issued = enrollment.certificate
    if not course.certificate_enabled:
        return CertificateRead(enabled=False, number=None, status=None)
    if issued is None or issued.status != CertificateStatus.ISSUED:
        return CertificateRead(enabled=True, number=None, status=None)
    return CertificateRead(enabled=True, number=issued.certificate_number, status=issued.status.value)


def _load_study_course(session: Session, course_id: UUID) -> Course | None:
    return session.scalars(_course_query().where(Course.id == course_id, Course.deleted_at.is_(None))).first()


def _require_study_enrollment(session: Session, *, user_id: UUID, course_id: UUID) -> CourseEnrollment:
    enrollment = _enrollment(session, user_id=user_id, course_id=course_id)
    if not _active(enrollment):
        raise ApiError(403, "This course is available after enrollment and successful payment")
    assert enrollment is not None
    return enrollment


def learn(session: Session, *, user_id: UUID, course_id: UUID) -> LearnCourse:
    course = _load_study_course(session, course_id)
    if course is None or not course.is_published:
        raise ApiError(404, "This course is not published")
    enrollment = _require_study_enrollment(session, user_id=user_id, course_id=course.id)
    completed_ids = {
        row.lesson_id
        for row in enrollment.progress_rows
        if row.completed_at is not None
    }
    modules: list[ModuleStudy] = []
    total = 0
    done = 0
    for module in _sorted_modules(course):
        lessons: list[LessonStudy] = []
        for lesson in _sorted_lessons(module):
            total += 1
            finished = lesson.id in completed_ids
            if finished:
                done += 1
            lessons.append(
                LessonStudy(
                    id=lesson.id,
                    title=lesson.title,
                    content_type=lesson.content_type.value,
                    body=lesson.body,
                    external_url=lesson.external_url,
                    completed=finished,
                )
            )
        modules.append(ModuleStudy(id=module.id, title=module.title, lessons=lessons))
    return LearnCourse(
        course_id=course.id,
        title=course.title,
        progress_percent=_progress_percent(total, done),
        certificate=_certificate(course, enrollment),
        modules=modules,
        resources=[
            ResourceAvailability(id=row.id, title=row.title, available=_resource_available(row)) for row in _resource_rows(course)
        ],
    )


def _maybe_issue_certificate(session: Session, course: Course, enrollment: CourseEnrollment, lesson_ids: list[UUID]) -> None:
    if not course.certificate_enabled or not lesson_ids:
        return
    completed = session.scalars(
        select(CourseProgress.lesson_id).where(
            CourseProgress.enrollment_id == enrollment.id,
            CourseProgress.completed_at.is_not(None),
            CourseProgress.lesson_id.in_(lesson_ids),
        )
    ).all()
    if set(completed) != set(lesson_ids):
        return
    enrollment.status = EnrollmentStatus.COMPLETED
    if enrollment.certificate is None:
        session.add(
            Certificate(
                enrollment_id=enrollment.id,
                certificate_number=f"AXC-{secrets.token_hex(4).upper()}",
                status=CertificateStatus.ISSUED,
            )
        )


def complete_lesson(session: Session, *, user_id: UUID, lesson_id: UUID) -> ProgressRead:
    lesson = session.scalars(
        select(CourseLesson)
        .options(selectinload(CourseLesson.module).selectinload(CourseModule.course))
        .where(CourseLesson.id == lesson_id, CourseLesson.deleted_at.is_(None))
    ).first()
    if lesson is None or lesson.module.deleted_at is not None:
        raise ApiError(404, "This lesson is not published")
    course = _load_study_course(session, lesson.module.course_id)
    if course is None:
        raise ApiError(404, "This course is not published")
    enrollment = _require_study_enrollment(session, user_id=user_id, course_id=course.id)
    progress = session.scalars(
        select(CourseProgress).where(CourseProgress.enrollment_id == enrollment.id, CourseProgress.lesson_id == lesson.id)
    ).first()
    if progress is None:
        progress = CourseProgress(enrollment_id=enrollment.id, lesson_id=lesson.id, completed_at=_now())
        session.add(progress)
    elif progress.completed_at is None:
        progress.completed_at = _now()
    session.flush()
    lesson_ids = _lesson_ids(course)
    _maybe_issue_certificate(session, course, enrollment, lesson_ids)
    session.commit()
    session.expire_all()
    enrollment = _enrollment(session, user_id=user_id, course_id=course.id) or enrollment
    course = _load_study_course(session, course.id) or course
    completed = session.scalars(
        select(CourseProgress.lesson_id).where(
            CourseProgress.enrollment_id == enrollment.id,
            CourseProgress.completed_at.is_not(None),
        )
    ).all()
    return ProgressRead(
        lesson_id=lesson.id,
        completed=True,
        progress_percent=_progress_percent(len(lesson_ids), len(set(completed) & set(lesson_ids))),
        certificate=_certificate(course, enrollment),
    )


def dashboard(session: Session, *, user_id: UUID) -> list[EnrollmentSummary]:
    rows = session.scalars(
        select(CourseEnrollment)
        .options(selectinload(CourseEnrollment.course), selectinload(CourseEnrollment.progress_rows), selectinload(CourseEnrollment.certificate))
        .where(CourseEnrollment.user_id == user_id, CourseEnrollment.deleted_at.is_(None))
        .order_by(CourseEnrollment.enrolled_at.desc())
    ).all()
    summaries: list[EnrollmentSummary] = []
    for enrollment in rows:
        course = enrollment.course
        if course is None or course.deleted_at is not None:
            continue
        loaded = _load_study_course(session, course.id)
        total = len(_lesson_ids(loaded)) if loaded is not None else 0
        done = len({row.lesson_id for row in enrollment.progress_rows if row.completed_at is not None})
        summaries.append(
            EnrollmentSummary(
                enrollment_id=enrollment.id,
                course_id=course.id,
                slug=course.slug,
                title=course.title,
                status=enrollment.status,
                progress_percent=_progress_percent(total, done),
                certificate=_certificate(course, enrollment),
            )
        )
    return summaries


def download_resource(session: Session, *, user_id: UUID, resource_id: UUID) -> Path:
    resource = session.scalars(
        select(CourseResource)
        .options(selectinload(CourseResource.course), selectinload(CourseResource.lesson).selectinload(CourseLesson.module))
        .where(CourseResource.id == resource_id, CourseResource.deleted_at.is_(None))
    ).first()
    if resource is None:
        raise ApiError(404, "This download is not available")
    course_id = resource.course_id
    if course_id is None and resource.lesson is not None and resource.lesson.module is not None:
        course_id = resource.lesson.module.course_id
    if course_id is None:
        raise ApiError(404, "This download is not available")
    _require_study_enrollment(session, user_id=user_id, course_id=course_id)
    root = settings.download_storage_dir.strip()
    key = resource.storage_key or ""
    if not root or not key or Path(key).is_absolute() or ".." in Path(key).parts:
        raise ApiError(404, "This download is not available")
    base = Path(root).resolve()
    candidate = (base / key).resolve()
    if base not in candidate.parents or not candidate.is_file():
        raise ApiError(404, "This download is not available")
    return candidate
