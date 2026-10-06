import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Navbar } from "@/components/layout/Navbar";
import { AuthContext } from "@/context/auth-context";
import { CartProvider } from "@/context/CartContext";
import { fetchCart, type Cart } from "@/services/shopService";
import { authState } from "@/test/auth";

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
      quantity: 2,
      unit_price: "499.00",
      currency: "INR",
      line_total: "998.00",
      is_downloadable: false,
    },
  ],
};

describe("responsive navigation", () => {
  beforeEach(() => {
    vi.mocked(fetchCart).mockResolvedValue(cart);
  });

  it("keeps the primary links in the desktop nav and opens them from the menu button", async () => {
    const user = userEvent.setup();
    render(
      <AuthContext.Provider value={authState()}>
        <MemoryRouter>
          <CartProvider>
            <Navbar />
          </CartProvider>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    const desktop = screen.getByRole("navigation", { name: "Primary" });
    expect(desktop.className).toContain("hidden");
    expect(desktop.className).toContain("xl:flex");
    expect(screen.getByRole("button", { name: "Menu" }).className).toContain("xl:hidden");

    await user.click(screen.getByRole("button", { name: "Menu" }));
    const mobile = await screen.findByRole("navigation", { name: "Mobile" });
    expect(mobile).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Shop" }).length).toBeGreaterThan(1);
    expect(screen.getAllByRole("button", { name: "Cart (2)" }).length).toBeGreaterThan(0);
  });
});
