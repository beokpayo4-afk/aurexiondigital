import uuid
from decimal import Decimal

import httpx
import pytest

from app.core.config import settings
from app.services import payments
from app.services.api_error import ApiError


@pytest.fixture
def razorpay_keys(monkeypatch):
    monkeypatch.setattr(settings, "payment_provider", "razorpay")
    monkeypatch.setattr(settings, "payment_key_id", "rzp_test_unit")
    monkeypatch.setattr(settings, "payment_key_secret", "unit-secret")


def test_creates_razorpay_order_in_paise(monkeypatch, razorpay_keys) -> None:
    sent: dict[str, object] = {}

    def fake_post(url, *, json, auth, timeout):
        sent.update(url=url, json=json, auth=auth)
        return httpx.Response(200, json={"id": "order_unit123"})

    monkeypatch.setattr(payments.httpx, "post", fake_post)
    payment_id = uuid.uuid4()
    reference = payments.create_razorpay_order(payment_id=payment_id, amount=Decimal("2499.00"), currency="INR", receipt="AX-55FF558C")
    assert reference == "order_unit123"
    assert sent["url"] == payments.RAZORPAY_ORDERS_URL
    assert sent["json"] == {
        "amount": 249900,
        "currency": "INR",
        "receipt": "AX-55FF558C",
        "notes": {"payment_id": str(payment_id), "order_number": "AX-55FF558C"},
    }
    assert sent["auth"] == ("rzp_test_unit", "unit-secret")


def test_razorpay_error_is_reported(monkeypatch, razorpay_keys) -> None:
    monkeypatch.setattr(payments.httpx, "post", lambda *args, **kwargs: httpx.Response(401, json={"error": {}}))
    with pytest.raises(ApiError) as caught:
        payments.create_razorpay_order(payment_id=uuid.uuid4(), amount=Decimal("1.00"), currency="INR", receipt="AX-1")
    assert caught.value.status_code == 502


def test_webhook_needs_a_razorpay_payment_id(monkeypatch) -> None:
    import hashlib
    import hmac
    import json

    monkeypatch.setattr(settings, "payment_webhook_secret", "unit-webhook-secret")

    def signed(entity: dict[str, str]) -> tuple[bytes, str]:
        body = json.dumps({"event": "payment.captured", "payload": {"payment": {"entity": entity}}}).encode()
        return body, hmac.new(b"unit-webhook-secret", body, hashlib.sha256).hexdigest()

    body, signature = signed({"order_id": "order_unit123"})
    assert payments.verify_razorpay_webhook(body, signature) is None
    body, signature = signed({"order_id": "order_unit123", "id": "pay_unit123"})
    event = payments.verify_razorpay_webhook(body, signature)
    assert event == payments.RazorpayEvent(order_reference="order_unit123", payment_reference="pay_unit123")


def test_gateway_needs_razorpay_keys(monkeypatch) -> None:
    monkeypatch.setattr(settings, "payment_provider", "razorpay")
    monkeypatch.setattr(settings, "payment_key_id", "")
    monkeypatch.setattr(settings, "payment_key_secret", "")
    assert payments.public_config().enabled is False
    monkeypatch.setattr(settings, "payment_provider", "other")
    monkeypatch.setattr(settings, "payment_key_id", "key")
    monkeypatch.setattr(settings, "payment_key_secret", "secret")
    assert payments.public_config().enabled is False
