from __future__ import annotations

import secrets
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.enums import ListingChannel, OrderItemType, OrderStatus, PaymentStatus
from app.models.orders import Cart, CartItem, Order, OrderItem, Payment, PaymentTransaction
from app.models.products import Product, ProductPrice
from app.schemas.commerce import CartItemRead, CartRead, CheckoutRead, DownloadAvailability, PaymentSessionRead
from app.services import payments
from app.services.api_error import ApiError

_SHOP_CHANNELS = {ListingChannel.SHOP, ListingChannel.BOTH}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _money(value: Decimal) -> Decimal:
    return Decimal(value).quantize(Decimal("0.01"))


def _active_price(product: Product) -> ProductPrice | None:
    prices = [price for price in product.prices if price.deleted_at is None and price.is_active and price.variant_id is None]
    if not prices:
        prices = [price for price in product.prices if price.deleted_at is None and price.is_active]
    return prices[0] if prices else None


def _load_product(session: Session, product_id: UUID) -> Product:
    product = session.scalars(
        select(Product).options(selectinload(Product.prices)).where(Product.id == product_id, Product.deleted_at.is_(None))
    ).first()
    if product is None or not product.is_published or product.listing_channel not in _SHOP_CHANNELS:
        raise ApiError(422, "This product is not available in the shop")
    if _active_price(product) is None:
        raise ApiError(422, "This product does not have a published price")
    return product


def _cart_query():
    return select(Cart).options(selectinload(Cart.items))


def get_cart(session: Session, *, user_id: UUID | None, guest_token: str | None, create: bool) -> Cart | None:
    if user_id is not None:
        cart = session.scalars(_cart_query().where(Cart.user_id == user_id, Cart.deleted_at.is_(None))).first()
    elif guest_token:
        cart = session.scalars(_cart_query().where(Cart.guest_token == guest_token, Cart.deleted_at.is_(None))).first()
    else:
        cart = None
    if cart is None and create:
        cart = Cart(user_id=user_id, guest_token=None if user_id else secrets.token_urlsafe(24))
        session.add(cart)
        session.commit()
        session.refresh(cart)
    return cart


def _read_cart(session: Session, cart: Cart) -> CartRead:
    items: list[CartItemRead] = []
    currency = "INR"
    subtotal = Decimal("0.00")
    for item in cart.items:
        if item.deleted_at is not None or item.product_id is None:
            continue
        product = session.get(Product, item.product_id)
        if product is None:
            continue
        currency = "INR"
        line = _money(item.unit_price_snapshot * item.quantity)
        subtotal += line
        items.append(
            CartItemRead(
                id=item.id,
                product_id=product.id,
                slug=product.slug,
                name=product.name,
                quantity=item.quantity,
                unit_price=item.unit_price_snapshot,
                currency="INR",
                line_total=line,
                is_downloadable=product.is_downloadable,
            )
        )
    return CartRead(id=cart.id, guest_token=cart.guest_token, currency=currency, subtotal=_money(subtotal), items=items)


def read_cart(session: Session, *, user_id: UUID | None, guest_token: str | None) -> CartRead:
    cart = get_cart(session, user_id=user_id, guest_token=guest_token, create=True)
    assert cart is not None
    return _read_cart(session, cart)


def add_item(session: Session, *, user_id: UUID | None, guest_token: str | None, product_id: UUID, quantity: int) -> CartRead:
    product = _load_product(session, product_id)
    price = _active_price(product)
    assert price is not None
    cart = get_cart(session, user_id=user_id, guest_token=guest_token, create=True)
    assert cart is not None
    existing = next(
        (item for item in cart.items if item.deleted_at is None and item.product_id == product.id),
        None,
    )
    if existing is None:
        session.add(
            CartItem(
                cart_id=cart.id,
                item_type=OrderItemType.PRODUCT,
                product_id=product.id,
                quantity=quantity,
                unit_price_snapshot=_money(price.amount),
            )
        )
    else:
        existing.quantity = min(99, existing.quantity + quantity)
        existing.unit_price_snapshot = _money(price.amount)
    session.commit()
    session.refresh(cart)
    return _read_cart(session, cart)


def update_item(session: Session, *, user_id: UUID | None, guest_token: str | None, item_id: UUID, quantity: int) -> CartRead:
    cart = get_cart(session, user_id=user_id, guest_token=guest_token, create=False)
    if cart is None:
        raise ApiError(404, "Cart was not found")
    item = next((row for row in cart.items if row.id == item_id and row.deleted_at is None), None)
    if item is None:
        raise ApiError(404, "Cart item was not found")
    item.quantity = quantity
    session.commit()
    return _read_cart(session, cart)


def remove_item(session: Session, *, user_id: UUID | None, guest_token: str | None, item_id: UUID) -> CartRead:
    cart = get_cart(session, user_id=user_id, guest_token=guest_token, create=False)
    if cart is None:
        raise ApiError(404, "Cart was not found")
    item = next((row for row in cart.items if row.id == item_id and row.deleted_at is None), None)
    if item is None:
        raise ApiError(404, "Cart item was not found")
    item.deleted_at = _now()
    session.commit()
    return _read_cart(session, cart)


def claim_cart(session: Session, *, user_id: UUID, guest_token: str | None) -> CartRead:
    user_cart = get_cart(session, user_id=user_id, guest_token=None, create=True)
    assert user_cart is not None
    if not guest_token:
        return _read_cart(session, user_cart)
    guest = session.scalars(_cart_query().where(Cart.guest_token == guest_token, Cart.deleted_at.is_(None))).first()
    if guest is None or guest.id == user_cart.id:
        return _read_cart(session, user_cart)
    for item in guest.items:
        if item.deleted_at is not None or item.product_id is None:
            continue
        existing = next(
            (row for row in user_cart.items if row.deleted_at is None and row.product_id == item.product_id),
            None,
        )
        if existing is None:
            item.cart_id = user_cart.id
        else:
            existing.quantity = min(99, existing.quantity + item.quantity)
            item.deleted_at = _now()
    guest.deleted_at = _now()
    session.commit()
    session.refresh(user_cart)
    return _read_cart(session, user_cart)


def checkout(session: Session, *, user_id: UUID) -> CheckoutRead:
    cart = get_cart(session, user_id=user_id, guest_token=None, create=False)
    if cart is None:
        raise ApiError(422, "The cart is empty")
    lines = [item for item in cart.items if item.deleted_at is None and item.product_id is not None]
    if not lines:
        raise ApiError(422, "The cart is empty")
    subtotal = _money(sum((item.unit_price_snapshot * item.quantity for item in lines), Decimal("0")))
    order = Order(
        order_number=f"AX-{secrets.token_hex(4).upper()}",
        user_id=user_id,
        status=OrderStatus.PENDING,
        currency="INR",
        subtotal=subtotal,
        total=subtotal,
    )
    session.add(order)
    session.flush()
    for item in lines:
        product = session.get(Product, item.product_id)
        name = product.name if product is not None else "Product"
        line_total = _money(item.unit_price_snapshot * item.quantity)
        session.add(
            OrderItem(
                order_id=order.id,
                item_type=OrderItemType.PRODUCT,
                product_id=item.product_id,
                name_snapshot=name,
                unit_price=item.unit_price_snapshot,
                quantity=item.quantity,
                line_total=line_total,
            )
        )
        item.deleted_at = _now()
    config = payments.public_config()
    payment = Payment(
        order_id=order.id,
        amount=subtotal,
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
                amount=subtotal,
                status=PaymentStatus.PENDING,
                provider_reference=reference,
            )
        )
    session.commit()
    session.refresh(order)
    return CheckoutRead(
        order_id=order.id,
        order_number=order.order_number,
        status=order.status,
        currency=order.currency,
        total=order.total,
        placed_at=order.placed_at,
        payment=PaymentSessionRead(
            enabled=config.enabled,
            provider=config.provider,
            publishable_key=config.publishable_key,
            currency=config.currency,
            status=payment.status,
            reference=reference,
        ),
    )


def apply_webhook(session: Session, body: bytes, signature: str | None) -> None:
    event = payments.verify_webhook(body, signature)
    payment = session.get(Payment, event.payment_id)
    if payment is None:
        raise ApiError(404, "Payment was not found")
    if payment.status == PaymentStatus.SUCCEEDED:
        return
    payment.status = PaymentStatus.SUCCEEDED if event.status == "succeeded" else PaymentStatus.FAILED
    if event.provider_reference:
        session.add(
            PaymentTransaction(
                payment_id=payment.id,
                amount=payment.amount,
                status=payment.status,
                provider_reference=event.provider_reference,
            )
        )
    if payment.status == PaymentStatus.SUCCEEDED:
        order = session.get(Order, payment.order_id)
        if order is not None and order.status == OrderStatus.PENDING:
            order.status = OrderStatus.PAID
            from app.services.academy import fulfill_paid_order

            fulfill_paid_order(session, order)
    session.commit()


def download_file(session: Session, *, user_id: UUID, order_id: UUID, item_id: UUID) -> Path:
    order = session.scalars(
        select(Order).options(selectinload(Order.items), selectinload(Order.payments)).where(Order.id == order_id, Order.user_id == user_id)
    ).first()
    if order is None:
        raise ApiError(404, "Order was not found")
    paid = order.status in {OrderStatus.PAID, OrderStatus.FULFILLED} and any(
        payment.status == PaymentStatus.SUCCEEDED for payment in order.payments
    )
    if not paid:
        raise ApiError(403, "This download is available after payment succeeds")
    item = next((row for row in order.items if row.id == item_id and row.product_id is not None), None)
    if item is None:
        raise ApiError(404, "Order item was not found")
    product = session.get(Product, item.product_id)
    if product is None or not product.is_downloadable or not product.download_storage_key:
        raise ApiError(404, "This download is not available")
    root = settings.download_storage_dir.strip()
    key = product.download_storage_key
    if not root or not key or Path(key).is_absolute() or ".." in Path(key).parts:
        raise ApiError(404, "This download is not available")
    base = Path(root).resolve()
    candidate = (base / key).resolve()
    if base not in candidate.parents or not candidate.is_file():
        raise ApiError(404, "This download is not available")
    return candidate


def download_flags(session: Session, *, user_id: UUID, order_id: UUID) -> list[DownloadAvailability]:
    order = session.scalars(
        select(Order).options(selectinload(Order.items), selectinload(Order.payments)).where(Order.id == order_id, Order.user_id == user_id)
    ).first()
    if order is None:
        raise ApiError(404, "Order was not found")
    paid = order.status in {OrderStatus.PAID, OrderStatus.FULFILLED} and any(
        payment.status == PaymentStatus.SUCCEEDED for payment in order.payments
    )
    flags: list[DownloadAvailability] = []
    for item in order.items:
        if item.product_id is None:
            continue
        product = session.get(Product, item.product_id)
        if product is None or not product.is_downloadable:
            continue
        ready = bool(paid and product.download_storage_key and settings.download_storage_dir.strip())
        flags.append(DownloadAvailability(order_item_id=item.id, name=item.name_snapshot, available=ready))
    return flags
