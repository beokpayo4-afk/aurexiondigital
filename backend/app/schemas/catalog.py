from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.web import public_url, storage_key
from app.models.enums import BillingPeriod, BusinessArea, ListingChannel, ProductType


class FeatureRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    label: str
    sort_order: int


class ServicePackageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    service_id: UUID
    slug: str
    name: str
    summary: str | None
    price_amount: Decimal | None
    currency: str
    billing_period: BillingPeriod | None
    sort_order: int
    is_published: bool
    features: list[FeatureRead] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ServicePackageCreate(BaseModel):
    service_id: UUID
    name: str = Field(min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=160)
    summary: str | None = None
    price_amount: Decimal | None = Field(default=None, ge=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    billing_period: BillingPeriod | None = None
    sort_order: int = 0
    is_published: bool = False


class ServicePackageUpdate(BaseModel):
    service_id: UUID | None = None
    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=160)
    summary: str | None = None
    price_amount: Decimal | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    billing_period: BillingPeriod | None = None
    sort_order: int | None = None
    is_published: bool | None = None


class ServiceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    category_id: UUID | None
    business_area: BusinessArea
    slug: str
    name: str
    summary: str | None
    description: str | None
    sort_order: int
    is_published: bool
    packages: list[ServicePackageRead] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ServiceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=160)
    business_area: BusinessArea
    category_id: UUID | None = None
    summary: str | None = None
    description: str | None = None
    sort_order: int = 0
    is_published: bool = False


class ServiceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=160)
    business_area: BusinessArea | None = None
    category_id: UUID | None = None
    summary: str | None = None
    description: str | None = None
    sort_order: int | None = None
    is_published: bool | None = None


class ProductFeatureRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    label: str
    value: str | None
    sort_order: int


class ProductImageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    file_url: str
    alt_text: str | None
    sort_order: int
    is_primary: bool


class PriceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    variant_id: UUID | None
    amount: Decimal
    currency: str
    billing_period: BillingPeriod | None
    is_active: bool


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    category_id: UUID | None
    business_area: BusinessArea
    slug: str
    name: str
    summary: str | None
    description: str | None
    product_type: ProductType
    listing_channel: ListingChannel
    sku: str | None
    demo_url: str | None
    is_downloadable: bool
    track_stock: bool
    stock_quantity: int | None
    sort_order: int
    is_published: bool
    features: list[ProductFeatureRead] = Field(default_factory=list)
    images: list[ProductImageRead] = Field(default_factory=list)
    prices: list[PriceRead] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=160)
    business_area: BusinessArea
    product_type: ProductType
    listing_channel: ListingChannel = ListingChannel.SHOP
    category_id: UUID | None = None
    summary: str | None = None
    description: str | None = None
    sku: str | None = Field(default=None, max_length=80)
    demo_url: str | None = Field(default=None, max_length=500)
    download_storage_key: str | None = Field(default=None, max_length=500)
    is_downloadable: bool = False
    track_stock: bool = False
    stock_quantity: int | None = Field(default=None, ge=0)
    sort_order: int = 0
    is_published: bool = False

    @field_validator("demo_url")
    @classmethod
    def safe_demo(cls, value: str | None) -> str | None:
        return public_url(value)

    @field_validator("download_storage_key")
    @classmethod
    def safe_storage_key(cls, value: str | None) -> str | None:
        return storage_key(value)


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=160)
    business_area: BusinessArea | None = None
    product_type: ProductType | None = None
    listing_channel: ListingChannel | None = None
    category_id: UUID | None = None
    summary: str | None = None
    description: str | None = None
    sku: str | None = Field(default=None, max_length=80)
    demo_url: str | None = Field(default=None, max_length=500)
    download_storage_key: str | None = Field(default=None, max_length=500)
    is_downloadable: bool | None = None
    track_stock: bool | None = None
    stock_quantity: int | None = Field(default=None, ge=0)
    sort_order: int | None = None
    is_published: bool | None = None

    @field_validator("demo_url")
    @classmethod
    def safe_demo(cls, value: str | None) -> str | None:
        return public_url(value)

    @field_validator("download_storage_key")
    @classmethod
    def safe_storage_key(cls, value: str | None) -> str | None:
        return storage_key(value)


class CourseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    category_id: UUID | None
    business_area: BusinessArea
    slug: str
    title: str
    summary: str | None
    description: str | None
    level: str | None
    duration_label: str | None
    thumbnail_url: str | None = None
    learning_outcomes: list[str] = Field(default_factory=list)
    certificate_enabled: bool = False
    price_amount: Decimal | None
    currency: str
    sort_order: int
    is_published: bool
    created_at: datetime
    updated_at: datetime


class CourseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=160)
    business_area: BusinessArea
    category_id: UUID | None = None
    summary: str | None = None
    description: str | None = None
    level: str | None = Field(default=None, max_length=50)
    duration_label: str | None = Field(default=None, max_length=80)
    thumbnail_url: str | None = Field(default=None, max_length=500)
    learning_outcomes: list[str] = Field(default_factory=list)
    certificate_enabled: bool = False
    price_amount: Decimal | None = Field(default=None, ge=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    sort_order: int = 0
    is_published: bool = False

    @field_validator("thumbnail_url")
    @classmethod
    def safe_thumbnail(cls, value: str | None) -> str | None:
        return public_url(value)


class CourseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=160)
    business_area: BusinessArea | None = None
    category_id: UUID | None = None
    summary: str | None = None
    description: str | None = None
    level: str | None = Field(default=None, max_length=50)
    duration_label: str | None = Field(default=None, max_length=80)
    thumbnail_url: str | None = Field(default=None, max_length=500)
    learning_outcomes: list[str] | None = None
    certificate_enabled: bool | None = None
    price_amount: Decimal | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    sort_order: int | None = None
    is_published: bool | None = None

    @field_validator("thumbnail_url")
    @classmethod
    def safe_thumbnail(cls, value: str | None) -> str | None:
        return public_url(value)


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    kind: str
    parent_id: UUID | None
    slug: str
    name: str
    description: str | None
    sort_order: int
    is_published: bool
    created_at: datetime
    updated_at: datetime


class CategoryCreate(BaseModel):
    kind: Literal["service", "product", "course"] = Field(description="Which catalog the category belongs to.")
    name: str = Field(min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=160)
    parent_id: UUID | None = None
    description: str | None = None
    sort_order: int = 0
    is_published: bool = False


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=160)
    parent_id: UUID | None = None
    description: str | None = None
    sort_order: int | None = None
    is_published: bool | None = None
