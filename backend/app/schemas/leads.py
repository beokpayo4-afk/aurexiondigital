from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.models.enums import BusinessArea, LeadStatus, QuoteStatus


CONTACT_INTERESTS = ("Marketing", "Technology", "Education", "Other")
CONTACT_CHANNELS = ("Online", "Offline", "Both")


class EnquiryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=32)
    company_name: str | None = Field(default=None, max_length=200)
    message: str = Field(min_length=1)
    service_id: UUID | None = None


class EnquiryUpdate(BaseModel):
    status: LeadStatus | None = None
    assigned_to_user_id: UUID | None = None
    notes: str | None = Field(default=None, max_length=5000)


class EnquiryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID | None
    service_id: UUID | None
    service_name: str | None = None
    name: str
    email: str
    phone: str | None
    company_name: str | None = None
    message: str
    notes: str | None = None
    status: LeadStatus
    assigned_to_user_id: UUID | None = None
    assigned_to_name: str | None = None
    created_at: datetime
    updated_at: datetime


CAMPAIGN_CHANNELS = (
    "Meta Ads",
    "Instagram",
    "YouTube",
    "Google Ads",
    "Influencer Marketing",
    "Billboard",
    "Bus Advertising",
    "Flex/Boards",
    "Event/Hall Advertising",
    "Content Creation",
    "Lead Generation",
    "SEO",
    "Social Media Marketing",
    "Creative Services",
)


class QuoteCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=32)
    organization: str | None = Field(default=None, max_length=200)
    product_service: str | None = Field(default=None, max_length=200)
    target_location: str | None = Field(default=None, max_length=200)
    target_audience: str | None = None
    estimated_budget: str | None = Field(default=None, max_length=80)
    channels: list[str] = Field(default_factory=list)
    requirements: str = Field(min_length=1)
    business_area: BusinessArea | None = None
    service_id: UUID | None = None

    @field_validator("channels")
    @classmethod
    def known_channels(cls, value: list[str]) -> list[str]:
        unknown = [channel for channel in value if channel not in CAMPAIGN_CHANNELS]
        if unknown:
            raise ValueError("Choose a published campaign channel")
        seen: list[str] = []
        for channel in value:
            if channel not in seen:
                seen.append(channel)
        return seen


class QuoteUpdate(BaseModel):
    status: QuoteStatus | None = None
    response_message: str | None = None
    response_amount: Decimal | None = Field(default=None, ge=0)


class QuoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID | None
    service_id: UUID | None
    business_area: BusinessArea | None
    organization: str | None = None
    product_service: str | None = None
    target_location: str | None = None
    target_audience: str | None = None
    estimated_budget: str | None = None
    channels: list[str] = Field(default_factory=list)
    name: str
    email: str
    phone: str | None
    requirements: str
    status: QuoteStatus

    @field_validator("channels", mode="before")
    @classmethod
    def empty_channels(cls, value: list[str] | None) -> list[str]:
        return value or []
    response_message: str | None
    response_amount: Decimal | None
    responded_at: datetime | None
    responded_by_user_id: UUID | None
    created_at: datetime
    updated_at: datetime


class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=32)
    company_name: str | None = Field(default=None, max_length=200)
    promote: str | None = None
    interest: str | None = Field(default=None, max_length=40)
    channel: str | None = Field(default=None, max_length=20)
    budget: str | None = Field(default=None, max_length=80)
    target_location: str | None = Field(default=None, max_length=200)
    subject: str | None = Field(default=None, max_length=200)
    message: str = Field(min_length=1)
    source_path: str | None = Field(default=None, max_length=255)

    @field_validator("interest")
    @classmethod
    def known_interest(cls, value: str | None) -> str | None:
        if value is None or value in CONTACT_INTERESTS:
            return value
        raise ValueError("Choose Marketing, Technology, Education, or Other")

    @field_validator("channel")
    @classmethod
    def known_channel(cls, value: str | None) -> str | None:
        if value is None or value in CONTACT_CHANNELS:
            return value
        raise ValueError("Choose Online, Offline, or Both")

    @model_validator(mode="after")
    def topic(self) -> "ContactCreate":
        subject = (self.subject or "").strip()
        promote = (self.promote or "").strip()
        if not subject and not promote:
            raise ValueError("Describe what you want to promote or build")
        return self


class ContactRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str
    phone: str | None
    company_name: str | None = None
    promote: str | None = None
    interest: str | None = None
    channel: str | None = None
    budget: str | None = None
    target_location: str | None = None
    subject: str
    message: str
    status: LeadStatus
    source_path: str | None
    created_at: datetime
    updated_at: datetime
