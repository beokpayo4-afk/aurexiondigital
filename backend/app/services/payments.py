from __future__ import annotations

import hashlib
import hmac
import json
from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

import httpx

from app.core.config import settings
from app.services.api_error import ApiError

RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders"
RAZORPAY_SUCCESS_EVENTS = {"payment.captured", "order.paid"}


@dataclass(frozen=True)
class PaymentPublicConfig:
    enabled: bool
    provider: str | None
    publishable_key: str | None
    currency: str
    payment_link: str | None = None
    upi_id: str | None = None

    @property
    def manual(self) -> bool:
        return bool(self.payment_link or self.upi_id)


@dataclass(frozen=True)
class PaymentEvent:
    payment_id: UUID
    status: str
    provider_reference: str | None


@dataclass(frozen=True)
class RazorpayEvent:
    order_reference: str
    payment_reference: str | None


def public_config() -> PaymentPublicConfig:
    provider = settings.payment_provider.strip().lower() or None
    publishable = settings.payment_key_id.strip() or None
    enabled = bool(provider == "razorpay" and publishable and settings.payment_key_secret.strip())
    return PaymentPublicConfig(
        enabled=enabled,
        provider=provider if enabled else None,
        publishable_key=publishable if enabled else None,
        currency=(settings.payment_currency or "INR").upper(),
        payment_link=settings.payment_link_url.strip() or None,
        upi_id=settings.payment_upi_id.strip() or None,
    )


def _sign(secret: str, message: bytes) -> str:
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()


def create_razorpay_order(*, payment_id: UUID, amount: Decimal, currency: str, receipt: str) -> str:
    """Create a Razorpay order on the server. The key secret never leaves this process."""
    if not public_config().enabled:
        raise ApiError(503, "Payment could not be started because no payment gateway is connected.")
    body = {
        "amount": int((amount * 100).to_integral_value()),
        "currency": currency,
        "receipt": receipt[:40],
        "notes": {"payment_id": str(payment_id), "order_number": receipt},
    }
    try:
        response = httpx.post(
            RAZORPAY_ORDERS_URL,
            json=body,
            auth=(settings.payment_key_id.strip(), settings.payment_key_secret.strip()),
            timeout=15,
        )
    except httpx.HTTPError as exc:
        raise ApiError(502, "Razorpay could not start the payment. Try again.") from exc
    if response.status_code >= 400:
        raise ApiError(502, "Razorpay could not start the payment. Try again.")
    reference = response.json().get("id")
    if not isinstance(reference, str) or not reference:
        raise ApiError(502, "Razorpay could not start the payment. Try again.")
    return reference


def verify_checkout_signature(*, order_reference: str, payment_reference: str, signature: str) -> bool:
    secret = settings.payment_key_secret.strip()
    if not secret or not signature:
        return False
    expected = _sign(secret, f"{order_reference}|{payment_reference}".encode("utf-8"))
    return hmac.compare_digest(expected, signature.strip())


def verify_razorpay_webhook(body: bytes, signature: str | None) -> RazorpayEvent | None:
    secret = settings.payment_webhook_secret.strip()
    if not secret:
        raise ApiError(503, "Payment webhook is not configured")
    if not signature or not hmac.compare_digest(_sign(secret, body), signature.strip()):
        raise ApiError(401, "Invalid payment signature")
    try:
        payload = json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ApiError(422, "Payment webhook body is not valid JSON") from exc
    if payload.get("event") not in RAZORPAY_SUCCESS_EVENTS:
        return None
    entity = (payload.get("payload") or {}).get("payment", {}).get("entity") or {}
    order_reference = entity.get("order_id")
    if not isinstance(order_reference, str) or not order_reference:
        return None
    payment_reference = entity.get("id")
    return RazorpayEvent(
        order_reference=order_reference,
        payment_reference=payment_reference if isinstance(payment_reference, str) else None,
    )


def verify_webhook(body: bytes, signature: str | None) -> PaymentEvent:
    secret = settings.payment_webhook_secret.strip()
    if not secret:
        raise ApiError(503, "Payment webhook is not configured")
    if not signature:
        raise ApiError(401, "Invalid payment signature")
    expected = _sign(secret, body)
    if not hmac.compare_digest(expected, signature.strip()):
        raise ApiError(401, "Invalid payment signature")
    try:
        payload = json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ApiError(422, "Payment webhook body is not valid JSON") from exc
    payment_id = payload.get("payment_id")
    status = payload.get("status")
    if not isinstance(payment_id, str) or status not in {"succeeded", "failed"}:
        raise ApiError(422, "Payment webhook is missing payment_id or status")
    try:
        parsed_id = UUID(payment_id)
    except ValueError as exc:
        raise ApiError(422, "Payment webhook payment_id is not a UUID") from exc
    reference = payload.get("provider_reference")
    return PaymentEvent(
        payment_id=parsed_id,
        status=status,
        provider_reference=reference if isinstance(reference, str) else None,
    )
