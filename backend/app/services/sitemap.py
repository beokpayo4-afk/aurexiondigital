from datetime import datetime
from urllib.parse import quote
from xml.sax.saxutils import escape

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.courses import Course
from app.models.enums import ListingChannel
from app.models.products import Product, ProductCategory
from app.models.services import Service

STATIC_PATHS = (
    "/",
    "/solutions",
    "/solutions/digital-marketing",
    "/solutions/offline-advertising",
    "/solutions/influencer-marketing",
    "/solutions/creative-content",
    "/solutions/lead-generation",
    "/solutions/business-consulting",
    "/solutions/trade-business-support",
    "/solutions/outsourcing",
    "/technology",
    "/technology/software",
    "/technology/saas",
    "/technology/web-development",
    "/technology/app-development",
    "/technology/business-automation",
    "/technology/digital-products",
    "/shop",
    "/academy",
    "/academy/courses",
    "/about",
    "/contact",
    "/custom-quote",
)

ROBOTS = """User-agent: *
Allow: /

Disallow: /admin
Disallow: /account
Disallow: /orders
Disallow: /checkout
Disallow: /cart
Disallow: /learn
Disallow: /login
Disallow: /register
Disallow: /order-success
Disallow: /academy/login
Disallow: /academy/register
Disallow: /academy/dashboard
Disallow: /academy/course/*/learn

Sitemap: {origin}/sitemap.xml
"""


def public_site_url() -> str:
    configured = settings.public_site_url.strip().rstrip("/")
    if configured:
        return configured
    for origin in settings.cors_origin_list:
        if "127.0.0.1:5173" in origin:
            return origin.rstrip("/")
    for origin in settings.cors_origin_list:
        if ":5173" in origin:
            return origin.rstrip("/")
    return "http://127.0.0.1:5173"


def robots_txt() -> str:
    return ROBOTS.format(origin=public_site_url())


def _loc(path: str) -> str:
    return public_site_url() + quote(path, safe="/-._~")


def _date(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.date().isoformat()


def build_sitemap(session: Session) -> str:
    urls: dict[str, str | None] = {path: None for path in STATIC_PATHS}

    services = session.execute(
        select(Service.slug, Service.updated_at).where(Service.deleted_at.is_(None), Service.is_published.is_(True))
    )
    for slug, updated_at in services:
        urls[f"/solutions/{slug}"] = _date(updated_at)

    products = session.execute(
        select(Product.slug, Product.listing_channel, Product.updated_at).where(Product.deleted_at.is_(None), Product.is_published.is_(True))
    )
    for slug, channel, updated_at in products:
        updated = _date(updated_at)
        if channel in {ListingChannel.SHOP, ListingChannel.BOTH}:
            urls[f"/shop/product/{slug}"] = updated
        if channel in {ListingChannel.TECHNOLOGY, ListingChannel.BOTH}:
            urls[f"/technology/products/{slug}"] = updated

    categories = session.execute(
        select(ProductCategory.slug, ProductCategory.updated_at).where(
            ProductCategory.deleted_at.is_(None),
            ProductCategory.is_published.is_(True),
        )
    )
    for slug, updated_at in categories:
        urls[f"/shop/category/{slug}"] = _date(updated_at)

    courses = session.execute(select(Course.slug, Course.updated_at).where(Course.deleted_at.is_(None), Course.is_published.is_(True)))
    for slug, updated_at in courses:
        urls[f"/academy/course/{slug}"] = _date(updated_at)

    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path, updated in urls.items():
        lines.append("  <url>")
        lines.append(f"    <loc>{escape(_loc(path))}</loc>")
        if updated:
            lines.append(f"    <lastmod>{updated}</lastmod>")
        lines.append("  </url>")
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"
