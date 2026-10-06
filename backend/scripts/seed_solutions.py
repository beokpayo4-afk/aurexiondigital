"""Publish the eight solution services. Package amounts stay empty until the brief prices are stored."""

from __future__ import annotations

import json

from app.core.database import SessionLocal
from app.models.enums import BusinessArea
from app.models.services import Service, ServicePackage
from sqlalchemy import select

PROCESS = [
    {
        "title": "Enquiry",
        "detail": "Send the campaign or project requirements through the enquiry form.",
    },
    {
        "title": "Consultation",
        "detail": "Requirements, location, duration, platform, and production needs are reviewed.",
    },
    {
        "title": "Confirmation",
        "detail": "The Aurexion starting service fee and any third-party costs are confirmed before work starts.",
    },
    {
        "title": "Delivery",
        "detail": "Work follows the agreed scope. Media or creator placement is included only when it has been confirmed.",
    },
]

FAQS = [
    {
        "question": "Are the package prices final?",
        "answer": "No. A published package price is a starting price. The final amount is confirmed after campaign consultation.",
    },
    {
        "question": "Do the prices include advertising, media, or influencer costs?",
        "answer": "No, unless a package says those costs are included. Advertising inventory, media, and creator or influencer fees are third-party costs.",
    },
    {
        "question": "Does a package guarantee media placement?",
        "answer": "No. Media or creator placement is not guaranteed unless it is confirmed after consultation.",
    },
]

FEE_NOTE = (
    "Prices are Aurexion management and service fees. Third-party advertising, media, and influencer costs "
    "are not included unless a package says they are. A package does not guarantee media placement unless that placement is confirmed."
)

SERVICES = [
    {
        "slug": "digital-marketing",
        "name": "Digital Marketing",
        "area": BusinessArea.MARKETING_ADVERTISING,
        "summary": "Digital marketing, social media, search, online advertising, performance marketing, and affiliate marketing.",
        "included": [
            "Digital marketing",
            "Social media marketing",
            "Search engine optimization (SEO)",
            "Online advertisement services",
            "Performance marketing",
            "Affiliate marketing",
        ],
        "introduction": "Digital marketing for businesses, brands, and individuals, covering social media marketing, search engine optimization, online advertisement, performance marketing, and affiliate marketing.",
        "fee": FEE_NOTE,
        "packages": [
            ("starter-digital", "Starter Digital"),
            ("growth-digital", "Growth Digital"),
            ("business-growth", "Business Growth"),
            ("premium-digital", "Premium Digital"),
            ("digital-influencer", "Digital + Influencer"),
            ("enterprise-digital", "Enterprise Digital"),
        ],
    },
    {
        "slug": "offline-advertising",
        "name": "Offline Advertising",
        "area": BusinessArea.MARKETING_ADVERTISING,
        "summary": "Media buying, advertisement film production, branding, and public relations.",
        "included": [
            "Media buying",
            "Advertisement film production",
            "Branding services",
            "Public relations",
            "Media production",
        ],
        "introduction": "Offline and media advertising through media buying, advertisement film production, branding, public relations, and media production. A package does not guarantee a media placement unless that placement is confirmed.",
        "fee": FEE_NOTE,
        "packages": [],
    },
    {
        "slug": "influencer-marketing",
        "name": "Influencer Marketing",
        "area": BusinessArea.MARKETING_ADVERTISING,
        "summary": "Influencer marketing. Creator fees are confirmed separately.",
        "included": ["Influencer marketing"],
        "introduction": "Influencer marketing for a stated campaign. Creator and influencer fees are third-party costs and are confirmed separately. This service does not guarantee a creator placement unless it is confirmed.",
        "fee": FEE_NOTE,
        "packages": [],
    },
    {
        "slug": "creative-content",
        "name": "Creative & Content",
        "area": BusinessArea.MARKETING_ADVERTISING,
        "summary": "Content, film, video, design, animation, and identity branding.",
        "included": [
            "Content creation",
            "Media production",
            "Advertisement film production",
            "Video editing services",
            "Graphic designing services",
            "Computer animation services",
            "Identity branding services",
            "Digital content management systems",
        ],
        "introduction": "Creative production covering content creation, media production, advertisement film production, video editing, graphic design, computer animation, identity branding, and digital content management.",
        "fee": "Prices are Aurexion production and service fees. Third-party media costs, if any, are confirmed separately.",
        "packages": [],
    },
    {
        "slug": "lead-generation",
        "name": "Lead Generation",
        "area": BusinessArea.MARKETING_ADVERTISING,
        "summary": "Lead generation for individuals, businesses, startups, and organizations.",
        "included": ["Lead generation"],
        "introduction": "Lead generation for individuals, businesses, startups, and organizations. Results depend on the agreed scope and are not guaranteed by the package name.",
        "fee": FEE_NOTE,
        "packages": [],
    },
    {
        "slug": "business-consulting",
        "name": "Business Consulting",
        "area": BusinessArea.BUSINESS_SOLUTIONS,
        "summary": "Business, marketing, management, startup, and technology consulting.",
        "included": [
            "Business consultancy",
            "Marketing consultancy",
            "Management consultancy",
            "Operational consultancy",
            "Startup consultancy",
            "Digital transformation consultancy",
            "Technology implementation consultancy",
            "Non-financial business advisory services",
        ],
        "introduction": "Consulting for business, marketing, management, operations, startups, digital transformation, and technology implementation. Advisory under this service is non-financial.",
        "fee": None,
        "packages": [],
    },
    {
        "slug": "trade-business-support",
        "name": "Trade & Business Support",
        "area": BusinessArea.BUSINESS_SOLUTIONS,
        "summary": "Trade facilitation, commerce infrastructure, and operational support.",
        "included": [
            "Trade facilitation services",
            "Digital commerce infrastructure support services",
            "Technical support services",
            "Operational coordination services",
            "Customer support services",
        ],
        "introduction": "Trade facilitation, digital commerce infrastructure support, technical support, operational coordination, and customer support.",
        "fee": None,
        "packages": [],
    },
    {
        "slug": "outsourcing",
        "name": "Outsourcing",
        "area": BusinessArea.BUSINESS_SOLUTIONS,
        "summary": "Manpower, vendor coordination, project management, and workforce support.",
        "included": [
            "Outsourced manpower solutions",
            "Recruitment backend support",
            "Freelance vendor coordination",
            "Project management services",
            "Vendor workflow management systems",
            "Workforce support services",
        ],
        "introduction": "Outsourced manpower, recruitment backend support, freelance vendor coordination, project management, vendor workflow management, and workforce support.",
        "fee": None,
        "packages": [],
    },
]


def _description(item: dict) -> str:
    return json.dumps(
        {
            "introduction": item["introduction"],
            "included": item["included"],
            "benefits": [
                "The scope is agreed before work starts.",
                "A published package price is a starting price, and the final amount is confirmed after consultation.",
                "Third-party advertising, media, and influencer costs are separate unless a package says they are included.",
            ],
            "process": PROCESS,
            "faqs": FAQS,
            "management_fee_note": item["fee"],
        },
        ensure_ascii=False,
    )


def main() -> None:
    with SessionLocal() as session:
        for index, item in enumerate(SERVICES):
            service = session.scalars(
                select(Service).where(Service.slug == item["slug"], Service.deleted_at.is_(None))
            ).first()
            if service is None:
                service = Service(
                    slug=item["slug"],
                    name=item["name"],
                    business_area=item["area"],
                    summary=item["summary"],
                    description=_description(item),
                    sort_order=index,
                    is_published=True,
                )
                session.add(service)
                session.flush()
            for order, (slug, name) in enumerate(item["packages"]):
                exists = session.scalars(
                    select(ServicePackage).where(
                        ServicePackage.service_id == service.id,
                        ServicePackage.slug == slug,
                        ServicePackage.deleted_at.is_(None),
                    )
                ).first()
                if exists is not None:
                    continue
                summary = "Aurexion service package. Any price shown is a starting service fee."
                if slug == "digital-influencer":
                    summary = (
                        "Aurexion service package with influencer coordination. Creator and influencer fees are "
                        "third-party costs. Any price shown is a starting service fee. This package does not guarantee a creator placement."
                    )
                session.add(
                    ServicePackage(
                        service_id=service.id,
                        slug=slug,
                        name=name,
                        summary=summary,
                        price_amount=None,
                        currency="INR",
                        sort_order=order,
                        is_published=True,
                    )
                )
        session.commit()


if __name__ == "__main__":
    main()
