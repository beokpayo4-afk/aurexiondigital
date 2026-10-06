"""Publish a small shop catalog. Safe to run more than once."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.enums import BillingPeriod, BusinessArea, ListingChannel, ProductType
from app.models.products import Product, ProductCategory, ProductImage, ProductPrice
from app.models.services import Service, ServicePackage

PACKAGE_PRICES = {
    "starter-digital": Decimal("4999.00"),
    "growth-digital": Decimal("9999.00"),
    "business-growth": Decimal("14999.00"),
    "premium-digital": Decimal("24999.00"),
    "digital-influencer": Decimal("19999.00"),
    "enterprise-digital": Decimal("49999.00"),
}

PRODUCTS = [
    {
        "slug": "social-media-content-kit",
        "name": "Social Media Content Kit",
        "category": "marketing-resources",
        "summary": "Thirty ready-to-edit posts, captions, and story frames for a month of social media.",
        "description": "A downloadable kit for businesses that need a consistent feed without starting from a blank page. It includes post layouts, caption starters, and a simple monthly calendar.",
        "amount": "2499.00",
        "sku": "AX-SOC-001",
        "image": "/products/social-media-content-kit.webp",
    },
    {
        "slug": "meta-ads-campaign-pack",
        "name": "Meta Ads Campaign Pack",
        "category": "marketing-resources",
        "summary": "Campaign structure, audience notes, and ad copy templates for Facebook and Instagram.",
        "description": "Use this pack to brief a first paid social campaign. It covers campaign objectives, audience worksheets, and short ad variations you can adapt.",
        "amount": "3499.00",
        "sku": "AX-ADS-002",
        "image": "/products/meta-ads-campaign-pack.png",
    },
    {
        "slug": "brand-identity-starter",
        "name": "Brand Identity Starter",
        "category": "digital-products",
        "summary": "A compact brand worksheet covering name, colours, type, and a one-page style guide.",
        "description": "For a new business that needs a clear look before a website or campaign. The starter records your colours, type choices, and how the name should appear.",
        "amount": "4999.00",
        "sku": "AX-BRD-003",
        "image": "/products/brand-identity-starter.jpg",
    },
    {
        "slug": "website-launch-checklist",
        "name": "Website Launch Checklist",
        "category": "technology-products",
        "summary": "A practical checklist for pages, forms, speed, and the details to confirm before launch.",
        "description": "Walk through content, contact forms, mobile layout, and basic search setup before a site goes live. Written for owners, not only developers.",
        "amount": "1499.00",
        "sku": "AX-WEB-004",
        "image": "/products/website-launch-checklist.jpg",
    },
    {
        "slug": "lead-magnet-templates",
        "name": "Lead Magnet Templates",
        "category": "marketing-resources",
        "summary": "Five lead-magnet outlines with landing-page copy you can fill in for your offer.",
        "description": "Templates for a checklist, a short guide, a worksheet, a webinar invite, and a consultation offer. Each one includes a headline and a call to action.",
        "amount": "1999.00",
        "sku": "AX-LED-005",
        "image": "/products/lead-magnet-templates.jpg",
    },
    {
        "slug": "business-proposal-kit",
        "name": "Business Proposal Kit",
        "category": "business-resources",
        "summary": "A proposal outline, pricing table, and follow-up email for client work.",
        "description": "Send a clear proposal instead of a long chat thread. The kit covers the problem, the work, the fee, and the next step.",
        "amount": "2999.00",
        "sku": "AX-PRP-006",
        "image": "/products/business-proposal-kit.jpg",
    },
    {
        "slug": "seo-starter-toolkit",
        "name": "SEO Starter Toolkit",
        "category": "marketing-resources",
        "summary": "Page-title formulas, a keyword sheet, and an on-page review list for a small site.",
        "description": "A first pass at search visibility for a local or small business site. It does not replace an ongoing campaign. It gives you the pages and titles to fix first.",
        "amount": "2499.00",
        "sku": "AX-SEO-007",
        "image": "/products/seo-starter-toolkit.jpg",
    },
    {
        "slug": "email-sequence-pack",
        "name": "Email Sequence Pack",
        "category": "educational-products",
        "summary": "Welcome, nurture, and follow-up emails for a new enquiry or a new customer.",
        "description": "Six emails you can adapt: a welcome, two useful notes, an offer, a reminder, and a last follow-up. Written in plain language for service businesses.",
        "amount": "1799.00",
        "sku": "AX-EML-008",
        "image": "/products/email-sequence-pack.png",
    },
]


def main() -> None:
    with SessionLocal() as session:
        categories = {
            row.slug: row
            for row in session.scalars(select(ProductCategory).where(ProductCategory.deleted_at.is_(None))).all()
        }
        for index, item in enumerate(PRODUCTS):
            existing = session.scalars(
                select(Product).where(Product.slug == item["slug"], Product.deleted_at.is_(None))
            ).first()
            if existing is not None:
                image = session.scalars(
                    select(ProductImage).where(
                        ProductImage.product_id == existing.id,
                        ProductImage.deleted_at.is_(None),
                        ProductImage.is_primary.is_(True),
                    )
                ).first()
                if image is None:
                    session.add(
                        ProductImage(
                            product_id=existing.id,
                            file_url=item["image"],
                            alt_text=item["name"],
                            sort_order=0,
                            is_primary=True,
                        )
                    )
                elif image.file_url != item["image"]:
                    image.file_url = item["image"]
                    image.alt_text = item["name"]
                continue
            category = categories.get(item["category"])
            product = Product(
                category_id=category.id if category is not None else None,
                business_area=BusinessArea.TECHNOLOGY_DIGITAL_PRODUCTS,
                slug=item["slug"],
                name=item["name"],
                summary=item["summary"],
                description=item["description"],
                product_type=ProductType.DIGITAL,
                listing_channel=ListingChannel.SHOP,
                sku=item["sku"],
                is_downloadable=True,
                sort_order=index,
                is_published=True,
            )
            session.add(product)
            session.flush()
            session.add(
                ProductPrice(
                    product_id=product.id,
                    amount=Decimal(item["amount"]),
                    currency="INR",
                    billing_period=BillingPeriod.ONE_TIME,
                    is_active=True,
                )
            )
            session.add(
                ProductImage(
                    product_id=product.id,
                    file_url=item["image"],
                    alt_text=item["name"],
                    sort_order=0,
                    is_primary=True,
                )
            )
        services = session.scalars(select(Service).where(Service.deleted_at.is_(None), Service.is_published.is_(True))).all()
        for service in services:
            packages = session.scalars(
                select(ServicePackage).where(ServicePackage.service_id == service.id, ServicePackage.deleted_at.is_(None))
            ).all()
            if not packages:
                session.add(
                    ServicePackage(
                        service_id=service.id,
                        slug="starting-fee",
                        name=f"{service.name} starting fee",
                        summary="Starting service fee. The final scope is confirmed after checkout.",
                        price_amount=Decimal("4999.00"),
                        currency="INR",
                        sort_order=0,
                        is_published=True,
                    )
                )
                continue
            for package in packages:
                if package.price_amount is None:
                    package.price_amount = PACKAGE_PRICES.get(package.slug, Decimal("4999.00"))
                    package.is_published = True
        session.commit()
        print(f"Shop catalog ready ({len(PRODUCTS)} products).")


if __name__ == "__main__":
    main()
