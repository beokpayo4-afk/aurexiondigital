import uuid
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.core.database import SessionLocal
from app.core.roles import RoleCode
from app.main import app
from app.models.content import Testimonial
from app.models.enums import OrderStatus
from app.models.orders import Order
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
    return email, body["access_token"], body["user"]["id"]


def _staff() -> tuple[str, str, str]:
    email = _email("staff")
    with SessionLocal() as session:
        user = create_user_with_role(
            session,
            email=email,
            password=PASSWORD,
            full_name="Aurexion Staff",
            role=RoleCode.STAFF,
        )
        user_id = str(user.id)
    response = client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    assert response.status_code == 200
    return email, response.json()["access_token"], user_id


def _cleanup(*, emails: list[str], service_ids: list[str], category_ids: list[str], product_ids: list[str], course_ids: list[str], user_ids: list[str]) -> None:
    with SessionLocal() as session:
        for service_id in service_ids:
            session.execute(
                text("DELETE FROM package_features WHERE package_id IN (SELECT id FROM service_packages WHERE service_id = :id)"),
                {"id": service_id},
            )
            session.execute(text("DELETE FROM service_packages WHERE service_id = :id"), {"id": service_id})
            session.execute(text("DELETE FROM services WHERE id = :id"), {"id": service_id})
        for product_id in product_ids:
            session.execute(text("DELETE FROM product_prices WHERE product_id = :id"), {"id": product_id})
            session.execute(text("DELETE FROM products WHERE id = :id"), {"id": product_id})
        for course_id in course_ids:
            session.execute(text("DELETE FROM courses WHERE id = :id"), {"id": course_id})
        for category_id in category_ids:
            session.execute(text("DELETE FROM service_categories WHERE id = :id"), {"id": category_id})
            session.execute(text("DELETE FROM product_categories WHERE id = :id"), {"id": category_id})
            session.execute(text("DELETE FROM course_categories WHERE id = :id"), {"id": category_id})
        for email in emails:
            session.execute(text("DELETE FROM service_enquiries WHERE email = :email"), {"email": email.lower()})
            session.execute(text("DELETE FROM quote_requests WHERE email = :email"), {"email": email.lower()})
            session.execute(text("DELETE FROM contact_submissions WHERE email = :email"), {"email": email.lower()})
        for user_id in user_ids:
            session.execute(text("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = :id)"), {"id": user_id})
            session.execute(text("DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE user_id = :id)"), {"id": user_id})
            session.execute(text("DELETE FROM orders WHERE user_id = :id"), {"id": user_id})
        for email in emails:
            session.execute(text("DELETE FROM users WHERE email = :email"), {"email": email.lower()})
        session.commit()


def test_openapi_lists_core_routes() -> None:
    response = client.get("/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    expected = [
        "/api/services",
        "/api/services/{slug}",
        "/api/services/{service_id}",
        "/api/service-packages",
        "/api/service-packages/{package_id}",
        "/api/products",
        "/api/products/{slug}",
        "/api/products/{product_id}",
        "/api/categories",
        "/api/categories/{category_id}",
        "/api/courses",
        "/api/courses/{slug}",
        "/api/courses/{course_id}",
        "/api/enquiries",
        "/api/enquiries/{enquiry_id}",
        "/api/quote-requests",
        "/api/quote-requests/{quote_id}",
        "/api/contact",
        "/api/orders",
        "/api/orders/{order_id}",
        "/api/testimonials",
    ]
    for path in expected:
        assert path in paths


def test_catalog_visibility_and_staff_writes() -> None:
    marker = uuid.uuid4().hex[:12]
    emails: list[str] = []
    service_ids: list[str] = []
    category_ids: list[str] = []
    product_ids: list[str] = []
    course_ids: list[str] = []
    user_ids: list[str] = []
    try:
        customer_email, customer_token, customer_id = _register("catalog-customer")
        staff_email, staff_token, staff_id = _staff()
        emails.extend([customer_email, staff_email])
        user_ids.extend([customer_id, staff_id])
        staff_headers = _auth(staff_token)
        customer_headers = _auth(customer_token)

        denied = client.post(
            "/api/services",
            headers=customer_headers,
            json={"name": f"Hidden {marker}", "business_area": "technology-digital-products"},
        )
        assert denied.status_code == 403
        assert denied.json()["code"] == "forbidden"
        anonymous = client.post(
            "/api/services",
            json={"name": f"Hidden {marker}", "business_area": "technology-digital-products"},
        )
        assert anonymous.status_code == 401

        created = client.post(
            "/api/services",
            headers=staff_headers,
            json={
                "name": f"Platform {marker}",
                "slug": f"platform-{marker}",
                "business_area": "technology-digital-products",
                "summary": f"summary {marker}",
            },
        )
        assert created.status_code == 201
        service = created.json()
        service_ids.append(service["id"])
        assert service["is_published"] is False
        assert client.get(f"/api/services/{service['slug']}").status_code == 404
        hidden = client.get("/api/services", params={"q": marker, "is_published": False})
        assert hidden.status_code == 200
        assert hidden.json()["total"] == 0

        staff_view = client.get(f"/api/services/{service['slug']}", headers=staff_headers)
        assert staff_view.status_code == 200
        published = client.put(
            f"/api/services/{service['id']}",
            headers=staff_headers,
            json={"is_published": True},
        )
        assert published.status_code == 200
        public = client.get("/api/services", params={"q": marker, "business_area": "technology-digital-products"})
        assert public.status_code == 200
        body = public.json()
        assert body["page"] == 1
        assert body["total"] == 1
        assert body["items"][0]["slug"] == service["slug"]

        package = client.post(
            "/api/service-packages",
            headers=staff_headers,
            json={"service_id": service["id"], "name": f"Package {marker}", "price_amount": "1500.00", "currency": "inr"},
        )
        assert package.status_code == 201
        package_body = package.json()
        assert package_body["currency"] == "INR"
        assert client.get(f"/api/service-packages/{package_body['id']}").status_code == 404
        client.put(
            f"/api/service-packages/{package_body['id']}",
            headers=staff_headers,
            json={"is_published": True},
        )
        visible_package = client.get(f"/api/service-packages/{package_body['id']}")
        assert visible_package.status_code == 200
        listed = client.get("/api/service-packages", params={"service_id": service["id"], "q": marker})
        assert listed.json()["total"] == 1

        bad_sort = client.get("/api/services", params={"sort": "password"})
        assert bad_sort.status_code == 422
        assert bad_sort.json()["code"] == "http_422"

        category = client.post(
            "/api/categories",
            headers=staff_headers,
            json={"kind": "product", "name": f"Category {marker}", "slug": f"category-{marker}"},
        )
        assert category.status_code == 201
        category_ids.append(category.json()["id"])
        assert client.get("/api/categories", params={"kind": "product", "q": marker}).json()["total"] == 0
        client.put(f"/api/categories/{category.json()['id']}", headers=staff_headers, json={"is_published": True})
        assert client.get("/api/categories", params={"kind": "product", "q": marker}).json()["total"] == 1

        product = client.post(
            "/api/products",
            headers=staff_headers,
            json={
                "name": f"Product {marker}",
                "slug": f"product-{marker}",
                "business_area": "technology-digital-products",
                "product_type": "software",
                "listing_channel": "technology",
                "category_id": category.json()["id"],
                "is_published": True,
            },
        )
        assert product.status_code == 201
        product_ids.append(product.json()["id"])
        assert client.get(f"/api/products/product-{marker}").status_code == 200
        in_use = client.delete(f"/api/categories/{category.json()['id']}", headers=staff_headers)
        assert in_use.status_code == 409
        assert client.delete(f"/api/products/{product.json()['id']}", headers=customer_headers).status_code == 403
        assert client.delete(f"/api/products/{product.json()['id']}", headers=staff_headers).status_code == 204
        assert client.get(f"/api/products/product-{marker}", headers=staff_headers).status_code == 404

        course = client.post(
            "/api/courses",
            headers=staff_headers,
            json={
                "title": f"Course {marker}",
                "slug": f"course-{marker}",
                "business_area": "education-academy",
                "is_published": False,
            },
        )
        assert course.status_code == 201
        course_ids.append(course.json()["id"])
        assert client.get(f"/api/courses/course-{marker}").status_code == 404
        assert client.get(f"/api/courses/course-{marker}", headers=staff_headers).status_code == 200

        assert client.delete(f"/api/services/{service['id']}", headers=staff_headers).status_code == 204
        assert client.get(f"/api/services/platform-{marker}").status_code == 404
        assert client.get(f"/api/services/platform-{marker}", headers=staff_headers).status_code == 404
        assert client.get(f"/api/service-packages/{package_body['id']}", headers=staff_headers).status_code == 404
    finally:
        _cleanup(
            emails=emails,
            service_ids=service_ids,
            category_ids=category_ids,
            product_ids=product_ids,
            course_ids=course_ids,
            user_ids=user_ids,
        )


def test_leads_are_public_to_submit_and_staff_to_read() -> None:
    marker = uuid.uuid4().hex[:12]
    emails: list[str] = []
    user_ids: list[str] = []
    service_ids: list[str] = []
    try:
        customer_email, customer_token, customer_id = _register("lead-customer")
        other_email, other_token, other_id = _register("lead-other")
        staff_email, staff_token, staff_id = _staff()
        emails.extend([customer_email, other_email, staff_email])
        user_ids.extend([customer_id, other_id, staff_id])
        staff_headers = _auth(staff_token)

        draft = client.post(
            "/api/services",
            headers=staff_headers,
            json={"name": f"Draft {marker}", "slug": f"draft-{marker}", "business_area": "business-solutions"},
        )
        assert draft.status_code == 201
        service_ids.append(draft.json()["id"])

        leaked = client.post(
            "/api/enquiries",
            json={"name": "Ada", "email": customer_email, "message": marker, "service_id": draft.json()["id"]},
        )
        assert leaked.status_code == 422

        enquiry = client.post(
            "/api/enquiries",
            headers=_auth(customer_token),
            json={"name": "Ada", "email": customer_email, "message": f"Need help {marker}"},
        )
        assert enquiry.status_code == 201
        assert enquiry.json()["status"] == "new"
        assert enquiry.json()["user_id"] == customer_id
        assert client.get("/api/enquiries").status_code == 401
        assert client.get("/api/enquiries", headers=_auth(customer_token)).status_code == 403
        inbox = client.get("/api/enquiries", headers=staff_headers, params={"q": marker})
        assert inbox.status_code == 200
        assert inbox.json()["total"] == 1
        updated = client.put(
            f"/api/enquiries/{enquiry.json()['id']}",
            headers=staff_headers,
            json={"status": "in_progress"},
        )
        assert updated.status_code == 200
        assert updated.json()["status"] == "in_progress"

        quote = client.post(
            "/api/quote-requests",
            json={
                "name": "Ada",
                "email": customer_email,
                "requirements": f"Scope {marker}",
                "business_area": "marketing-advertising",
            },
        )
        assert quote.status_code == 201
        responded = client.put(
            f"/api/quote-requests/{quote.json()['id']}",
            headers=staff_headers,
            json={"status": "quoted", "response_message": "We can proceed", "response_amount": "2500.00"},
        )
        assert responded.status_code == 200
        assert responded.json()["responded_by_user_id"] == staff_id
        assert Decimal(responded.json()["response_amount"]) == Decimal("2500.00")

        contact = client.post(
            "/api/contact",
            json={"name": "Ada", "email": customer_email, "subject": marker, "message": "Hello"},
        )
        assert contact.status_code == 201
        assert client.get("/api/contact", headers=_auth(customer_token)).status_code == 403
        messages = client.get("/api/contact", headers=staff_headers, params={"q": marker, "status": "new"})
        assert messages.json()["total"] == 1

        with SessionLocal() as session:
            order = Order(
                order_number=f"AX-{marker}",
                user_id=uuid.UUID(customer_id),
                status=OrderStatus.PENDING,
                currency="INR",
                subtotal=Decimal("10.00"),
                total=Decimal("10.00"),
            )
            session.add(order)
            session.commit()
            order_id = str(order.id)

        assert client.get("/api/orders").status_code == 401
        own = client.get("/api/orders", headers=_auth(customer_token), params={"q": marker})
        assert own.status_code == 200
        assert own.json()["total"] == 1
        assert client.get(f"/api/orders/{order_id}", headers=_auth(other_token)).status_code == 404
        staff_order = client.get(f"/api/orders/{order_id}", headers=staff_headers)
        assert staff_order.status_code == 200
        assert staff_order.json()["order_number"] == f"AX-{marker}"
    finally:
        _cleanup(
            emails=emails,
            service_ids=service_ids,
            category_ids=[],
            product_ids=[],
            course_ids=[],
            user_ids=user_ids,
        )


def test_public_testimonials_hide_unpublished() -> None:
    with SessionLocal() as session:
        hidden = Testimonial(author_name="Hidden person", body="This draft is not public.", is_published=False)
        visible = Testimonial(author_name="Visible person", body="This note is published.", is_published=True)
        session.add_all([hidden, visible])
        session.commit()
        hidden_id = str(hidden.id)
        visible_id = str(visible.id)
    try:
        response = client.get("/api/testimonials", params={"page_size": 50, "sort": "-created_at"})
        assert response.status_code == 200
        body = response.json()
        ids = {item["id"] for item in body["items"]}
        assert visible_id in ids
        assert hidden_id not in ids
        assert "page" in body and "total" in body
    finally:
        with SessionLocal() as session:
            session.execute(text("DELETE FROM testimonials WHERE id IN (:hidden, :visible)"), {"hidden": hidden_id, "visible": visible_id})
            session.commit()
