from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.listing import apply_sort, like_pattern, paginate
from app.models.content import Banner, BlogPost, HomepageSection, SEOSetting, SiteSetting, SocialLink
from app.models.courses import Course
from app.models.products import Product, ProductPrice
from app.schemas.content_admin import (
    BannerRead,
    BannerUpdate,
    BannerWrite,
    BlogUpdate,
    BlogWrite,
    FeaturedCourseRead,
    FeaturedProductRead,
    HomepagePublic,
    HomepageSectionRead,
    HomepageSectionUpdate,
    HomepageSectionWrite,
    SeoUpdate,
    SeoWrite,
    SettingUpdate,
    SettingWrite,
    SocialUpdate,
    SocialWrite,
)
from app.services.api_error import ApiError
from app.utils.slug import slugify


def _blank(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _sort(statement, columns: dict[str, object], sort: str, tie):
    try:
        return apply_sort(statement, columns, sort, tie)
    except ValueError as exc:
        raise ApiError(422, str(exc)) from exc


def _search(statement, columns: list[object], q: str | None):
    if not q:
        return statement
    pattern = like_pattern(q)
    return statement.where(or_(*(column.ilike(pattern, escape="\\") for column in columns)))


def _dedupe(ids: list[UUID]) -> list[UUID]:
    seen: set[UUID] = set()
    ordered: list[UUID] = []
    for item in ids:
        if item in seen:
            continue
        seen.add(item)
        ordered.append(item)
    return ordered


def _require_ids(session: Session, model, ids: list[UUID], label: str) -> list[UUID]:
    ordered = _dedupe(ids)
    if not ordered:
        return []
    found = set(session.scalars(select(model.id).where(model.id.in_(ordered), model.deleted_at.is_(None))).all())
    missing = [str(item) for item in ordered if item not in found]
    if missing:
        raise ApiError(422, f"Unknown {label}: {', '.join(missing)}")
    return ordered


def _uuid_list(config: dict | None, key: str) -> list[UUID]:
    raw = (config or {}).get(key) or []
    parsed: list[UUID] = []
    if not isinstance(raw, list):
        return parsed
    for item in raw:
        try:
            parsed.append(UUID(str(item)))
        except ValueError:
            continue
    return parsed


def _store_ids(config: dict | None, products: list[UUID] | None, courses: list[UUID] | None) -> dict:
    stored = dict(config or {})
    if products is not None:
        stored["featured_product_ids"] = [str(item) for item in products]
    if courses is not None:
        stored["featured_course_ids"] = [str(item) for item in courses]
    stored.pop("featured_products", None)
    stored.pop("featured_courses", None)
    return stored


def section_to_read(row: HomepageSection) -> HomepageSectionRead:
    return HomepageSectionRead(
        id=row.id,
        section_key=row.section_key,
        title=row.title,
        subtitle=row.subtitle,
        body=row.body,
        sort_order=row.sort_order,
        is_published=row.is_published,
        featured_product_ids=_uuid_list(row.config_json, "featured_product_ids"),
        featured_course_ids=_uuid_list(row.config_json, "featured_course_ids"),
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def list_banners(session: Session, *, staff: bool, page: int, page_size: int, sort: str, q: str | None):
    statement = select(Banner).where(Banner.deleted_at.is_(None))
    if not staff:
        statement = statement.where(Banner.is_published.is_(True))
    statement = _search(statement, [Banner.title, Banner.subtitle], q)
    statement = _sort(statement, {"title": Banner.title, "created_at": Banner.created_at, "sort_order": Banner.sort_order}, sort, Banner.id)
    return paginate(session, statement, page, page_size)


def create_banner(session: Session, data: BannerWrite) -> Banner:
    row = Banner(
        title=data.title.strip(),
        subtitle=_blank(data.subtitle),
        image_url=data.image_url.strip(),
        link_url=_blank(data.link_url),
        sort_order=data.sort_order,
        is_published=data.is_published,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def update_banner(session: Session, banner_id: UUID, data: BannerUpdate) -> Banner | None:
    row = session.get(Banner, banner_id)
    if row is None or row.deleted_at is not None:
        return None
    changes = data.model_dump(exclude_unset=True)
    for key in ("title", "subtitle", "image_url", "link_url"):
        if key in changes:
            changes[key] = _blank(changes[key]) if key != "title" and key != "image_url" else (changes[key].strip() if changes[key] else changes[key])
    if "title" in changes and changes["title"]:
        changes["title"] = changes["title"].strip()
    if "image_url" in changes and changes["image_url"]:
        changes["image_url"] = changes["image_url"].strip()
    if "subtitle" in changes:
        changes["subtitle"] = _blank(changes["subtitle"])
    if "link_url" in changes:
        changes["link_url"] = _blank(changes["link_url"])
    for key, value in changes.items():
        setattr(row, key, value)
    session.commit()
    session.refresh(row)
    return row


def delete_banner(session: Session, banner_id: UUID) -> bool:
    row = session.get(Banner, banner_id)
    if row is None or row.deleted_at is not None:
        return False
    row.deleted_at = _now()
    session.commit()
    return True


def list_sections(session: Session, *, staff: bool, page: int, page_size: int, sort: str, q: str | None):
    statement = select(HomepageSection).where(HomepageSection.deleted_at.is_(None))
    if not staff:
        statement = statement.where(HomepageSection.is_published.is_(True))
    statement = _search(statement, [HomepageSection.section_key, HomepageSection.title], q)
    statement = _sort(
        statement,
        {"section_key": HomepageSection.section_key, "title": HomepageSection.title, "created_at": HomepageSection.created_at, "sort_order": HomepageSection.sort_order},
        sort,
        HomepageSection.id,
    )
    rows, total = paginate(session, statement, page, page_size)
    return [section_to_read(row) for row in rows], total


def create_section(session: Session, data: HomepageSectionWrite) -> HomepageSectionRead:
    key = slugify(data.section_key)
    existing = session.scalar(select(HomepageSection).where(HomepageSection.section_key == key, HomepageSection.deleted_at.is_(None)))
    if existing is not None:
        raise ApiError(409, "A homepage section with this key already exists")
    products = _require_ids(session, Product, data.featured_product_ids, "product")
    courses = _require_ids(session, Course, data.featured_course_ids, "course")
    row = HomepageSection(
        section_key=key,
        title=_blank(data.title),
        subtitle=_blank(data.subtitle),
        body=_blank(data.body),
        sort_order=data.sort_order,
        is_published=data.is_published,
        config_json=_store_ids(None, products, courses),
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return section_to_read(row)


def update_section(session: Session, section_id: UUID, data: HomepageSectionUpdate) -> HomepageSectionRead | None:
    row = session.get(HomepageSection, section_id)
    if row is None or row.deleted_at is not None:
        return None
    changes = data.model_dump(exclude_unset=True)
    products = _require_ids(session, Product, changes.pop("featured_product_ids"), "product") if "featured_product_ids" in changes else None
    courses = _require_ids(session, Course, changes.pop("featured_course_ids"), "course") if "featured_course_ids" in changes else None
    for key in ("title", "subtitle", "body"):
        if key in changes:
            changes[key] = _blank(changes[key])
    for key, value in changes.items():
        setattr(row, key, value)
    if products is not None or courses is not None:
        row.config_json = _store_ids(row.config_json, products, courses)
    session.commit()
    session.refresh(row)
    return section_to_read(row)


def delete_section(session: Session, section_id: UUID) -> bool:
    row = session.get(HomepageSection, section_id)
    if row is None or row.deleted_at is not None:
        return False
    row.deleted_at = _now()
    session.commit()
    return True


def list_posts(session: Session, *, staff: bool, page: int, page_size: int, sort: str, q: str | None):
    statement = select(BlogPost).where(BlogPost.deleted_at.is_(None))
    if not staff:
        statement = statement.where(BlogPost.is_published.is_(True))
    statement = _search(statement, [BlogPost.title, BlogPost.excerpt, BlogPost.slug], q)
    statement = _sort(statement, {"title": BlogPost.title, "slug": BlogPost.slug, "created_at": BlogPost.created_at, "published_at": BlogPost.published_at}, sort, BlogPost.id)
    return paginate(session, statement, page, page_size)


def _unique_slug(session: Session, slug: str, exclude: UUID | None = None) -> None:
    statement = select(BlogPost.id).where(BlogPost.slug == slug, BlogPost.deleted_at.is_(None))
    if exclude is not None:
        statement = statement.where(BlogPost.id != exclude)
    if session.scalar(statement) is not None:
        raise ApiError(409, "A post with this slug already exists")


def create_post(session: Session, data: BlogWrite) -> BlogPost:
    slug = slugify(data.slug or data.title)
    _unique_slug(session, slug)
    row = BlogPost(
        title=data.title.strip(),
        slug=slug,
        excerpt=_blank(data.excerpt),
        body=data.body.strip(),
        is_published=data.is_published,
        published_at=_now() if data.is_published else None,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def update_post(session: Session, post_id: UUID, data: BlogUpdate) -> BlogPost | None:
    row = session.get(BlogPost, post_id)
    if row is None or row.deleted_at is not None:
        return None
    changes = data.model_dump(exclude_unset=True)
    if "slug" in changes and changes["slug"]:
        changes["slug"] = slugify(changes["slug"])
        _unique_slug(session, changes["slug"], exclude=row.id)
    if "title" in changes and changes["title"]:
        changes["title"] = changes["title"].strip()
    if "excerpt" in changes:
        changes["excerpt"] = _blank(changes["excerpt"])
    if "body" in changes and changes["body"]:
        changes["body"] = changes["body"].strip()
    for key, value in changes.items():
        setattr(row, key, value)
    if row.is_published and row.published_at is None:
        row.published_at = _now()
    session.commit()
    session.refresh(row)
    return row


def delete_post(session: Session, post_id: UUID) -> bool:
    row = session.get(BlogPost, post_id)
    if row is None or row.deleted_at is not None:
        return False
    row.deleted_at = _now()
    session.commit()
    return True


def list_seo(session: Session, *, page: int, page_size: int, sort: str, q: str | None):
    statement = select(SEOSetting).where(SEOSetting.deleted_at.is_(None))
    statement = _search(statement, [SEOSetting.path, SEOSetting.meta_title], q)
    statement = _sort(statement, {"path": SEOSetting.path, "created_at": SEOSetting.created_at}, sort, SEOSetting.id)
    return paginate(session, statement, page, page_size)


def lookup_seo(session: Session, path: str) -> SEOSetting | None:
    return session.scalar(select(SEOSetting).where(SEOSetting.path == path, SEOSetting.deleted_at.is_(None)))


def create_seo(session: Session, data: SeoWrite) -> SEOSetting:
    if lookup_seo(session, data.path) is not None:
        raise ApiError(409, "SEO for this path already exists")
    row = SEOSetting(
        path=data.path,
        meta_title=_blank(data.meta_title),
        meta_description=_blank(data.meta_description),
        og_image_url=_blank(data.og_image_url),
        canonical_path=_blank(data.canonical_path),
        robots=_blank(data.robots),
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def update_seo(session: Session, seo_id: UUID, data: SeoUpdate) -> SEOSetting | None:
    row = session.get(SEOSetting, seo_id)
    if row is None or row.deleted_at is not None:
        return None
    changes = data.model_dump(exclude_unset=True)
    for key, value in changes.items():
        setattr(row, key, _blank(value) if isinstance(value, str) else value)
    session.commit()
    session.refresh(row)
    return row


def delete_seo(session: Session, seo_id: UUID) -> bool:
    row = session.get(SEOSetting, seo_id)
    if row is None or row.deleted_at is not None:
        return False
    row.deleted_at = _now()
    session.commit()
    return True


def list_social(session: Session, *, staff: bool, page: int, page_size: int, sort: str, q: str | None):
    statement = select(SocialLink).where(SocialLink.deleted_at.is_(None))
    if not staff:
        statement = statement.where(SocialLink.is_published.is_(True))
    statement = _search(statement, [SocialLink.platform, SocialLink.url], q)
    statement = _sort(statement, {"platform": SocialLink.platform, "created_at": SocialLink.created_at, "sort_order": SocialLink.sort_order}, sort, SocialLink.id)
    return paginate(session, statement, page, page_size)


def create_social(session: Session, data: SocialWrite) -> SocialLink:
    row = SocialLink(platform=data.platform.strip(), url=data.url, sort_order=data.sort_order, is_published=data.is_published)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def update_social(session: Session, link_id: UUID, data: SocialUpdate) -> SocialLink | None:
    row = session.get(SocialLink, link_id)
    if row is None or row.deleted_at is not None:
        return None
    changes = data.model_dump(exclude_unset=True)
    if "platform" in changes and changes["platform"]:
        changes["platform"] = changes["platform"].strip()
    for key, value in changes.items():
        setattr(row, key, value)
    session.commit()
    session.refresh(row)
    return row


def delete_social(session: Session, link_id: UUID) -> bool:
    row = session.get(SocialLink, link_id)
    if row is None or row.deleted_at is not None:
        return False
    row.deleted_at = _now()
    session.commit()
    return True


def list_settings(session: Session, *, page: int, page_size: int, sort: str, q: str | None):
    statement = select(SiteSetting)
    statement = _search(statement, [SiteSetting.key, SiteSetting.value], q)
    statement = _sort(statement, {"key": SiteSetting.key, "created_at": SiteSetting.created_at}, sort, SiteSetting.id)
    return paginate(session, statement, page, page_size)


def create_setting(session: Session, data: SettingWrite) -> SiteSetting:
    existing = session.scalar(select(SiteSetting).where(SiteSetting.key == data.key))
    if existing is not None:
        raise ApiError(409, "A setting with this key already exists")
    row = SiteSetting(key=data.key, value=data.value)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def update_setting(session: Session, setting_id: UUID, data: SettingUpdate) -> SiteSetting | None:
    row = session.get(SiteSetting, setting_id)
    if row is None:
        return None
    if "value" in data.model_dump(exclude_unset=True):
        row.value = data.value
    session.commit()
    session.refresh(row)
    return row


def delete_setting(session: Session, setting_id: UUID) -> bool:
    row = session.get(SiteSetting, setting_id)
    if row is None:
        return False
    session.delete(row)
    session.commit()
    return True


def _price(session: Session, product_id: UUID) -> ProductPrice | None:
    return session.scalars(
        select(ProductPrice).where(
            ProductPrice.product_id == product_id,
            ProductPrice.variant_id.is_(None),
            ProductPrice.deleted_at.is_(None),
            ProductPrice.is_active.is_(True),
        )
    ).first()


def public_homepage(session: Session) -> HomepagePublic:
    banners, _total = list_banners(session, staff=False, page=1, page_size=20, sort="sort_order", q=None)
    sections = session.scalars(
        select(HomepageSection).where(HomepageSection.deleted_at.is_(None), HomepageSection.is_published.is_(True)).order_by(HomepageSection.sort_order.asc())
    ).all()
    product_ids: list[UUID] = []
    course_ids: list[UUID] = []
    for section in sections:
        product_ids.extend(_uuid_list(section.config_json, "featured_product_ids"))
        course_ids.extend(_uuid_list(section.config_json, "featured_course_ids"))
    products: list[FeaturedProductRead] = []
    seen_products: set[UUID] = set()
    for product_id in product_ids:
        if product_id in seen_products:
            continue
        seen_products.add(product_id)
        product = session.get(Product, product_id)
        if product is None or product.deleted_at is not None or not product.is_published:
            continue
        price = _price(session, product.id)
        products.append(
            FeaturedProductRead(
                id=product.id,
                slug=product.slug,
                name=product.name,
                summary=product.summary,
                product_type=product.product_type,
                listing_channel=product.listing_channel,
                price_amount=price.amount if price is not None else None,
                currency=price.currency if price is not None else None,
                billing_period=price.billing_period if price is not None else None,
            )
        )
    courses: list[FeaturedCourseRead] = []
    seen_courses: set[UUID] = set()
    for course_id in course_ids:
        if course_id in seen_courses:
            continue
        seen_courses.add(course_id)
        course = session.get(Course, course_id)
        if course is None or course.deleted_at is not None or not course.is_published:
            continue
        courses.append(
            FeaturedCourseRead(
                id=course.id,
                slug=course.slug,
                title=course.title,
                summary=course.summary,
                level=course.level,
                duration_label=course.duration_label,
                thumbnail_url=course.thumbnail_url,
                price_amount=course.price_amount,
                currency=course.currency,
            )
        )
    return HomepagePublic(banners=[BannerRead.model_validate(row) for row in banners], featured_products=products, featured_courses=courses)
