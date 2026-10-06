import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext } from "@/context/auth-context";
import { CartProvider, useCart } from "@/context/CartContext";
import { addCartItem, fetchCart, type Cart } from "@/services/shopService";
import { authState } from "@/test/auth";

vi.mock("@/services/shopService", () => ({
  fetchCart: vi.fn(),
  claimCart: vi.fn(),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
}));

const emptyCart: Cart = {
  id: "cart-1",
  guest_token: "guest",
  currency: "INR",
  subtotal: "0.00",
  items: [],
};

const filledCart: Cart = {
  ...emptyCart,
  subtotal: "499.00",
  items: [
    {
      id: "item-1",
      product_id: "product-1",
      slug: "starter-kit",
      name: "Starter kit",
      quantity: 1,
      unit_price: "499.00",
      currency: "INR",
      line_total: "499.00",
      is_downloadable: false,
    },
  ],
};

function Probe() {
  const { cart, add } = useCart();
  return (
    <div>
      <p>{cart ? `${cart.items.length} items` : "No cart"}</p>
      <button type="button" onClick={() => void add("product-1")}>
        Add product
      </button>
    </div>
  );
}

describe("cart state", () => {
  beforeEach(() => {
    vi.mocked(fetchCart).mockResolvedValue(emptyCart);
    vi.mocked(addCartItem).mockResolvedValue(filledCart);
  });

  it("loads the cart and stores an added product", async () => {
    const user = userEvent.setup();
    render(
      <AuthContext.Provider value={authState()}>
        <CartProvider>
          <Probe />
        </CartProvider>
      </AuthContext.Provider>,
    );
    expect(await screen.findByText("0 items")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add product" }));
    expect(await screen.findByText("1 items")).toBeInTheDocument();
    expect(addCartItem).toHaveBeenCalledWith("product-1");
  });
});
