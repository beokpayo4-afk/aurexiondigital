import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ProductGrid } from "@/components/shop/ProductGrid";
import type { Product } from "@/types/catalog";

const product: Product = {
  id: "product-1",
  business_area: "technology-digital-products",
  slug: "starter-kit",
  name: "Starter kit",
  summary: "A downloadable kit.",
  product_type: "software",
  listing_channel: "shop",
  prices: [{ id: "price-1", amount: "499", currency: "INR", billing_period: null, is_active: true }],
};

describe("product listing", () => {
  it("lists a priced product and adds it to the cart", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProductGrid products={[product]} onAdd={onAdd} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Starter kit" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View product" })).toHaveAttribute("href", "/shop/product/starter-kit");
    await user.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(onAdd).toHaveBeenCalledWith(product);
  });

  it("does not offer an unpriced product for the cart", () => {
    render(
      <MemoryRouter>
        <ProductGrid products={[{ ...product, prices: [] }]} onAdd={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("button", { name: "Add to cart" })).not.toBeInTheDocument();
  });
});
