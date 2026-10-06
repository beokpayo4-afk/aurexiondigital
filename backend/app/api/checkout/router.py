from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request
from uuid import UUID
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.api.files import download_response
from app.api.http import call_api
from app.models.auth import User
from app.schemas.commerce import CheckoutCreate, CheckoutRead, DownloadAvailability, PaymentSessionRead
from app.services import commerce, payments

router = APIRouter(tags=["payments"])


@router.get("/payments/config", response_model=PaymentSessionRead, summary="Public payment configuration")
def payment_config() -> PaymentSessionRead:
    config = payments.public_config()
    return PaymentSessionRead(
        enabled=config.enabled,
        provider=config.provider,
        publishable_key=config.publishable_key,
        currency=config.currency,
        status="pending",
        reference=None,
    )


@router.post("/checkout", response_model=CheckoutRead, summary="Create an order from the signed-in cart")
def checkout(
    details: CheckoutCreate,
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> CheckoutRead:
    return call_api(lambda: commerce.checkout(session, user_id=user.id, details=details))


@router.post("/payments/webhook", status_code=204, summary="Record a verified payment result")
async def payment_webhook(
    request: Request,
    session: Annotated[Session, Depends(get_db)],
    signature: Annotated[str | None, Header(alias="X-Payment-Signature")] = None,
) -> None:
    body = await request.body()
    call_api(lambda: commerce.apply_webhook(session, body, signature))


@router.get(
    "/orders/{order_id}/downloads",
    response_model=list[DownloadAvailability],
    summary="List downloadable items without file locations",
)
def list_downloads(
    order_id: UUID,
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[DownloadAvailability]:
    return call_api(lambda: commerce.download_flags(session, user_id=user.id, order_id=order_id))


@router.get("/orders/{order_id}/items/{item_id}/download", summary="Download a paid digital file")
def download_item(
    order_id: UUID,
    item_id: UUID,
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    path = call_api(lambda: commerce.download_file(session, user_id=user.id, order_id=order_id, item_id=item_id))
    return download_response(path)
