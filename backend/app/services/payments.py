from __future__ import annotations

import hashlib
import hmac
import json
from dataclasses import dataclass
from uuid import UUID

from app.core.config import settings
from app.services.api_error import ApiError


@dataclass(frozen=True)
class PaymentPublicConfig:
    enabled: bool
    provider: str | None
    publishable_key: str | None
    currency: str


@dataclass(frozen=True)
class PaymentEvent:
    payment_id: UUID
    status: str
    provider_reference: str | None


def public_config() -> PaymentPublicConfig:
    provider = settings.payment_provider.strip() or None
    publishable = settings.payment_key_id.strip() or None
    enabled = bool(provider and publishable and settings.payment_key_secret.strip())
    return PaymentPublicConfig(
        enabled=enabled,
        provider=provider if enabled else None,
        publishable_key=publishable if enabled else None,
        currency=(settings.payment_currency or "INR").upper(),
    )


def begin_reference(payment_id: UUID) -> str | None:
    """Return a provider reference without sending the secret key anywhere."""
    config = public_config()
    if not config.enabled:
        return None
    return f"{config.provider}:{payment_id}"


def verify_webhook(body: bytes, signature: str | None) -> PaymentEvent:
    secret = settings.payment_webhook_secret.strip()
    if not secret:
        raise ApiError(503, "Payment webhook is not configured")
    if not signature:
        raise ApiError(401, "Invalid payment signature")
    expected = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
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
