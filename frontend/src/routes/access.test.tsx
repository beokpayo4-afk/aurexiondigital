import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { AppRoutes } from "@/routes/AppRoutes";
import { currentUser } from "@/services/authService";
import { lookupSeo } from "@/services/contentService";
import { claimCart, fetchCart } from "@/services/shopService";
import { testUser } from "@/test/auth";

vi.mock("@/services/authService", () => ({
  currentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  registerAccount: vi.fn(),
}));

vi.mock("@/services/contentService", async () => {
  const actual = await vi.importActual<typeof import("@/services/contentService")>("@/services/contentService");
  return { ...actual, lookupSeo: vi.fn() };
});

vi.mock("@/services/shopService", () => ({
  fetchCart: vi.fn(),
  claimCart: vi.fn(),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
}));

vi.mock("@/api/client", () => ({
  api: {
    get: vi.fn(async () => ({
      data: {
        customers: 1,
        students: 0,
        products: 2,
        courses: 3,
        orders: 4,
        enquiries: 5,
        quote_requests: 6,
        revenue: "0.00",
        revenue_currency: "INR",
        orders_by_status: [],
        quotes_by_status: [],
        enquiries_by_status: [],
      },
    })),
  },
  readAccessToken: () => "token",
  saveTokens: vi.fn(),
  clearTokens: vi.fn(),
}));

vi.mock("@/services/catalogService", () => ({
  listOrders: vi.fn(async () => []),
}));

const emptyCart = {
  id: "cart-1",
  guest_token: null,
  currency: "INR",
  subtotal: "0.00",
  items: [],
};

function renderPath(path: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("application routes", () => {
  beforeEach(() => {
    vi.mocked(lookupSeo).mockResolvedValue(null);
    vi.mocked(fetchCart).mockResolvedValue(emptyCart);
    vi.mocked(claimCart).mockResolvedValue(emptyCart);
  });

  it("keeps a quote link on the custom quote page", async () => {
    vi.mocked(currentUser).mockResolvedValue(null);
    renderPath("/quote?source=home");
    expect(await screen.findByRole("heading", { name: "Build Your Own Marketing Campaign." })).toBeInTheDocument();
  });

  it("opens the sign-in page for an anonymous admin visit", async () => {
    vi.mocked(currentUser).mockResolvedValue(null);
    renderPath("/admin");
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("opens the account page when a customer visits admin", async () => {
    vi.mocked(currentUser).mockResolvedValue(testUser(["CUSTOMER"]));
    renderPath("/admin");
    expect(await screen.findByRole("heading", { name: "Account" })).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  });

  it("opens the dashboard for staff", async () => {
    vi.mocked(currentUser).mockResolvedValue(testUser(["STAFF"], "Staff Member"));
    renderPath("/admin");
    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Signed in as Staff Member.")).toBeInTheDocument();
  });
});
