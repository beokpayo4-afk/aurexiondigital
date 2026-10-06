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
        "summary": "Grow Your Business. Reach More Customers. Build a Stronger Digital Presence.",
        "included": [
            "Social Media Marketing",
            "Search Engine Optimization (SEO)",
            "Paid Advertising",
            "Content Marketing",
            "Email Marketing",
            "Lead Generation",
            "Performance Marketing",
        ],
        "introduction": (
            "Our Digital Marketing services help businesses connect with the right audience, increase online visibility, "
            "generate quality leads, and turn digital engagement into real business growth.\n\n"
            "We combine strategy, creative content, advertising, SEO, social media, and data-driven optimization to create "
            "marketing campaigns focused on measurable results."
        ),
        "offers_title": "What We Offer",
        "offers": [
            ("Social Media Marketing", "Build a strong presence across social platforms with engaging content, strategic campaigns, and consistent brand communication."),
            ("Search Engine Optimization (SEO)", "Improve your website's visibility on search engines and attract people who are actively searching for your products or services."),
            ("Paid Advertising", "Reach your ideal customers through targeted advertising campaigns across platforms such as Google, Facebook, and Instagram."),
            ("Content Marketing", "Create valuable and engaging content that attracts your target audience, builds trust, and supports long-term business growth."),
            ("Email Marketing", "Connect with your customers through professional email campaigns, promotional messages, newsletters, and automated sequences."),
            ("Lead Generation", "Create strategies and campaigns designed to attract potential customers and convert them into qualified leads."),
            ("Performance Marketing", "Track campaign performance, analyze results, and continuously optimize your marketing efforts to improve ROI."),
        ],
        "why_title": "Why Choose Our Digital Marketing Services?",
        "why": [
            "Customized marketing strategies",
            "Audience-focused campaigns",
            "Professional creative content",
            "Data-driven decision making",
            "Continuous campaign optimization",
            "Transparent performance tracking",
            "Focus on leads, conversions, and growth",
        ],
        "process_title": "Our Process",
        "process": [
            ("Understand", "We learn about your business, goals, audience, competitors, and market."),
            ("Strategize", "We create a customized digital marketing strategy based on your objectives."),
            ("Execute", "We launch campaigns, publish content, optimize your website, and reach your target audience."),
            ("Analyze", "We monitor important performance metrics and identify opportunities for improvement."),
            ("Optimize & Grow", "We continuously improve campaigns to achieve better performance and sustainable growth."),
        ],
        "audience_title": "Who We Help",
        "audience": [
            "Startups",
            "Small & Medium Businesses",
            "E-commerce Businesses",
            "Local Businesses",
            "Service Providers",
            "Personal Brands",
            "Creators & Entrepreneurs",
        ],
        "cta_title": "Ready to Grow Your Business Online?",
        "cta_description": "Build a stronger digital presence, reach the right customers, and turn your online marketing into measurable business growth.",
        "cta_label": "Get Started Today",
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
        "summary": "Make Your Brand Visible Beyond the Digital World",
        "included": [
            "Outdoor Advertising",
            "Banner & Poster Advertising",
            "Print Advertising",
            "Brochure & Flyer Distribution",
            "Retail & In-Store Branding",
            "Event & Exhibition Advertising",
            "Promotional Materials",
        ],
        "introduction": "Our Offline Advertising solutions help businesses reach customers through impactful, traditional marketing channels. From local promotions to large-format outdoor advertising, we create campaigns that increase brand visibility, awareness, and customer engagement.",
        "offers_title": "What We Offer",
        "offers": [
            ("Outdoor Advertising", "Reach a large local audience through strategically placed billboards, hoardings, and outdoor displays."),
            ("Banner & Poster Advertising", "Create eye-catching banners, posters, and promotional materials for shops, events, campaigns, and local marketing."),
            ("Print Advertising", "Promote your business through brochures, flyers, catalogs, leaflets, newspapers, magazines, and other print materials."),
            ("Brochure & Flyer Distribution", "Take your message directly to your target audience through professionally designed and strategically distributed promotional materials."),
            ("Retail & In-Store Branding", "Transform your physical business space with attractive branding materials, promotional displays, standees, posters, and signage."),
            ("Event & Exhibition Advertising", "Make your brand stand out at exhibitions, trade shows, corporate events, and promotional activities with professional branding solutions."),
            ("Promotional Materials", "Build stronger brand recall with customized business cards, stationery, promotional merchandise, and other branded materials."),
        ],
        "why_title": "Why Choose Offline Advertising?",
        "why": [
            "Reach local customers effectively",
            "Build strong brand awareness",
            "Create physical brand presence",
            "Connect with customers directly",
            "Support local and regional campaigns",
            "Complement your digital marketing strategy",
            "Create memorable brand experiences",
        ],
        "process_title": "Our Process",
        "process": [
            ("Understand", "We understand your business, target audience, location, and advertising objectives."),
            ("Plan", "We develop an offline advertising strategy based on your target market and campaign goals."),
            ("Design", "Our team creates professional and attention-grabbing advertising creatives."),
            ("Execute", "We coordinate production, placement, distribution, and campaign execution."),
            ("Measure & Improve", "We evaluate campaign performance and identify opportunities for improvement."),
        ],
        "audience_title": "Who We Help",
        "audience": [
            "Startups",
            "Small & Medium Businesses",
            "Retail Stores",
            "E-commerce Businesses",
            "Real Estate Businesses",
            "Restaurants & Hospitality",
            "Educational Institutions",
            "Local Businesses",
            "Corporate Brands",
        ],
        "cta_title": "Connect Your Brand With Real People",
        "cta_description": "Digital marketing reaches screens. Offline advertising puts your brand directly into the physical world. Make your brand impossible to ignore.",
        "cta_label": "Get Started Today",
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
    payload = {
        "introduction": item["introduction"],
        "included": item["included"],
        "benefits": [
            "The scope is agreed before work starts.",
            "A published package price is a starting price, and the final amount is confirmed after consultation.",
            "Third-party advertising, media, and influencer costs are separate unless a package says they are included.",
        ],
        "process": item.get("process") or PROCESS,
        "faqs": FAQS,
        "management_fee_note": item["fee"],
    }
    if item.get("offers"):
        payload["offers"] = [{"title": title, "detail": detail} for title, detail in item["offers"]]
        payload["offers_title"] = item.get("offers_title")
        payload["why"] = item.get("why") or []
        payload["why_title"] = item.get("why_title")
        payload["process"] = [{"title": title, "detail": detail} for title, detail in item["process"]]
        payload["process_title"] = item.get("process_title")
        payload["audience"] = item.get("audience") or []
        payload["audience_title"] = item.get("audience_title")
        payload["cta_title"] = item.get("cta_title")
        payload["cta_description"] = item.get("cta_description")
        payload["cta_label"] = item.get("cta_label")
        payload["faqs"] = []
        payload["benefits"] = []
    return json.dumps(payload, ensure_ascii=False)


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
            elif item.get("offers"):
                service.summary = item["summary"]
                service.description = _description(item)
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
