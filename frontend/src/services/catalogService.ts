import axios from "axios";

import { api } from "@/api/client";
import { cachedPublic, publicQueryKey } from "@/api/publicCache";
import type { Course, OrderSummary, PageResult, Product, Service, Testimonial } from "@/types/catalog";

type Query = Record<string, string | undefined>;

async function listAll<T>(path: string, params: Query = {}): Promise<{ items: T[]; total: number }> {
  return cachedPublic(publicQueryKey(path, { page_size: "50", ...params }), () => loadAll<T>(path, params));
}

async function loadAll<T>(path: string, params: Query = {}): Promise<{ items: T[]; total: number }> {
  const first = await api.get<PageResult<T>>(path, {
    params: { page: 1, page_size: 50, ...params },
  });
  const items = [...first.data.items];
  const pageCount = Math.ceil(first.data.total / first.data.page_size);
  for (let page = 2; page <= pageCount && page <= 5; page += 1) {
    const next = await api.get<PageResult<T>>(path, {
      params: { page, page_size: first.data.page_size, ...params },
    });
    items.push(...next.data.items);
  }
  return { items, total: first.data.total };
}

function listPage<T>(path: string, params: Query = {}): Promise<PageResult<T>> {
  const query = { page: "1", page_size: "6", sort: "sort_order", ...params };
  return cachedPublic(publicQueryKey(path, query), () =>
    api
      .get<PageResult<T>>(path, {
        params: { page: 1, page_size: 6, sort: "sort_order", ...params },
      })
      .then((response) => response.data),
  );
}

export function listFeaturedServices() {
  return listPage<Service>("/services");
}

export function listFeaturedProducts(listingChannel: "technology" | "shop" | "both") {
  return listPage<Product>("/products", { listing_channel: listingChannel });
}

export function listFeaturedCourses() {
  return listPage<Course>("/courses");
}

export function listTestimonials() {
  return listPage<Testimonial>("/testimonials");
}

export function listServices(params: Query = {}) {
  return listAll<Service>("/services", params);
}

export async function getProduct(slug: string): Promise<Product | null> {
  return cachedPublic(`product:${slug}`, async () => {
    try {
      const response = await api.get<Product>(`/products/${encodeURIComponent(slug)}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  });
}

export async function getService(slug: string): Promise<Service | null> {
  return cachedPublic(`service:${slug}`, async () => {
    try {
      const response = await api.get<Service>(`/services/${encodeURIComponent(slug)}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  });
}

export function listProducts(params: Query = {}) {
  return listAll<Product>("/products", params);
}

export function listCourses(params: Query = {}) {
  return listAll<Course>("/courses", params);
}

export async function listOrders(): Promise<OrderSummary[]> {
  const result = await listAll<OrderSummary>("/orders", { sort: "-placed_at" });
  return result.items;
}
