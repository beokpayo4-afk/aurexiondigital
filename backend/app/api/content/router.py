from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_optional_user, require_roles
from app.api.http import call_api, not_found
from app.api.listing import page_params, search_param
from app.core.roles import RoleCode
from app.models.auth import User
from app.schemas.common import Page
from app.schemas.content_admin import (
    BannerRead,
    BannerUpdate,
    BannerWrite,
    BlogRead,
    BlogUpdate,
    BlogWrite,
    HomepagePublic,
    HomepageSectionRead,
    HomepageSectionUpdate,
    HomepageSectionWrite,
    SeoRead,
    SeoUpdate,
    SeoWrite,
    SettingRead,
    SettingUpdate,
    SettingWrite,
    SocialRead,
    SocialUpdate,
    SocialWrite,
)
from app.services import content_admin
from app.services.access import is_staff

router = APIRouter(tags=["content"])
_staff = require_roles(RoleCode.ADMIN, RoleCode.STAFF)


@router.get("/homepage", response_model=HomepagePublic, summary="Published homepage content")
def homepage(session: Annotated[Session, Depends(get_db)], response: Response) -> HomepagePublic:
    response.headers["Cache-Control"] = "public, max-age=60"
    return content_admin.public_homepage(session)


@router.get("/banners", response_model=Page[BannerRead], summary="List banners")
def list_banners(
    page: Annotated[tuple[int, int], Depends(page_params)],
    q: Annotated[str | None, Depends(search_param)],
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
    sort: Annotated[str, Query()] = "sort_order",
) -> Page[BannerRead]:
    items, total = call_api(lambda: content_admin.list_banners(session, staff=is_staff(user), page=page[0], page_size=page[1], sort=sort, q=q))
    return Page[BannerRead](items=items, page=page[0], page_size=page[1], total=total)


@router.post("/banners", response_model=BannerRead, status_code=status.HTTP_201_CREATED, summary="Create a banner")
def create_banner(data: BannerWrite, session: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(_staff)]) -> BannerRead:
    return call_api(lambda: content_admin.create_banner(session, data))


@router.put("/banners/{banner_id}", response_model=BannerRead, summary="Update a banner")
def update_banner(banner_id: UUID, data: BannerUpdate, session: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(_staff)]) -> BannerRead:
    row = call_api(lambda: content_admin.update_banner(session, banner_id, data))
    if row is None:
        not_found()
    return row


@router.delete("/banners/{banner_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a banner")
def delete_banner(banner_id: UUID, session: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(_staff)]) -> None:
    if not content_admin.delete_banner(session, banner_id):
        not_found()


@router.get("/homepage-sections", response_model=Page[HomepageSectionRead], summary="List homepage sections")
def list_sections(
    page: Annotated[tuple[int, int], Depends(page_params)],
    q: Annotated[str | None, Depends(search_param)],
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
    sort: Annotated[str, Query()] = "sort_order",
) -> Page[HomepageSectionRead]:
    items, total = call_api(lambda: content_admin.list_sections(session, staff=is_staff(user), page=page[0], page_size=page[1], sort=sort, q=q))
    return Page[HomepageSectionRead](items=items, page=page[0], page_size=page[1], total=total)


@router.post("/homepage-sections", response_model=HomepageSectionRead, status_code=status.HTTP_201_CREATED, summary="Create a homepage section")
def create_section(data: HomepageSectionWrite, session: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(_staff)]) -> HomepageSectionRead:
    return call_api(lambda: content_admin.create_section(session, data))


@router.put("/homepage-sections/{section_id}", response_model=HomepageSectionRead, summary="Update a homepage section")
def update_section(
    section_id: UUID,
    data: HomepageSectionUpdate,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> HomepageSectionRead:
    row = call_api(lambda: content_admin.update_section(session, section_id, data))
    if row is None:
        not_found()
    return row


@router.delete("/homepage-sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a homepage section")
def delete_section(section_id: UUID, session: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(_staff)]) -> None:
    if not content_admin.delete_section(session, section_id):
        not_found()


@router.get("/blog-posts", response_model=Page[BlogRead], summary="List blog posts")
def list_posts(
    page: Annotated[tuple[int, int], Depends(page_params)],
    q: Annotated[str | None, Depends(search_param)],
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
    sort: Annotated[str, Query()] = "-created_at",
) -> Page[BlogRead]:
    items, total = call_api(lambda: content_admin.list_posts(session, staff=is_staff(user), page=page[0], page_size=page[1], sort=sort, q=q))
    return Page[BlogRead](items=items, page=page[0], page_size=page[1], total=total)


@router.post("/blog-posts", response_model=BlogRead, status_code=status.HTTP_201_CREATED, summary="Create a blog post")
def create_post(data: BlogWrite, session: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(_staff)]) -> BlogRead:
    return call_api(lambda: content_admin.create_post(session, data))


@router.put("/blog-posts/{post_id}", response_model=BlogRead, summary="Update a blog post")
def update_post(post_id: UUID, data: BlogUpdate, session: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(_staff)]) -> BlogRead:
    row = call_api(lambda: content_admin.update_post(session, post_id, data))
    if row is None:
        not_found()
    return row


@router.delete("/blog-posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a blog post")
def delete_post(post_id: UUID, session: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(_staff)]) -> None:
    if not content_admin.delete_post(session, post_id):
        not_found()


@router.get("/seo-settings/lookup", response_model=SeoRead | None, summary="Public SEO for one path")
def lookup_seo(path: Annotated[str, Query(min_length=1, max_length=255)], session: Annotated[Session, Depends(get_db)], response: Response) -> SeoRead | None:
    response.headers["Cache-Control"] = "public, max-age=60"
    return content_admin.lookup_seo(session, path)


@router.get("/seo-settings", response_model=Page[SeoRead], summary="List SEO settings")
def list_seo(
    page: Annotated[tuple[int, int], Depends(page_params)],
    q: Annotated[str | None, Depends(search_param)],
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
    sort: Annotated[str, Query()] = "path",
) -> Page[SeoRead]:
    items, total = call_api(lambda: content_admin.list_seo(session, page=page[0], page_size=page[1], sort=sort, q=q))
    return Page[SeoRead](items=items, page=page[0], page_size=page[1], total=total)


@router.post("/seo-settings", response_model=SeoRead, status_code=status.HTTP_201_CREATED, summary="Create SEO settings")
def create_seo(data: SeoWrite, session: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(_staff)]) -> SeoRead:
    return call_api(lambda: content_admin.create_seo(session, data))


@router.put("/seo-settings/{seo_id}", response_model=SeoRead, summary="Update SEO settings")
def update_seo(seo_id: UUID, data: SeoUpdate, session: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(_staff)]) -> SeoRead:
    row = call_api(lambda: content_admin.update_seo(session, seo_id, data))
    if row is None:
        not_found()
    return row


@router.delete("/seo-settings/{seo_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete SEO settings")
def delete_seo(seo_id: UUID, session: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(_staff)]) -> None:
    if not content_admin.delete_seo(session, seo_id):
        not_found()


@router.get("/social-links", response_model=Page[SocialRead], summary="List social links")
def list_social(
    page: Annotated[tuple[int, int], Depends(page_params)],
    q: Annotated[str | None, Depends(search_param)],
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
    sort: Annotated[str, Query()] = "sort_order",
) -> Page[SocialRead]:
    items, total = call_api(lambda: content_admin.list_social(session, staff=is_staff(user), page=page[0], page_size=page[1], sort=sort, q=q))
    return Page[SocialRead](items=items, page=page[0], page_size=page[1], total=total)


@router.post("/social-links", response_model=SocialRead, status_code=status.HTTP_201_CREATED, summary="Create a social link")
def create_social(data: SocialWrite, session: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(_staff)]) -> SocialRead:
    return call_api(lambda: content_admin.create_social(session, data))


@router.put("/social-links/{link_id}", response_model=SocialRead, summary="Update a social link")
def update_social(link_id: UUID, data: SocialUpdate, session: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(_staff)]) -> SocialRead:
    row = call_api(lambda: content_admin.update_social(session, link_id, data))
    if row is None:
        not_found()
    return row


@router.delete("/social-links/{link_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a social link")
def delete_social(link_id: UUID, session: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(_staff)]) -> None:
    if not content_admin.delete_social(session, link_id):
        not_found()


@router.get("/settings", response_model=Page[SettingRead], summary="List site settings")
def list_settings(
    page: Annotated[tuple[int, int], Depends(page_params)],
    q: Annotated[str | None, Depends(search_param)],
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
    sort: Annotated[str, Query()] = "key",
) -> Page[SettingRead]:
    items, total = call_api(lambda: content_admin.list_settings(session, page=page[0], page_size=page[1], sort=sort, q=q))
    return Page[SettingRead](items=items, page=page[0], page_size=page[1], total=total)


@router.post("/settings", response_model=SettingRead, status_code=status.HTTP_201_CREATED, summary="Create a site setting")
def create_setting(data: SettingWrite, session: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(_staff)]) -> SettingRead:
    return call_api(lambda: content_admin.create_setting(session, data))


@router.put("/settings/{setting_id}", response_model=SettingRead, summary="Update a site setting")
def update_setting(setting_id: UUID, data: SettingUpdate, session: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(_staff)]) -> SettingRead:
    row = call_api(lambda: content_admin.update_setting(session, setting_id, data))
    if row is None:
        not_found()
    return row


@router.delete("/settings/{setting_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a site setting")
def delete_setting(setting_id: UUID, session: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(_staff)]) -> None:
    if not content_admin.delete_setting(session, setting_id):
        not_found()
