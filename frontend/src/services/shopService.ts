import { api } from "@/api/client";
import { cachedPublic, publicQueryKey } from "@/api/publicCache";
import type { PageResult, Product } from "@/types/catalog";

const CART_TOKEN = "aurexion.cart";

export type CartItem = {
  id: string;
  item_type?: string;
  product_id: string | null;
  package_id?: string | null;
  slug: string;
  name: string;
  quantity: number;
  unit_price: string;
  currency: string;
  line_total: string;
  is_downloadable: boolean;
};

export type Cart = {
  id: string;
  guest_token: string | null;
  currency: string;
  subtotal: string;
  items: CartItem[];
};

export type PaymentSession = {
  enabled: boolean;
  provider: string | null;
  publishable_key: string | null;
  currency: string;
  status: string;
  reference: string | null;
};

export type CheckoutResult = {
  order_id: string;
  order_number: string;
  status: string;
  currency: string;
  total: string;
  placed_at: string;
  email_sent: boolean;
  payment: PaymentSession;
};

export type CheckoutAddress = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

export type CheckoutDetails = {
  name: string;
  email: string;
  phone: string;
  shipping: CheckoutAddress;
  billing: CheckoutAddress | null;
  billing_same_as_shipping: boolean;
};

export type ShopCategory = {
  id: string;
  slug: string;
  name: string;
};

export type DownloadFlag = {
  order_item_id: string;
  name: string;
  available: boolean;
};

export function readCartToken(): string | null {
  return localStorage.getItem(CART_TOKEN);
}

export function saveCartToken(token: string | null) {
  if (token) {
    localStorage.setItem(CART_TOKEN, token);
  }
}

function cartHeaders() {
  const token = readCartToken();
  return token ? { "X-Cart-Token": token } : {};
}

function remember(cart: Cart): Cart {
  saveCartToken(cart.guest_token);
  return cart;
}

export async function fetchCart(): Promise<Cart> {
  const response = await api.get<Cart>("/cart", { headers: cartHeaders() });
  return remember(response.data);
}

export async function addCartItem(productId: string, quantity = 1): Promise<Cart> {
  const response = await api.post<Cart>("/cart/items", { product_id: productId, quantity }, { headers: cartHeaders() });
  return remember(response.data);
}

export async function addCartPackage(packageId: string, quantity = 1): Promise<Cart> {
  const response = await api.post<Cart>("/cart/items", { package_id: packageId, quantity }, { headers: cartHeaders() });
  return remember(response.data);
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  const response = await api.patch<Cart>(`/cart/items/${itemId}`, { quantity }, { headers: cartHeaders() });
  return remember(response.data);
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const response = await api.delete<Cart>(`/cart/items/${itemId}`, { headers: cartHeaders() });
  return remember(response.data);
}

export async function claimCart(): Promise<Cart> {
  const response = await api.post<Cart>("/cart/claim", null, { headers: cartHeaders() });
  return remember(response.data);
}

export type OrderDetail = {
  id: string;
  order_number: string;
  status: string;
  currency: string;
  total: string;
  placed_at: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  ship_line1?: string | null;
  ship_city?: string | null;
  ship_state?: string | null;
  ship_postal_code?: string | null;
  ship_country?: string | null;
  items?: { id: string; name_snapshot: string; quantity: number; line_total: string }[];
};

export async function getOrder(orderId: string): Promise<OrderDetail> {
  const response = await api.get<OrderDetail>(`/orders/${orderId}`);
  return response.data;
}

export async function checkout(details: CheckoutDetails): Promise<CheckoutResult> {
  const response = await api.post<CheckoutResult>("/checkout", details);
  return response.data;
}

export async function listShopCategories(): Promise<ShopCategory[]> {
  return cachedPublic("shop-categories", async () => {
    const response = await api.get<PageResult<ShopCategory>>("/categories", {
      params: { kind: "product", page: 1, page_size: 50, sort: "sort_order" },
    });
    return response.data.items;
  });
}

export async function listShopProducts(params: Record<string, string | undefined>): Promise<PageResult<Product>> {
  return cachedPublic(publicQueryKey("/products", { page: "1", page_size: "50", for_shop: "true", ...params }), async () => {
    const response = await api.get<PageResult<Product>>("/products", {
      params: { page: 1, page_size: 50, for_shop: true, ...params },
    });
    return response.data;
  });
}

export async function listOrderDownloads(orderId: string): Promise<DownloadFlag[]> {
  const response = await api.get<DownloadFlag[]>(`/orders/${orderId}/downloads`);
  return response.data;
}

export async function downloadOrderItem(orderId: string, itemId: string): Promise<void> {
  const response = await api.get<Blob>(`/orders/${orderId}/items/${itemId}/download`, { responseType: "blob" });
  const blob = response.data;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "download";
  link.click();
  URL.revokeObjectURL(url);
}
