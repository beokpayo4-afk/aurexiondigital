from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_optional_user
from app.api.http import call_api
from app.models.auth import User
from app.schemas.commerce import CartItemCreate, CartItemUpdate, CartRead
from app.services import commerce

router = APIRouter(prefix="/cart", tags=["cart"])


def _owner(
    user: Annotated[User | None, Depends(get_optional_user)],
    cart_token: Annotated[str | None, Header(alias="X-Cart-Token")] = None,
) -> tuple[UUID | None, str | None]:
    if user is not None:
        return user.id, None
    return None, cart_token


@router.get("", response_model=CartRead, summary="Get the current cart")
def get_cart(
    session: Annotated[Session, Depends(get_db)],
    owner: Annotated[tuple[UUID | None, str | None], Depends(_owner)],
) -> CartRead:
    user_id, guest_token = owner
    return call_api(lambda: commerce.read_cart(session, user_id=user_id, guest_token=guest_token))


@router.post("/items", response_model=CartRead, summary="Add a priced shop product to the cart")
def add_item(
    data: CartItemCreate,
    session: Annotated[Session, Depends(get_db)],
    owner: Annotated[tuple[UUID | None, str | None], Depends(_owner)],
) -> CartRead:
    user_id, guest_token = owner
    return call_api(
        lambda: commerce.add_item(
            session,
            user_id=user_id,
            guest_token=guest_token,
            product_id=data.product_id,
            quantity=data.quantity,
        )
    )


@router.patch("/items/{item_id}", response_model=CartRead, summary="Change a cart item quantity")
def update_item(
    item_id: UUID,
    data: CartItemUpdate,
    session: Annotated[Session, Depends(get_db)],
    owner: Annotated[tuple[UUID | None, str | None], Depends(_owner)],
) -> CartRead:
    user_id, guest_token = owner
    return call_api(
        lambda: commerce.update_item(session, user_id=user_id, guest_token=guest_token, item_id=item_id, quantity=data.quantity)
    )


@router.delete("/items/{item_id}", response_model=CartRead, summary="Remove a cart item")
def remove_item(
    item_id: UUID,
    session: Annotated[Session, Depends(get_db)],
    owner: Annotated[tuple[UUID | None, str | None], Depends(_owner)],
) -> CartRead:
    user_id, guest_token = owner
    return call_api(lambda: commerce.remove_item(session, user_id=user_id, guest_token=guest_token, item_id=item_id))


@router.post("/claim", response_model=CartRead, summary="Move a guest cart onto the signed-in account")
def claim_cart(
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
    cart_token: Annotated[str | None, Header(alias="X-Cart-Token")] = None,
) -> CartRead:
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in to keep this cart")
    return call_api(lambda: commerce.claim_cart(session, user_id=user.id, guest_token=cart_token))
