"""Publish a small shop catalog. Safe to run more than once."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.enums import BillingPeriod, BusinessArea, ListingChannel, ProductType
from app.models.products import Product, ProductCategory, ProductFeature, ProductImage, ProductPrice
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
        "summary": "Create Better Social Content in Less Time",
        "description": "A complete social media content kit designed to help businesses, creators, and marketers plan, create, and publish professional content consistently.",
        "included": [
            "Social media post templates",
            "Content planning templates",
            "Caption ideas",
            "Content calendar",
            "Engagement post ideas",
            "Call-to-action ideas",
        ],
        "audience": "Small businesses, startups, creators, agencies & freelancers.",
        "amount": "2499.00",
        "sku": "AX-SOC-001",
        "image": "/products/social-media-content-kit.webp",
    },
    {
        "slug": "meta-ads-campaign-pack",
        "name": "Meta Ads Campaign Pack",
        "category": "marketing-resources",
        "summary": "Launch Smarter Meta Ads Campaigns",
        "description": "A ready-to-use campaign pack to help you plan and structure effective Facebook and Instagram advertising campaigns without starting from scratch.",
        "included": [
            "Campaign planning templates",
            "Ad copy templates",
            "Audience research framework",
            "Creative ideas",
            "Campaign structure",
            "Testing checklist",
            "Optimization checklist",
        ],
        "audience": "Business owners, marketers, agencies & freelancers.",
        "amount": "3499.00",
        "sku": "AX-ADS-002",
        "image": "/products/meta-ads-campaign-pack.png",
    },
    {
        "slug": "brand-identity-starter",
        "name": "Brand Identity Starter",
        "category": "digital-products",
        "summary": "Build a Professional Brand From Day One",
        "description": "Everything you need to establish a consistent and professional visual identity for your business.",
        "included": [
            "Brand identity guidelines",
            "Color palette framework",
            "Typography guide",
            "Logo usage guidelines",
            "Brand voice guidance",
            "Visual consistency checklist",
        ],
        "audience": "Startups, entrepreneurs, small businesses & new brands.",
        "amount": "4999.00",
        "sku": "AX-BRD-003",
        "image": "/products/brand-identity-starter.jpg",
    },
    {
        "slug": "website-launch-checklist",
        "name": "Website Launch Checklist",
        "category": "technology-products",
        "summary": "Launch Your Website With Confidence",
        "description": "A practical website launch checklist that helps you make sure your website is ready, professional, optimized, and prepared for visitors before going live.",
        "included": [
            "Design checklist",
            "Mobile responsiveness checklist",
            "SEO checklist",
            "Performance checklist",
            "Security checklist",
            "Analytics setup checklist",
            "Final pre-launch checklist",
        ],
        "audience": "Website owners, startups, developers, freelancers & agencies.",
        "amount": "1499.00",
        "sku": "AX-WEB-004",
        "image": "/products/website-launch-checklist.jpg",
    },
    {
        "slug": "lead-magnet-templates",
        "name": "Lead Magnet Templates",
        "category": "marketing-resources",
        "summary": "Turn Your Expertise Into Leads",
        "description": "Ready-to-use lead magnet templates designed to help you attract potential customers and grow your email or customer database.",
        "included": [
            "Lead magnet templates",
            "Checklist templates",
            "Guide templates",
            "Workbook templates",
            "PDF resource layouts",
            "Lead capture ideas",
            "CTA templates",
        ],
        "audience": "Coaches, consultants, agencies, creators & online businesses.",
        "amount": "1999.00",
        "sku": "AX-LED-005",
        "image": "/products/lead-magnet-templates.jpg",
    },
    {
        "slug": "business-proposal-kit",
        "name": "Business Proposal Kit",
        "category": "business-resources",
        "summary": "Send Proposals That Win More Business",
        "description": "A professional proposal kit designed to help you present your services, pricing, process, and value clearly to potential clients.",
        "included": [
            "Business proposal templates",
            "Service proposal structure",
            "Pricing section",
            "Project scope template",
            "Timeline section",
            "Terms & conditions section",
            "Client-ready presentation structure",
        ],
        "audience": "Freelancers, agencies, consultants, service businesses & startups.",
        "amount": "2999.00",
        "sku": "AX-PRP-006",
        "image": "/products/business-proposal-kit.jpg",
    },
    {
        "slug": "seo-starter-toolkit",
        "name": "SEO Starter Toolkit",
        "category": "marketing-resources",
        "summary": "Start Optimizing Your Website for Search",
        "description": "A beginner-friendly SEO toolkit that helps businesses understand and organize the essential steps required to improve their website's search visibility.",
        "included": [
            "Keyword research framework",
            "On-page SEO checklist",
            "Technical SEO checklist",
            "Content optimization guide",
            "SEO audit checklist",
            "Meta title & description templates",
            "SEO planning worksheet",
        ],
        "audience": "Website owners, bloggers, startups, marketers & small businesses.",
        "amount": "2499.00",
        "sku": "AX-SEO-007",
        "image": "/products/seo-starter-toolkit.jpg",
    },
    {
        "slug": "email-sequence-pack",
        "name": "Email Sequence Pack",
        "category": "educational-products",
        "summary": "Write Emails That Move Customers Forward",
        "description": "A ready-to-use email sequence pack that helps businesses communicate with leads and customers through structured, professional email campaigns.",
        "included": [
            "Welcome email sequence",
            "Lead nurturing emails",
            "Promotional emails",
            "Follow-up emails",
            "Customer engagement emails",
            "CTA ideas",
            "Email sequence planning framework",
        ],
        "audience": "Online businesses, creators, agencies, coaches & marketers.",
        "amount": "1799.00",
        "sku": "AX-EML-008",
        "image": "/products/email-sequence-pack.png",
    },
]


def _sync_copy(session, product: Product, item: dict) -> None:
    product.summary = item["summary"]
    product.description = item["description"]
    current = session.scalars(
        select(ProductFeature).where(ProductFeature.product_id == product.id, ProductFeature.deleted_at.is_(None))
    ).all()
    now = datetime.now(timezone.utc)
    for feature in current:
        feature.deleted_at = now
    for order, label in enumerate(item["included"]):
        session.add(ProductFeature(product_id=product.id, label=label, sort_order=order))
    session.add(ProductFeature(product_id=product.id, label="Perfect for", value=item["audience"], sort_order=100))


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
                _sync_copy(session, existing, item)
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
            _sync_copy(session, product, item)
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
