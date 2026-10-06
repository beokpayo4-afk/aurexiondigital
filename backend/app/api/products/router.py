from typing import Annotated
from uuid import UUID

from decimal import Decimal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_optional_user, require_roles
from app.api.http import call_api, not_found
from app.api.listing import page_params, search_param
from app.core.roles import RoleCode
from app.models.auth import User
from app.models.enums import BusinessArea, ListingChannel, ProductType
from app.schemas.catalog import ProductCreate, ProductRead, ProductUpdate
from app.schemas.common import Page
from app.services import catalog
from app.services.access import is_staff

router = APIRouter(prefix="/products", tags=["products"])
_staff = require_roles(RoleCode.ADMIN, RoleCode.STAFF)

_SORT = "Sort field. Prefix with - for descending. Allowed: name, slug, created_at, sort_order, price."


@router.get(
    "",
    response_model=Page[ProductRead],
    summary="List products",
    description=(
        "Public callers receive published products only. Admin and staff also receive unpublished drafts. "
        "Deleted products are never returned. Active prices are included; admin and staff also see inactive prices."
    ),
)
def list_products(
    page: Annotated[tuple[int, int], Depends(page_params)],
    q: Annotated[str | None, Depends(search_param)],
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
    sort: Annotated[str, Query(description=_SORT)] = "sort_order",
    business_area: Annotated[BusinessArea | None, Query(description="Filter by business area.")] = None,
    category_id: Annotated[UUID | None, Query(description="Filter by product category id.")] = None,
    product_type: Annotated[ProductType | None, Query(description="Filter by product type.")] = None,
    listing_channel: Annotated[ListingChannel | None, Query(description="Filter by listing channel.")] = None,
    is_published: Annotated[
        bool | None,
        Query(description="Admin and staff only. Public requests always return published products."),
    ] = None,
    for_shop: Annotated[
        bool,
        Query(description="When true, return products listed on the shop channel or on both channels."),
    ] = False,
    min_price: Annotated[Decimal | None, Query(ge=0, description="Lowest active price to include.")] = None,
    max_price: Annotated[Decimal | None, Query(ge=0, description="Highest active price to include.")] = None,
) -> Page[ProductRead]:
    page_number, page_size = page
    items, total = call_api(
        lambda: catalog.list_products(
            session,
            staff=is_staff(user),
            page=page_number,
            page_size=page_size,
            q=q,
            sort=sort,
            business_area=business_area,
            category_id=category_id,
            product_type=product_type,
            listing_channel=listing_channel,
            is_published=is_published,
            for_shop=for_shop,
            min_price=min_price,
            max_price=max_price,
        )
    )
    return Page[ProductRead](items=items, page=page_number, page_size=page_size, total=total)


@router.get(
    "/{slug}",
    response_model=ProductRead,
    summary="Get a product by slug",
    description="Returns one product. Unpublished products are visible only to admin and staff. Deleted products are hidden from everyone.",
)
def get_product(
    slug: str,
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
) -> ProductRead:
    product = catalog.get_product_by_slug(session, slug, staff=is_staff(user))
    if product is None:
        not_found()
    return product


@router.post(
    "",
    response_model=ProductRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a product",
    description="Admin and staff only. A new product stays unpublished unless is_published is true.",
)
def create_product(
    data: ProductCreate,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> ProductRead:
    return call_api(lambda: catalog.create_product(session, data))


@router.put(
    "/{product_id}",
    response_model=ProductRead,
    summary="Update a product",
    description="Admin and staff only. The path uses the product id, not the slug.",
)
def update_product(
    product_id: UUID,
    data: ProductUpdate,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> ProductRead:
    product = call_api(lambda: catalog.update_product(session, product_id, data))
    if product is None:
        not_found()
    return product


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a product",
    description="Admin and staff only. Soft-deletes the product so it no longer appears in public or staff lists.",
)
def delete_product(
    product_id: UUID,
    session: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(_staff)],
) -> None:
    if not catalog.delete_product(session, product_id):
        not_found()
