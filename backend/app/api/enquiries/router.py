from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_optional_user, require_roles
from app.api.http import call_api, not_found
from app.api.listing import page_params, search_param
from app.core.rate_limit import limit_forms
from app.core.roles import RoleCode
from app.models.auth import User
from app.models.enums import LeadStatus
from app.schemas.common import Page
from app.schemas.leads import EnquiryCreate, EnquiryRead, EnquiryUpdate
from app.services import leads
from app.services.access import is_staff

router = APIRouter(prefix="/enquiries", tags=["enquiries"])
_staff = require_roles(RoleCode.ADMIN, RoleCode.STAFF)

_SORT = "Sort field. Prefix with - for descending. Allowed: created_at, name, email."


@router.post(
    "",
    response_model=EnquiryRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(limit_forms)],
    summary="Submit a service enquiry",
    description=(
        "Public. Creates an enquiry with status new. If a bearer token is sent, the enquiry is linked to that account. "
        "service_id is optional and must refer to a published service for public callers."
    ),
)
def create_enquiry(
    data: EnquiryCreate,
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
) -> EnquiryRead:
    return call_api(
        lambda: leads.create_enquiry(
            session,
            data,
            user_id=user.id if user is not None else None,
            staff=is_staff(user),
        )
    )


@router.get(
    "",
    response_model=Page[EnquiryRead],
    summary="List enquiries",
    description="Admin and staff only. Deleted enquiries are omitted.",
)
def list_enquiries(
    page: Annotated[tuple[int, int], Depends(page_params)],
    q: Annotated[str | None, Depends(search_param)],
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
    sort: Annotated[str, Query(description=_SORT)] = "-created_at",
    status_filter: Annotated[LeadStatus | None, Query(alias="status", description="Filter by lead status.")] = None,
    service_id: Annotated[UUID | None, Query(description="Filter by service id.")] = None,
) -> Page[EnquiryRead]:
    page_number, page_size = page
    items, total = call_api(
        lambda: leads.list_enquiries(
            session,
            page=page_number,
            page_size=page_size,
            q=q,
            sort=sort,
            status=status_filter,
            service_id=service_id,
        )
    )
    return Page[EnquiryRead](items=items, page=page_number, page_size=page_size, total=total)


@router.get(
    "/{enquiry_id}",
    response_model=EnquiryRead,
    summary="Get an enquiry",
    description="Admin and staff only.",
)
def get_enquiry(
    enquiry_id: UUID,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> EnquiryRead:
    enquiry = leads.get_enquiry(session, enquiry_id)
    if enquiry is None:
        not_found()
    return enquiry


@router.put(
    "/{enquiry_id}",
    response_model=EnquiryRead,
    summary="Update an enquiry",
    description="Admin and staff only. Updates status, staff assignment, or notes.",
)
def update_enquiry(
    enquiry_id: UUID,
    data: EnquiryUpdate,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> EnquiryRead:
    enquiry = call_api(lambda: leads.update_enquiry(session, enquiry_id, data))
    if enquiry is None:
        not_found()
    return enquiry
