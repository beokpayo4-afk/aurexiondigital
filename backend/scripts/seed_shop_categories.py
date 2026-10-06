"""Publish the shop categories. Products are not created here."""

from __future__ import annotations

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.products import ProductCategory

CATEGORIES = [
    ("digital-products", "Digital Products"),
    ("saas-tools", "SaaS Tools"),
    ("software", "Software"),
    ("business-resources", "Business Resources"),
    ("educational-products", "Educational Products"),
    ("marketing-resources", "Marketing Resources"),
    ("technology-products", "Technology Products"),
    ("business-tools", "Business Tools"),
]


def main() -> None:
    with SessionLocal() as session:
        for index, (slug, name) in enumerate(CATEGORIES):
            existing = session.scalars(
                select(ProductCategory).where(ProductCategory.slug == slug, ProductCategory.deleted_at.is_(None))
            ).first()
            if existing is not None:
                continue
            session.add(ProductCategory(slug=slug, name=name, sort_order=index, is_published=True))
        session.commit()


if __name__ == "__main__":
    main()
