from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.listing import apply_sort, like_pattern, paginate
from app.models.auth import User
from app.models.enums import LeadStatus, QuoteStatus
from app.models.leads import ContactSubmission, QuoteRequest, ServiceEnquiry
from app.models.services import Service
from app.schemas.leads import ContactCreate, ContactRead, EnquiryCreate, EnquiryRead, EnquiryUpdate, QuoteCreate, QuoteRead, QuoteUpdate
from app.services.access import is_staff
from app.services.api_error import ApiError


def _sort(statement, columns, sort, tie_break):
    try:
        return apply_sort(statement, columns, sort, tie_break)
    except ValueError as exc:
        raise ApiError(422, str(exc)) from exc


def _search(statement, columns, q: str | None):
    if not q:
        return statement
    pattern = like_pattern(q)
    return statement.where(or_(*(column.ilike(pattern, escape="\\") for column in columns)))


def _visible_service(session: Session, service_id: UUID | None, *, staff: bool) -> None:
    if service_id is None:
        return
    service = session.get(Service, service_id)
    if service is None or service.deleted_at is not None or (not staff and not service.is_published):
        raise ApiError(422, "Service was not found")


def _text(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _enquiry_query():
    return select(ServiceEnquiry).options(
        selectinload(ServiceEnquiry.service),
        selectinload(ServiceEnquiry.assigned_to),
    )


def _enquiry_read(enquiry: ServiceEnquiry) -> EnquiryRead:
    service_name = None
    if enquiry.service is not None and enquiry.service.deleted_at is None:
        service_name = enquiry.service.name
    assigned_name = enquiry.assigned_to.full_name if enquiry.assigned_to is not None else None
    return EnquiryRead(
        id=enquiry.id,
        user_id=enquiry.user_id,
        service_id=enquiry.service_id,
        service_name=service_name,
        name=enquiry.name,
        email=enquiry.email,
        phone=enquiry.phone,
        company_name=enquiry.company_name,
        message=enquiry.message,
        notes=enquiry.notes,
        status=enquiry.status,
        assigned_to_user_id=enquiry.assigned_to_user_id,
        assigned_to_name=assigned_name,
        created_at=enquiry.created_at,
        updated_at=enquiry.updated_at,
    )


def _require_staff_assignee(session: Session, user_id: UUID | None) -> None:
    if user_id is None:
        return
    user = session.get(User, user_id)
    if user is None or user.deleted_at is not None or not user.is_active or not is_staff(user):
        raise ApiError(422, "Choose an admin or staff account")


def create_enquiry(session: Session, data: EnquiryCreate, *, user_id: UUID | None, staff: bool) -> EnquiryRead:
    _visible_service(session, data.service_id, staff=staff)
    enquiry = ServiceEnquiry(
        name=data.name.strip(),
        email=str(data.email).lower(),
        phone=_text(data.phone),
        company_name=_text(data.company_name),
        message=data.message.strip(),
        service_id=data.service_id,
        user_id=user_id,
        status=LeadStatus.NEW,
    )
    session.add(enquiry)
    session.commit()
    session.refresh(enquiry)
    return _enquiry_read(enquiry)


def list_enquiries(
    session: Session,
    *,
    page: int,
    page_size: int,
    q: str | None,
    sort: str,
    status: LeadStatus | None,
    service_id: UUID | None,
) -> tuple[list[EnquiryRead], int]:
    statement = _enquiry_query().where(ServiceEnquiry.deleted_at.is_(None))
    if status is not None:
        statement = statement.where(ServiceEnquiry.status == status)
    if service_id is not None:
        statement = statement.where(ServiceEnquiry.service_id == service_id)
    statement = _search(
        statement,
        [ServiceEnquiry.name, ServiceEnquiry.email, ServiceEnquiry.company_name, ServiceEnquiry.message],
        q,
    )
    statement = _sort(
        statement,
        {"created_at": ServiceEnquiry.created_at, "name": ServiceEnquiry.name, "email": ServiceEnquiry.email},
        sort,
        ServiceEnquiry.id,
    )
    rows, total = paginate(session, statement, page, page_size)
    return [_enquiry_read(row) for row in rows], total


def get_enquiry(session: Session, enquiry_id: UUID) -> EnquiryRead | None:
    enquiry = session.scalars(_enquiry_query().where(ServiceEnquiry.id == enquiry_id)).first()
    if enquiry is None or enquiry.deleted_at is not None:
        return None
    return _enquiry_read(enquiry)


def update_enquiry(session: Session, enquiry_id: UUID, data: EnquiryUpdate) -> EnquiryRead | None:
    enquiry = session.scalars(_enquiry_query().where(ServiceEnquiry.id == enquiry_id)).first()
    if enquiry is None or enquiry.deleted_at is not None:
        return None
    changes = data.model_dump(exclude_unset=True)
    if not changes:
        raise ApiError(422, "No fields to update")
    if "assigned_to_user_id" in changes:
        _require_staff_assignee(session, changes["assigned_to_user_id"])
        enquiry.assigned_to_user_id = changes["assigned_to_user_id"]
    if "notes" in changes:
        enquiry.notes = _text(changes["notes"])
    if "status" in changes and changes["status"] is not None:
        enquiry.status = changes["status"]
    session.commit()
    saved = session.scalars(_enquiry_query().where(ServiceEnquiry.id == enquiry.id)).first()
    if saved is None:
        raise ApiError(500, "Could not save the enquiry")
    return _enquiry_read(saved)


def create_quote(session: Session, data: QuoteCreate, *, user_id: UUID | None, staff: bool) -> QuoteRead:
    _visible_service(session, data.service_id, staff=staff)
    quote = QuoteRequest(
        name=data.name.strip(),
        email=str(data.email).lower(),
        phone=data.phone,
        organization=data.organization.strip() if data.organization else None,
        product_service=data.product_service.strip() if data.product_service else None,
        target_location=data.target_location.strip() if data.target_location else None,
        target_audience=data.target_audience.strip() if data.target_audience else None,
        estimated_budget=data.estimated_budget.strip() if data.estimated_budget else None,
        channels=list(data.channels),
        requirements=data.requirements,
        business_area=data.business_area,
        service_id=data.service_id,
        user_id=user_id,
        status=QuoteStatus.NEW,
    )
    session.add(quote)
    session.commit()
    session.refresh(quote)
    return QuoteRead.model_validate(quote)


def list_quotes(
    session: Session,
    *,
    page: int,
    page_size: int,
    q: str | None,
    sort: str,
    status: QuoteStatus | None,
    business_area,
) -> tuple[list[QuoteRead], int]:
    statement = select(QuoteRequest).where(QuoteRequest.deleted_at.is_(None))
    if status is not None:
        statement = statement.where(QuoteRequest.status == status)
    if business_area is not None:
        statement = statement.where(QuoteRequest.business_area == business_area)
    statement = _search(
        statement,
        [QuoteRequest.name, QuoteRequest.email, QuoteRequest.organization, QuoteRequest.requirements],
        q,
    )
    statement = _sort(
        statement,
        {"created_at": QuoteRequest.created_at, "name": QuoteRequest.name, "email": QuoteRequest.email},
        sort,
        QuoteRequest.id,
    )
    rows, total = paginate(session, statement, page, page_size)
    return [QuoteRead.model_validate(row) for row in rows], total


def get_quote(session: Session, quote_id: UUID) -> QuoteRead | None:
    quote = session.get(QuoteRequest, quote_id)
    if quote is None or quote.deleted_at is not None:
        return None
    return QuoteRead.model_validate(quote)


def update_quote(session: Session, quote_id: UUID, data: QuoteUpdate, *, staff_user_id: UUID) -> QuoteRead | None:
    quote = session.get(QuoteRequest, quote_id)
    if quote is None or quote.deleted_at is not None:
        return None
    changes = data.model_dump(exclude_unset=True)
    if not changes:
        raise ApiError(422, "No fields to update")
    for key, value in changes.items():
        setattr(quote, key, value)
    if "response_message" in changes or "response_amount" in changes:
        quote.responded_at = datetime.now(timezone.utc)
        quote.responded_by_user_id = staff_user_id
    session.commit()
    session.refresh(quote)
    return QuoteRead.model_validate(quote)


def create_contact(session: Session, data: ContactCreate) -> ContactRead:
    promote = _text(data.promote)
    subject = _text(data.subject) or (promote[:200] if promote else None)
    if subject is None:
        raise ApiError(422, "Describe what you want to promote or build")
    contact = ContactSubmission(
        name=data.name.strip(),
        email=str(data.email).lower(),
        phone=_text(data.phone),
        company_name=_text(data.company_name),
        promote=promote,
        interest=data.interest,
        channel=data.channel,
        budget=_text(data.budget),
        target_location=_text(data.target_location),
        subject=subject,
        message=data.message.strip(),
        source_path=data.source_path,
        status=LeadStatus.NEW,
    )
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return ContactRead.model_validate(contact)


def list_contacts(
    session: Session,
    *,
    page: int,
    page_size: int,
    q: str | None,
    sort: str,
    status: LeadStatus | None,
) -> tuple[list[ContactRead], int]:
    statement = select(ContactSubmission).where(ContactSubmission.deleted_at.is_(None))
    if status is not None:
        statement = statement.where(ContactSubmission.status == status)
    statement = _search(
        statement,
        [
            ContactSubmission.name,
            ContactSubmission.email,
            ContactSubmission.company_name,
            ContactSubmission.subject,
            ContactSubmission.promote,
            ContactSubmission.message,
        ],
        q,
    )
    statement = _sort(
        statement,
        {"created_at": ContactSubmission.created_at, "name": ContactSubmission.name, "email": ContactSubmission.email},
        sort,
        ContactSubmission.id,
    )
    rows, total = paginate(session, statement, page, page_size)
    return [ContactRead.model_validate(row) for row in rows], total
