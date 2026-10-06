from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.web import public_url, setting_key
from app.models.enums import BillingPeriod, ListingChannel, ProductType


class BannerWrite(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    subtitle: str | None = Field(default=None, max_length=300)
    image_url: str = Field(min_length=1, max_length=500)
    link_url: str | None = Field(default=None, max_length=500)
    sort_order: int = 0
    is_published: bool = False

    @field_validator("image_url", "link_url")
    @classmethod
    def safe_url(cls, value: str | None) -> str | None:
        return public_url(value)


class BannerUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    subtitle: str | None = Field(default=None, max_length=300)
    image_url: str | None = Field(default=None, min_length=1, max_length=500)
    link_url: str | None = Field(default=None, max_length=500)
    sort_order: int | None = None
    is_published: bool | None = None

    @field_validator("image_url", "link_url")
    @classmethod
    def safe_url(cls, value: str | None) -> str | None:
        return public_url(value)


class BannerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    subtitle: str | None
    image_url: str
    link_url: str | None
    sort_order: int
    is_published: bool
    created_at: datetime
    updated_at: datetime


class HomepageSectionWrite(BaseModel):
    section_key: str = Field(min_length=1, max_length=80)
    title: str | None = Field(default=None, max_length=200)
    subtitle: str | None = Field(default=None, max_length=300)
    body: str | None = None
    sort_order: int = 0
    is_published: bool = False
    featured_product_ids: list[UUID] = Field(default_factory=list)
    featured_course_ids: list[UUID] = Field(default_factory=list)


class HomepageSectionUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    subtitle: str | None = Field(default=None, max_length=300)
    body: str | None = None
    sort_order: int | None = None
    is_published: bool | None = None
    featured_product_ids: list[UUID] | None = None
    featured_course_ids: list[UUID] | None = None


class HomepageSectionRead(BaseModel):
    id: UUID
    section_key: str
    title: str | None
    subtitle: str | None
    body: str | None
    sort_order: int
    is_published: bool
    featured_product_ids: list[UUID]
    featured_course_ids: list[UUID]
    created_at: datetime
    updated_at: datetime


class BlogWrite(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=160)
    excerpt: str | None = None
    body: str = Field(min_length=1)
    is_published: bool = False


class BlogUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=160)
    excerpt: str | None = None
    body: str | None = Field(default=None, min_length=1)
    is_published: bool | None = None


class BlogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    title: str
    excerpt: str | None
    body: str
    published_at: datetime | None
    is_published: bool
    created_at: datetime
    updated_at: datetime


class SeoWrite(BaseModel):
    path: str = Field(min_length=1, max_length=255)
    meta_title: str | None = Field(default=None, max_length=180)
    meta_description: str | None = Field(default=None, max_length=320)
    og_image_url: str | None = Field(default=None, max_length=500)
    canonical_path: str | None = Field(default=None, max_length=255)
    robots: str | None = Field(default=None, max_length=80)

    @field_validator("path", "canonical_path")
    @classmethod
    def site_path(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            return None
        if not stripped.startswith("/"):
            raise ValueError("Path must start with /")
        return stripped

    @field_validator("og_image_url")
    @classmethod
    def safe_image(cls, value: str | None) -> str | None:
        return public_url(value)


class SeoUpdate(BaseModel):
    meta_title: str | None = Field(default=None, max_length=180)
    meta_description: str | None = Field(default=None, max_length=320)
    og_image_url: str | None = Field(default=None, max_length=500)
    canonical_path: str | None = Field(default=None, max_length=255)
    robots: str | None = Field(default=None, max_length=80)

    @field_validator("canonical_path")
    @classmethod
    def site_path(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            return None
        if not stripped.startswith("/"):
            raise ValueError("Path must start with /")
        return stripped

    @field_validator("og_image_url")
    @classmethod
    def safe_image(cls, value: str | None) -> str | None:
        return public_url(value)


class SeoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    path: str
    meta_title: str | None
    meta_description: str | None
    og_image_url: str | None
    canonical_path: str | None
    robots: str | None
    created_at: datetime
    updated_at: datetime


class SocialWrite(BaseModel):
    platform: str = Field(min_length=1, max_length=50)
    url: str = Field(min_length=1, max_length=500)
    sort_order: int = 0
    is_published: bool = False

    @field_validator("url")
    @classmethod
    def http_url(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return stripped


class SocialUpdate(BaseModel):
    platform: str | None = Field(default=None, min_length=1, max_length=50)
    url: str | None = Field(default=None, min_length=1, max_length=500)
    sort_order: int | None = None
    is_published: bool | None = None

    @field_validator("url")
    @classmethod
    def http_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return stripped


class SocialRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    platform: str
    url: str
    sort_order: int
    is_published: bool
    created_at: datetime
    updated_at: datetime


class SettingWrite(BaseModel):
    key: str = Field(min_length=2, max_length=80, pattern=r"^[a-z][a-z0-9_]*$")
    value: str | None = Field(default=None, max_length=5000)

    @field_validator("key")
    @classmethod
    def reserved_key(cls, value: str) -> str:
        return setting_key(value)


class SettingUpdate(BaseModel):
    value: str | None = Field(default=None, max_length=5000)


class SettingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    key: str
    value: str | None
    created_at: datetime
    updated_at: datetime


class FeaturedProductRead(BaseModel):
    id: UUID
    slug: str
    name: str
    summary: str | None
    product_type: ProductType
    listing_channel: ListingChannel
    price_amount: Decimal | None
    currency: str | None
    billing_period: BillingPeriod | None


class FeaturedCourseRead(BaseModel):
    id: UUID
    slug: str
    title: str
    summary: str | None
    level: str | None
    duration_label: str | None
    thumbnail_url: str | None
    price_amount: Decimal | None
    currency: str


class HomepagePublic(BaseModel):
    banners: list[BannerRead]
    featured_products: list[FeaturedProductRead]
    featured_courses: list[FeaturedCourseRead]


class CountItem(BaseModel):
    label: str
    value: int


class AdminSummary(BaseModel):
    customers: int
    students: int
    products: int
    courses: int
    orders: int
    enquiries: int
    quote_requests: int
    revenue: Decimal | None
    revenue_currency: str | None
    orders_by_status: list[CountItem]
    quotes_by_status: list[CountItem]
    enquiries_by_status: list[CountItem]


class PersonRead(BaseModel):
    id: UUID
    full_name: str
    email: str
    phone: str | None
    is_active: bool
    created_at: datetime


class ActivityRead(BaseModel):
    id: UUID
    action: str
    entity_type: str
    entity_id: UUID | None
    actor_email: str | None
    created_at: datetime
