from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import BusinessArea


class TestimonialWrite(BaseModel):
    author_name: str = Field(min_length=1, max_length=200)
    author_role: str | None = Field(default=None, max_length=150)
    body: str = Field(min_length=1)
    rating: int | None = Field(default=None, ge=1, le=5)
    business_area: BusinessArea | None = None
    sort_order: int = 0
    is_published: bool = False


class TestimonialUpdate(BaseModel):
    author_name: str | None = Field(default=None, min_length=1, max_length=200)
    author_role: str | None = Field(default=None, max_length=150)
    body: str | None = Field(default=None, min_length=1)
    rating: int | None = Field(default=None, ge=1, le=5)
    business_area: BusinessArea | None = None
    sort_order: int | None = None
    is_published: bool | None = None


class TestimonialRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    author_name: str
    author_role: str | None
    body: str
    rating: int | None
    business_area: BusinessArea | None
    sort_order: int
    is_published: bool
