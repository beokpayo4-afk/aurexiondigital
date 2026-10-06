import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext } from "@/context/auth-context";
import { CartProvider } from "@/context/CartContext";
import { CartPage } from "@/pages/CartPage";
import { claimCart, fetchCart, type Cart } from "@/services/shopService";
import { authState, testUser } from "@/test/auth";

vi.mock("@/services/shopService", () => ({
  fetchCart: vi.fn(),
  claimCart: vi.fn(),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
}));

const cart: Cart = {
  id: "cart-1",
  guest_token: null,
  currency: "INR",
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

function renderCart(state = authState()) {
  return render(
    <AuthContext.Provider value={state}>
      <MemoryRouter>
        <CartProvider>
          <CartPage />
        </CartProvider>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("cart page", () => {
  beforeEach(() => {
    vi.mocked(fetchCart).mockResolvedValue(cart);
    vi.mocked(claimCart).mockResolvedValue(cart);
  });

  it("asks a visitor to sign in before checkout", async () => {
    renderCart();
    expect(await screen.findByText("Starter kit")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in to checkout" })).toHaveAttribute("href", "/login");
  });

  it("offers checkout to a signed-in customer", async () => {
    renderCart(authState({ user: testUser(["CUSTOMER"]) }));
    expect(await screen.findByRole("link", { name: "Checkout" })).toHaveAttribute("href", "/checkout");
  });
});
