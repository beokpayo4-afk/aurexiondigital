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
from app.models.services import Service, ServicePackage
from app.schemas.commerce import CartItemRead, CartRead, CheckoutCreate, CheckoutRead, DownloadAvailability, PaymentSessionRead
from app.services import payments
from app.services.api_error import ApiError
from app.services.mailer import send_order_confirmation

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
                item_type=OrderItemType.PRODUCT,
                product_id=product.id,
                package_id=None,
                slug=product.slug,
                name=product.name,
                quantity=item.quantity,
                unit_price=item.unit_price_snapshot,
                currency="INR",
                line_total=line,
                is_downloadable=product.is_downloadable,
            )
        )
    for item in cart.items:
        if item.deleted_at is not None or item.package_id is None:
            continue
        package = session.get(ServicePackage, item.package_id)
        if package is None:
            continue
        line = _money(item.unit_price_snapshot * item.quantity)
        subtotal += line
        items.append(
            CartItemRead(
                id=item.id,
                item_type=OrderItemType.PACKAGE,
                product_id=None,
                package_id=package.id,
                slug=package.slug,
                name=package.name,
                quantity=item.quantity,
                unit_price=item.unit_price_snapshot,
                currency="INR",
                line_total=line,
                is_downloadable=False,
            )
        )
    return CartRead(id=cart.id, guest_token=cart.guest_token, currency=currency, subtotal=_money(subtotal), items=items)


def read_cart(session: Session, *, user_id: UUID | None, guest_token: str | None) -> CartRead:
    cart = get_cart(session, user_id=user_id, guest_token=guest_token, create=True)
    assert cart is not None
    return _read_cart(session, cart)


def _load_package(session: Session, package_id: UUID) -> ServicePackage:
    package = session.scalars(
        select(ServicePackage)
        .join(Service, Service.id == ServicePackage.service_id)
        .where(
            ServicePackage.id == package_id,
            ServicePackage.deleted_at.is_(None),
            Service.deleted_at.is_(None),
            ServicePackage.is_published.is_(True),
            Service.is_published.is_(True),
        )
    ).first()
    if package is None or package.price_amount is None:
        raise ApiError(422, "This service package is not available to buy")
    return package


def add_item(
    session: Session,
    *,
    user_id: UUID | None,
    guest_token: str | None,
    product_id: UUID | None,
    package_id: UUID | None,
    quantity: int,
) -> CartRead:
    cart = get_cart(session, user_id=user_id, guest_token=guest_token, create=True)
    assert cart is not None
    if product_id is not None:
        product = _load_product(session, product_id)
        price = _active_price(product)
        assert price is not None
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
    elif package_id is not None:
        package = _load_package(session, package_id)
        assert package.price_amount is not None
        existing = next(
            (item for item in cart.items if item.deleted_at is None and item.package_id == package.id),
            None,
        )
        if existing is None:
            session.add(
                CartItem(
                    cart_id=cart.id,
                    item_type=OrderItemType.PACKAGE,
                    package_id=package.id,
                    quantity=quantity,
                    unit_price_snapshot=_money(package.price_amount),
                )
            )
        else:
            existing.quantity = min(99, existing.quantity + quantity)
            existing.unit_price_snapshot = _money(package.price_amount)
    else:
        raise ApiError(422, "Choose a product or a service package")
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
        if item.deleted_at is not None or (item.product_id is None and item.package_id is None):
            continue
        existing = next(
            (
                row
                for row in user_cart.items
                if row.deleted_at is None
                and (
                    (item.product_id is not None and row.product_id == item.product_id)
                    or (item.package_id is not None and row.package_id == item.package_id)
                )
            ),
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


def _address_lines(label: str, line1: str, line2: str | None, city: str, state: str, postal: str, country: str) -> list[str]:
    lines = [label, line1]
    if line2:
        lines.append(line2)
    lines.append(f"{city}, {state} {postal}")
    lines.append(country)
    return lines


def checkout(session: Session, *, user_id: UUID, details: CheckoutCreate) -> CheckoutRead:
    cart = get_cart(session, user_id=user_id, guest_token=None, create=False)
    if cart is None:
        raise ApiError(422, "The cart is empty")
    lines = [item for item in cart.items if item.deleted_at is None and (item.product_id is not None or item.package_id is not None)]
    if not lines:
        raise ApiError(422, "The cart is empty")
    billing = details.shipping if details.billing_same_as_shipping or details.billing is None else details.billing
    subtotal = _money(sum((item.unit_price_snapshot * item.quantity for item in lines), Decimal("0")))
    order = Order(
        order_number=f"AX-{secrets.token_hex(4).upper()}",
        user_id=user_id,
        status=OrderStatus.PENDING,
        currency="INR",
        subtotal=subtotal,
        total=subtotal,
        customer_name=details.name.strip(),
        customer_email=str(details.email).strip().lower(),
        customer_phone=details.phone.strip(),
        ship_line1=details.shipping.line1.strip(),
        ship_line2=details.shipping.line2.strip() or None,
        ship_city=details.shipping.city.strip(),
        ship_state=details.shipping.state.strip(),
        ship_postal_code=details.shipping.postal_code.strip(),
        ship_country=details.shipping.country.strip(),
        bill_line1=billing.line1.strip(),
        bill_line2=billing.line2.strip() or None,
        bill_city=billing.city.strip(),
        bill_state=billing.state.strip(),
        bill_postal_code=billing.postal_code.strip(),
        bill_country=billing.country.strip(),
    )
    session.add(order)
    session.flush()
    summary_lines: list[str] = []
    for item in lines:
        if item.product_id is not None:
            product = session.get(Product, item.product_id)
            name = product.name if product is not None else "Product"
            item_type = OrderItemType.PRODUCT
        else:
            package = session.get(ServicePackage, item.package_id)
            name = package.name if package is not None else "Service"
            item_type = OrderItemType.PACKAGE
        line_total = _money(item.unit_price_snapshot * item.quantity)
        session.add(
            OrderItem(
                order_id=order.id,
                item_type=item_type,
                product_id=item.product_id,
                package_id=item.package_id,
                name_snapshot=name,
                unit_price=item.unit_price_snapshot,
                quantity=item.quantity,
                line_total=line_total,
            )
        )
        summary_lines.append(f"{name} x {item.quantity} — INR {line_total}")
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
    email_body = "\n".join(
        [
            f"Hello {order.customer_name},",
            "",
            f"Your Aurexion Digital order {order.order_number} is confirmed.",
            f"Total: INR {order.total}",
            f"Payment status: {payment.status.value}",
            "",
            "Items:",
            *summary_lines,
            "",
            *_address_lines(
                "Shipping",
                order.ship_line1 or "",
                order.ship_line2,
                order.ship_city or "",
                order.ship_state or "",
                order.ship_postal_code or "",
                order.ship_country or "",
            ),
            "",
            *_address_lines(
                "Billing",
                order.bill_line1 or "",
                order.bill_line2,
                order.bill_city or "",
                order.bill_state or "",
                order.bill_postal_code or "",
                order.bill_country or "",
            ),
            "",
            "Aurexion Digital Private Limited",
            "Flat No. S2, Plot 129, E6-A, Rera Colony, Nr Sai Board, Bagroda, Bhopal 462026, Madhya Pradesh",
            "aurexiondigital@gmail.com",
            "9153940559",
        ]
    )
    email_sent = send_order_confirmation(
        to=order.customer_email or "",
        subject=f"Order {order.order_number} — Aurexion Digital",
        body=email_body,
    )
    return CheckoutRead(
        order_id=order.id,
        order_number=order.order_number,
        status=order.status,
        currency=order.currency,
        total=order.total,
        placed_at=order.placed_at,
        email_sent=email_sent,
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
