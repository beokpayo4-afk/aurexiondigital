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
from app.models.enums import BusinessArea, QuoteStatus
from app.schemas.common import Page
from app.schemas.leads import QuoteCreate, QuoteRead, QuoteUpdate
from app.services import leads
from app.services.access import is_staff

router = APIRouter(prefix="/quote-requests", tags=["quote-requests"])
_staff = require_roles(RoleCode.ADMIN, RoleCode.STAFF)

_SORT = "Sort field. Prefix with - for descending. Allowed: created_at, name, email."


@router.post(
    "",
    response_model=QuoteRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(limit_forms)],
    summary="Submit a quote request",
    description=(
        "Public. Creates a quote request with status new. A bearer token links the request to that account. "
        "service_id, when sent, must refer to a published service for public callers."
    ),
)
def create_quote(
    data: QuoteCreate,
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
) -> QuoteRead:
    return call_api(
        lambda: leads.create_quote(
            session,
            data,
            user_id=user.id if user is not None else None,
            staff=is_staff(user),
        )
    )


@router.get(
    "",
    response_model=Page[QuoteRead],
    summary="List quote requests",
    description="Admin and staff only. Deleted quote requests are omitted.",
)
def list_quotes(
    page: Annotated[tuple[int, int], Depends(page_params)],
    q: Annotated[str | None, Depends(search_param)],
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
    sort: Annotated[str, Query(description=_SORT)] = "-created_at",
    status_filter: Annotated[QuoteStatus | None, Query(alias="status", description="Filter by quote status.")] = None,
    business_area: Annotated[BusinessArea | None, Query(description="Filter by business area.")] = None,
) -> Page[QuoteRead]:
    page_number, page_size = page
    items, total = call_api(
        lambda: leads.list_quotes(
            session,
            page=page_number,
            page_size=page_size,
            q=q,
            sort=sort,
            status=status_filter,
            business_area=business_area,
        )
    )
    return Page[QuoteRead](items=items, page=page_number, page_size=page_size, total=total)


@router.get(
    "/{quote_id}",
    response_model=QuoteRead,
    summary="Get a quote request",
    description="Admin and staff only.",
)
def get_quote(
    quote_id: UUID,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> QuoteRead:
    quote = leads.get_quote(session, quote_id)
    if quote is None:
        not_found()
    return quote


@router.put(
    "/{quote_id}",
    response_model=QuoteRead,
    summary="Update a quote request",
    description="Admin and staff only. Updates status and the response. Setting a response records who responded and when.",
)
def update_quote(
    quote_id: UUID,
    data: QuoteUpdate,
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(_staff)],
) -> QuoteRead:
    quote = call_api(lambda: leads.update_quote(session, quote_id, data, staff_user_id=user.id))
    if quote is None:
        not_found()
    return quote
