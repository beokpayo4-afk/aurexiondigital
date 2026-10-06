from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """Paginated collection. `page` starts at 1."""

    items: list[T]
    page: int = Field(description="Current page, starting at 1.")
    page_size: int = Field(description="Maximum number of items requested for this page.")
    total: int = Field(description="Total matching records, before pagination.")
