from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.academy.router import router as academy_router
from app.api.admin.router import router as admin_router
from app.api.auth.router import router as auth_router
from app.api.cart.router import router as cart_router
from app.api.categories.router import router as categories_router
from app.api.checkout.router import router as checkout_router
from app.api.contact.router import router as contact_router
from app.api.content.router import router as content_router
from app.api.courses.router import router as courses_router
from app.api.enquiries.router import router as enquiries_router
from app.api.orders.router import router as orders_router
from app.api.products.router import router as products_router
from app.api.quote_requests.router import router as quote_requests_router
from app.api.router import api_router
from app.api.seo_files import router as seo_files_router
from app.api.service_packages.router import router as service_packages_router
from app.api.services.router import router as services_router
from app.api.testimonials.router import router as testimonials_router
from app.core.config import settings
from app.core.database import SessionLocal
from app.middleware.activity import ActivityLogMiddleware
from app.middleware.errors import register_exception_handlers
from app.middleware.request_id import RequestIdMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.repositories.auth import ensure_default_roles


@asynccontextmanager
async def lifespan(_app: FastAPI):
    with SessionLocal() as session:
        ensure_default_roles(session)
        session.commit()
    yield


def create_app() -> FastAPI:
    if settings.environment.lower() == "production" and (
        settings.secret_key == "dev-only-change-this-jwt-secret-value" or len(settings.secret_key) < 32
    ):
        raise RuntimeError("Set a SECRET_KEY of at least 32 characters before running in production")
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        lifespan=lifespan,
        description=(
            "Aurexion Digital API. Public catalog routes return published, non-deleted records. "
            "Admin and staff can create, update, and delete services, packages, products, categories, and courses, "
            "and can read unpublished drafts. "
            "Send Authorization: Bearer <access token> for protected routes. "
            "List responses use items, page, page_size, and total. Errors use detail and code."
        ),
        openapi_tags=[
            {"name": "services", "description": "Service catalog. Writes require admin or staff."},
            {"name": "service-packages", "description": "Packages that belong to a service. Writes require admin or staff."},
            {"name": "products", "description": "Product catalog. Writes require admin or staff."},
            {"name": "categories", "description": "Service, product, and course categories. Writes require admin or staff."},
            {"name": "courses", "description": "Academy courses. Writes require admin or staff."},
            {"name": "academy", "description": "Course outlines, enrollment, and protected study. Lesson bodies require an active enrollment."},
            {"name": "enquiries", "description": "Public enquiry submission. Listing and status updates require admin or staff."},
            {"name": "quote-requests", "description": "Public quote submission. Listing and responses require admin or staff."},
            {"name": "contact", "description": "Public contact form. The inbox requires admin or staff."},
            {"name": "orders", "description": "Authenticated order history. Customers see their own orders."},
            {"name": "cart", "description": "Shop cart for a guest token or the signed-in customer."},
            {"name": "payments", "description": "Checkout and payment configuration. Secrets are never returned."},
            {"name": "testimonials", "description": "Published testimonials. Drafts and writes require admin or staff."},
            {"name": "content", "description": "Homepage, banners, blog, SEO, social links, and settings. Writes require admin or staff."},
            {"name": "admin", "description": "Dashboard, customers, students, and activity logs. Admin or staff only."},
            {"name": "auth", "description": "Registration, login, and password reset."},
        ],
    )
    register_exception_handlers(app)
    app.add_middleware(ActivityLogMiddleware)
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(seo_files_router)
    app.include_router(api_router, prefix="/api/v1")
    app.include_router(auth_router, prefix="/api")
    app.include_router(services_router, prefix="/api")
    app.include_router(service_packages_router, prefix="/api")
    app.include_router(products_router, prefix="/api")
    app.include_router(categories_router, prefix="/api")
    app.include_router(courses_router, prefix="/api")
    app.include_router(academy_router, prefix="/api")
    app.include_router(enquiries_router, prefix="/api")
    app.include_router(quote_requests_router, prefix="/api")
    app.include_router(contact_router, prefix="/api")
    app.include_router(orders_router, prefix="/api")
    app.include_router(cart_router, prefix="/api")
    app.include_router(checkout_router, prefix="/api")
    app.include_router(testimonials_router, prefix="/api")
    app.include_router(content_router, prefix="/api")
    app.include_router(admin_router, prefix="/api")
    return app


app = create_app()
