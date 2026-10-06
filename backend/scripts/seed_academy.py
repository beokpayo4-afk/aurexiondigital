"""Publish the Academy courses named in the brief. No extra course copy is invented."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.courses import Course
from app.models.enums import BusinessArea

COURSES = [
    ("marketing-starter", "Marketing Starter", Decimal("100.00")),
    ("social-media-marketing", "Social Media Marketing", Decimal("499.00")),
    ("meta-ads-masterclass", "Meta Ads Masterclass", Decimal("999.00")),
    ("youtube-marketing", "YouTube Marketing", Decimal("1499.00")),
    ("complete-digital-marketing", "Complete Digital Marketing", Decimal("2999.00")),
    ("digital-marketing-pro", "Digital Marketing Pro", Decimal("5000.00")),
]


def main() -> None:
    with SessionLocal() as session:
        for index, (slug, title, price) in enumerate(COURSES):
            existing = session.scalars(select(Course).where(Course.slug == slug, Course.deleted_at.is_(None))).first()
            if existing is not None:
                continue
            session.add(
                Course(
                    slug=slug,
                    title=title,
                    business_area=BusinessArea.EDUCATION_ACADEMY,
                    price_amount=price,
                    currency="INR",
                    learning_outcomes=[],
                    certificate_enabled=False,
                    sort_order=index,
                    is_published=True,
                )
            )
        session.commit()


if __name__ == "__main__":
    main()
