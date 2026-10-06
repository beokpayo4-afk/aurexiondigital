"""Publish the technology services. Products stay empty until they are published."""

from __future__ import annotations

import json

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.enums import BusinessArea
from app.models.services import Service

AREA = BusinessArea.TECHNOLOGY_DIGITAL_PRODUCTS

PROCESS = [
    {"title": "Enquiry", "detail": "Send the software, SaaS, website, application, or automation requirement."},
    {"title": "Scope", "detail": "The work, timeline, and any subscription are confirmed before delivery starts."},
    {"title": "Build", "detail": "The agreed service is carried out. A published product is separate from a custom project."},
    {"title": "Support", "detail": "Technical support and software maintenance are available when they are part of the agreed scope."},
]

WHY = [
    "Software, SaaS, websites, applications, and automation are offered as published services.",
    "Digital products appear when they are published, with their own price, features, and demo link.",
    "Technical support and software maintenance are separate from a new build.",
    "A project enquiry confirms the scope before work starts.",
]

SERVICES = [
    ("website-development", "Website Development", "web-development", "Website development for a stated business requirement."),
    ("web-applications", "Web Applications", "web-development", "Web applications built for a stated workflow."),
    ("mobile-applications", "Mobile Applications", "app-development", "Mobile applications for a stated product or internal tool."),
    ("custom-software", "Custom Software", "software", "Custom software for a stated business requirement."),
    ("saas-development", "SaaS Development", "saas", "SaaS development and software offered as a service."),
    ("business-automation", "Business Automation", "business-automation", "Automation tools and business process automation."),
    ("dashboard-development", "Dashboard Development", "software", "Dashboards for reporting and operations."),
    ("productivity-tools", "Productivity Tools", "digital-products", "Productivity tools published as digital products or custom work."),
    ("business-software", "Business Software", "software", "Business management software for a stated operation."),
    ("technology-consulting", "Technology Consulting", "software", "Technology implementation consultancy."),
    ("technical-support", "Technical Support", "software", "Technical support for an agreed system."),
    ("software-maintenance", "Software Maintenance", "software", "Software maintenance for an agreed system."),
]


def _description(summary: str, track: str, include_story: bool) -> str:
    body = {
        "introduction": summary,
        "included": [summary.rstrip(".")],
        "benefits": [],
        "process": PROCESS if include_story else [],
        "faqs": [],
        "management_fee_note": None,
        "track": track,
        "why": WHY if include_story else [],
    }
    return json.dumps(body, ensure_ascii=False)


def main() -> None:
    with SessionLocal() as session:
        for index, (slug, name, track, summary) in enumerate(SERVICES):
            existing = session.scalars(select(Service).where(Service.slug == slug, Service.deleted_at.is_(None))).first()
            if existing is not None:
                continue
            session.add(
                Service(
                    slug=slug,
                    name=name,
                    business_area=AREA,
                    summary=summary,
                    description=_description(summary, track, slug == "custom-software"),
                    sort_order=index,
                    is_published=True,
                )
            )
        session.commit()


if __name__ == "__main__":
    main()
