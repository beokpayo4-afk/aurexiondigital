"""End-to-end API journeys for the public site and the admin dashboard.

Each test creates its own rows and deletes them. Passwords and tokens are
assertions only; they are not printed.
"""

import uuid
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import select, text

from app.core.database import SessionLocal
from app.core.roles import RoleCode
from app.main import app
from app.models.enums import OrderStatus, PaymentStatus
from app.models.orders import Order, Payment
from app.models.products import ProductPrice
from app.services.academy import fulfill_paid_order
from app.services.auth import create_user_with_role

client = TestClient(app)
PASSWORD = "correct-horse"


def _email(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4()}@example.com"


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _register(prefix: str) -> tuple[str, str, str]:
    email = _email(prefix)
    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": PASSWORD, "full_name": "Aurexion Customer"},
    )
    assert response.status_code == 201
    body = response.json()
    assert "password" not in body["user"]
    assert "password_hash" not in response.text
    return email, body["access_token"], body["user"]["id"]


def _staff() -> tuple[str, str, str]:
    email = _email("journey-staff")
    with SessionLocal() as session:
        user = create_user_with_role(
            session,
            email=email,
            password=PASSWORD,
            full_name="Journey Staff",
            role=RoleCode.STAFF,
        )
        user_id = str(user.id)
    response = client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    assert response.status_code == 200
    assert "password_hash" not in response.text
    return email, response.json()["access_token"], user_id


def _price(product_id: str, amount: str = "499.00") -> None:
    with SessionLocal() as session:
        session.add(
            ProductPrice(
                product_id=uuid.UUID(product_id),
                amount=Decimal(amount),
                currency="INR",
                is_active=True,
            )
        )
        session.commit()


def _cleanup(
    *,
    emails: list[str],
    service_ids: list[str],
    product_ids: list[str],
    course_ids: list[str],
    user_ids: list[str],
) -> None:
    with SessionLocal() as session:
        for user_id in user_ids:
            session.execute(
                text(
                    "DELETE FROM certificates WHERE enrollment_id IN "
                    "(SELECT id FROM course_enrollments WHERE user_id = :id)"
                ),
                {"id": user_id},
            )
            session.execute(
                text(
                    "DELETE FROM course_progress WHERE enrollment_id IN "
                    "(SELECT id FROM course_enrollments WHERE user_id = :id)"
                ),
                {"id": user_id},
            )
            session.execute(text("DELETE FROM course_enrollments WHERE user_id = :id"), {"id": user_id})
            session.execute(
                text(
                    "DELETE FROM payment_transactions WHERE payment_id IN "
                    "(SELECT id FROM payments WHERE order_id IN (SELECT id FROM orders WHERE user_id = :id))"
                ),
                {"id": user_id},
            )
            session.execute(
                text("DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE user_id = :id)"),
                {"id": user_id},
            )
            session.execute(
                text("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = :id)"),
                {"id": user_id},
            )
            session.execute(text("DELETE FROM orders WHERE user_id = :id"), {"id": user_id})
            session.execute(
                text("DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = :id)"),
                {"id": user_id},
            )
            session.execute(text("DELETE FROM carts WHERE user_id = :id"), {"id": user_id})
        for product_id in product_ids:
            session.execute(text("DELETE FROM product_prices WHERE product_id = :id"), {"id": product_id})
            session.execute(text("DELETE FROM products WHERE id = :id"), {"id": product_id})
        for course_id in course_ids:
            session.execute(text("DELETE FROM courses WHERE id = :id"), {"id": course_id})
        for service_id in service_ids:
            session.execute(
                text(
                    "DELETE FROM package_features WHERE package_id IN "
                    "(SELECT id FROM service_packages WHERE service_id = :id)"
                ),
                {"id": service_id},
            )
            session.execute(text("DELETE FROM service_packages WHERE service_id = :id"), {"id": service_id})
            session.execute(text("DELETE FROM services WHERE id = :id"), {"id": service_id})
        for email in emails:
            session.execute(text("DELETE FROM service_enquiries WHERE email = :email"), {"email": email.lower()})
            session.execute(text("DELETE FROM quote_requests WHERE email = :email"), {"email": email.lower()})
            session.execute(text("DELETE FROM users WHERE email = :email"), {"email": email.lower()})
        session.commit()


def test_visitor_service_enquiry() -> None:
    marker = uuid.uuid4().hex[:12]
    emails: list[str] = []
    service_ids: list[str] = []
    user_ids: list[str] = []
    try:
        staff_email, staff_token, staff_id = _staff()
        emails.append(staff_email)
        user_ids.append(staff_id)
        created = client.post(
            "/api/services",
            headers=_auth(staff_token),
            json={
                "name": f"Growth {marker}",
                "slug": f"growth-{marker}",
                "business_area": "marketing-advertising",
                "summary": "Campaign planning",
                "is_published": True,
            },
        )
        assert created.status_code == 201
        service = created.json()
        service_ids.append(service["id"])

        public = client.get(f"/api/services/{service['slug']}")
        assert public.status_code == 200
        assert public.json()["name"] == service["name"]

        visitor = _email("visitor-enquiry")
        emails.append(visitor)
        denied = client.get("/api/enquiries")
        assert denied.status_code == 401
        enquiry = client.post(
            "/api/enquiries",
            json={
                "name": "Visitor",
                "email": visitor,
                "phone": "9153940559",
                "message": f"Need this service {marker}",
                "service_id": service["id"],
            },
        )
        assert enquiry.status_code == 201
        body = enquiry.json()
        assert body["status"] == "new"
        assert body["service_id"] == service["id"]
        assert "password" not in enquiry.text

        inbox = client.get("/api/enquiries", headers=_auth(staff_token), params={"q": marker, "service_id": service["id"]})
        assert inbox.status_code == 200
        assert inbox.json()["total"] == 1
        assert inbox.json()["items"][0]["service_name"] == service["name"]
    finally:
        _cleanup(emails=emails, service_ids=service_ids, product_ids=[], course_ids=[], user_ids=user_ids)


def test_visitor_custom_quote() -> None:
    marker = uuid.uuid4().hex[:12]
    emails: list[str] = []
    user_ids: list[str] = []
    try:
        staff_email, staff_token, staff_id = _staff()
        emails.append(staff_email)
        user_ids.append(staff_id)
        visitor = _email("visitor-quote")
        emails.append(visitor)
        quote = client.post(
            "/api/quote-requests",
            json={
                "name": "Visitor",
                "email": visitor,
                "phone": "9153940559",
                "organization": f"Brand {marker}",
                "product_service": "Launch campaign",
                "target_location": "Bhopal",
                "target_audience": "Local businesses",
                "estimated_budget": "To be discussed",
                "channels": ["Google Ads", "SEO"],
                "requirements": f"Campaign brief {marker}",
                "business_area": "marketing-advertising",
            },
        )
        assert quote.status_code == 201
        assert quote.json()["status"] == "new"
        assert quote.json()["channels"] == ["Google Ads", "SEO"]
        assert client.get("/api/quote-requests").status_code == 401
        listed = client.get("/api/quote-requests", headers=_auth(staff_token), params={"q": marker})
        assert listed.status_code == 200
        assert listed.json()["total"] == 1
    finally:
        _cleanup(emails=emails, service_ids=[], product_ids=[], course_ids=[], user_ids=user_ids)


def test_customer_product_cart_checkout() -> None:
    marker = uuid.uuid4().hex[:12]
    emails: list[str] = []
    product_ids: list[str] = []
    user_ids: list[str] = []
    try:
        staff_email, staff_token, staff_id = _staff()
        customer_email, customer_token, customer_id = _register("shopper")
        other_email, other_token, other_id = _register("other-shopper")
        emails.extend([staff_email, customer_email, other_email])
        user_ids.extend([staff_id, customer_id, other_id])

        product = client.post(
            "/api/products",
            headers=_auth(staff_token),
            json={
                "name": f"Kit {marker}",
                "slug": f"kit-{marker}",
                "business_area": "technology-digital-products",
                "product_type": "software",
                "listing_channel": "shop",
                "is_published": True,
            },
        )
        assert product.status_code == 201
        product_id = product.json()["id"]
        product_ids.append(product_id)
        assert "download_storage_key" not in product.text
        _price(product_id)

        listed = client.get("/api/products", params={"q": marker, "listing_channel": "shop"})
        assert listed.status_code == 200
        assert listed.json()["total"] == 1

        checkout_body = {
            "name": "Aurexion Customer",
            "email": customer_email,
            "phone": "9153940559",
            "shipping": {
                "line1": "Flat No. S2, Plot 129",
                "city": "Bhopal",
                "state": "Madhya Pradesh",
                "postal_code": "462026",
                "country": "India",
            },
            "billing_same_as_shipping": True,
        }
        anonymous_checkout = client.post("/api/checkout", json=checkout_body)
        assert anonymous_checkout.status_code == 401
        added = client.post(
            "/api/cart/items",
            headers=_auth(customer_token),
            json={"product_id": product_id, "quantity": 1},
        )
        assert added.status_code == 200
        assert added.json()["items"][0]["name"] == f"Kit {marker}"
        assert Decimal(added.json()["subtotal"]) == Decimal("499.00")

        checkout = client.post("/api/checkout", headers=_auth(customer_token), json=checkout_body)
        assert checkout.status_code == 200
        order = checkout.json()
        assert order["status"] == "pending"
        assert "secret" not in checkout.text.lower()
        own = client.get("/api/orders", headers=_auth(customer_token), params={"q": order["order_number"]})
        assert own.status_code == 200
        assert own.json()["total"] == 1
        hidden = client.get(f"/api/orders/{order['order_id']}", headers=_auth(other_token))
        assert hidden.status_code == 404
        emptied = client.get("/api/cart", headers=_auth(customer_token))
        assert emptied.json()["items"] == []
    finally:
        _cleanup(emails=emails, service_ids=[], product_ids=product_ids, course_ids=[], user_ids=user_ids)


def test_student_course_purchase_enrollment() -> None:
    marker = uuid.uuid4().hex[:12]
    emails: list[str] = []
    course_ids: list[str] = []
    user_ids: list[str] = []
    try:
        staff_email, staff_token, staff_id = _staff()
        student_email, student_token, student_id = _register("learner")
        emails.extend([staff_email, student_email])
        user_ids.extend([staff_id, student_id])
        course = client.post(
            "/api/courses",
            headers=_auth(staff_token),
            json={
                "title": f"Starter {marker}",
                "slug": f"starter-{marker}",
                "business_area": "education-academy",
                "price_amount": "1500.00",
                "currency": "INR",
                "is_published": True,
            },
        )
        assert course.status_code == 201
        course_id = course.json()["id"]
        course_ids.append(course_id)
        listed = client.get("/api/courses", params={"q": marker})
        assert listed.status_code == 200
        assert listed.json()["total"] == 1

        assert client.post("/api/academy/checkout", json={"course_id": course_id}).status_code == 401
        purchase = client.post(
            "/api/academy/checkout",
            headers=_auth(student_token),
            json={"course_id": course_id},
        )
        assert purchase.status_code == 200
        body = purchase.json()
        assert body["enrollment_status"] == "pending"
        assert body["course_id"] == course_id
        blocked = client.get(f"/api/academy/study/{course_id}", headers=_auth(student_token))
        assert blocked.status_code == 403

        with SessionLocal() as session:
            order = session.get(Order, uuid.UUID(body["order_id"]))
            assert order is not None
            payment = session.scalars(select(Payment).where(Payment.order_id == order.id)).one()
            payment.status = PaymentStatus.SUCCEEDED
            order.status = OrderStatus.PAID
            fulfill_paid_order(session, order)
            session.commit()

        me = client.get("/api/auth/me", headers=_auth(student_token))
        assert me.status_code == 200
        assert "STUDENT" in me.json()["roles"]
        assert "CUSTOMER" in me.json()["roles"]
        enrollments = client.get("/api/academy/me", headers=_auth(student_token))
        assert enrollments.status_code == 200
        assert enrollments.json()[0]["status"] == "active"
        assert enrollments.json()[0]["course_id"] == course_id
        study = client.get(f"/api/academy/study/{course_id}", headers=_auth(student_token))
        assert study.status_code == 200
        assert study.json()["title"] == f"Starter {marker}"
    finally:
        _cleanup(emails=emails, service_ids=[], product_ids=[], course_ids=course_ids, user_ids=user_ids)


def test_admin_login_and_add_product() -> None:
    marker = uuid.uuid4().hex[:12]
    emails: list[str] = []
    product_ids: list[str] = []
    user_ids: list[str] = []
    try:
        customer_email, customer_token, customer_id = _register("not-admin")
        staff_email, staff_token, staff_id = _staff()
        emails.extend([customer_email, staff_email])
        user_ids.extend([customer_id, staff_id])
        blocked = client.post(
            "/api/products",
            headers=_auth(customer_token),
            json={
                "name": f"Blocked {marker}",
                "business_area": "technology-digital-products",
                "product_type": "software",
                "listing_channel": "shop",
            },
        )
        assert blocked.status_code == 403
        created = client.post(
            "/api/products",
            headers=_auth(staff_token),
            json={
                "name": f"Admin product {marker}",
                "slug": f"admin-product-{marker}",
                "business_area": "technology-digital-products",
                "product_type": "digital",
                "listing_channel": "both",
                "is_published": True,
            },
        )
        assert created.status_code == 201
        product_ids.append(created.json()["id"])
        public = client.get(f"/api/products/admin-product-{marker}")
        assert public.status_code == 200
        assert public.json()["name"] == f"Admin product {marker}"
        assert "download_storage_key" not in public.text
    finally:
        _cleanup(emails=emails, service_ids=[], product_ids=product_ids, course_ids=[], user_ids=user_ids)


def test_admin_add_course() -> None:
    marker = uuid.uuid4().hex[:12]
    emails: list[str] = []
    course_ids: list[str] = []
    user_ids: list[str] = []
    try:
        staff_email, staff_token, staff_id = _staff()
        emails.append(staff_email)
        user_ids.append(staff_id)
        draft = client.post(
            "/api/courses",
            headers=_auth(staff_token),
            json={
                "title": f"Draft course {marker}",
                "slug": f"draft-course-{marker}",
                "business_area": "education-academy",
                "is_published": False,
            },
        )
        assert draft.status_code == 201
        course_ids.append(draft.json()["id"])
        assert client.get(f"/api/courses/draft-course-{marker}").status_code == 404
        published = client.put(
            f"/api/courses/{draft.json()['id']}",
            headers=_auth(staff_token),
            json={"is_published": True, "price_amount": "0.00"},
        )
        assert published.status_code == 200
        visible = client.get(f"/api/courses/draft-course-{marker}")
        assert visible.status_code == 200
        assert visible.json()["title"] == f"Draft course {marker}"
    finally:
        _cleanup(emails=emails, service_ids=[], product_ids=[], course_ids=course_ids, user_ids=user_ids)


def test_admin_manage_enquiry() -> None:
    marker = uuid.uuid4().hex[:12]
    emails: list[str] = []
    user_ids: list[str] = []
    try:
        customer_email, customer_token, customer_id = _register("enquiry-owner")
        staff_email, staff_token, staff_id = _staff()
        emails.extend([customer_email, staff_email])
        user_ids.extend([customer_id, staff_id])
        created = client.post(
            "/api/enquiries",
            json={"name": "Visitor", "email": customer_email, "message": f"Please call {marker}"},
        )
        assert created.status_code == 201
        enquiry_id = created.json()["id"]
        forbidden = client.put(
            f"/api/enquiries/{enquiry_id}",
            headers=_auth(customer_token),
            json={"status": "closed"},
        )
        assert forbidden.status_code == 403
        updated = client.put(
            f"/api/enquiries/{enquiry_id}",
            headers=_auth(staff_token),
            json={"status": "contacted", "assigned_to_user_id": staff_id, "notes": "Called once."},
        )
        assert updated.status_code == 200
        assert updated.json()["status"] == "contacted"
        assert updated.json()["assigned_to_user_id"] == staff_id
        assert updated.json()["notes"] == "Called once."
        filtered = client.get("/api/enquiries", headers=_auth(staff_token), params={"q": marker, "status": "contacted"})
        assert filtered.status_code == 200
        assert filtered.json()["total"] == 1
    finally:
        _cleanup(emails=emails, service_ids=[], product_ids=[], course_ids=[], user_ids=user_ids)
