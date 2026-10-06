from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.api.http import call_api
from app.api.listing import page_params, search_param
from app.core.rate_limit import limit_forms
from app.core.roles import RoleCode
from app.models.auth import User
from app.models.enums import LeadStatus
from app.schemas.common import Page
from app.schemas.leads import ContactCreate, ContactRead
from app.services import leads

router = APIRouter(prefix="/contact", tags=["contact"])
_staff = require_roles(RoleCode.ADMIN, RoleCode.STAFF)

_SORT = "Sort field. Prefix with - for descending. Allowed: created_at, name, email."


@router.post(
    "",
    response_model=ContactRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(limit_forms)],
    summary="Submit a contact message",
    description="Public. Creates a contact submission with status new.",
)
def create_contact(
    data: ContactCreate,
    session: Annotated[Session, Depends(get_db)],
) -> ContactRead:
    return leads.create_contact(session, data)


@router.get(
    "",
    response_model=Page[ContactRead],
    summary="List contact messages",
    description="Admin and staff only. Deleted submissions are omitted.",
)
def list_contacts(
    page: Annotated[tuple[int, int], Depends(page_params)],
    q: Annotated[str | None, Depends(search_param)],
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
    sort: Annotated[str, Query(description=_SORT)] = "-created_at",
    status_filter: Annotated[LeadStatus | None, Query(alias="status", description="Filter by lead status.")] = None,
) -> Page[ContactRead]:
    page_number, page_size = page
    items, total = call_api(
        lambda: leads.list_contacts(
            session,
            page=page_number,
            page_size=page_size,
            q=q,
            sort=sort,
            status=status_filter,
        )
    )
    return Page[ContactRead](items=items, page=page_number, page_size=page_size, total=total)
