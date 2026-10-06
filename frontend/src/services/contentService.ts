import { api } from "@/api/client";
import { cachedPublic } from "@/api/publicCache";

export type HomepageBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
};

export type FeaturedProduct = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  product_type: string;
  listing_channel: string;
  price_amount: string | null;
  currency: string | null;
  billing_period: string | null;
};

export type FeaturedCourse = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  level: string | null;
  duration_label: string | null;
  thumbnail_url: string | null;
  price_amount: string | null;
  currency: string;
};

export type HomepageContent = {
  banners: HomepageBanner[];
  featured_products: FeaturedProduct[];
  featured_courses: FeaturedCourse[];
};

export type SeoRecord = {
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  canonical_path: string | null;
  robots: string | null;
};

export type SocialLink = {
  id: string;
  platform: string;
  url: string;
};

export function getHomepage(): Promise<HomepageContent> {
  return cachedPublic("homepage", () => api.get<HomepageContent>("/homepage").then((response) => response.data));
}

export function lookupSeo(path: string): Promise<SeoRecord | null> {
  return cachedPublic(`seo:${path}`, () =>
    api
      .get<SeoRecord | null>("/seo-settings/lookup", { params: { path } })
      .then((response) => response.data)
      .catch(() => null),
  );
}

export function listPublicSocialLinks(): Promise<SocialLink[]> {
  return cachedPublic("social-links", () =>
    api
      .get<{ items: SocialLink[] }>("/social-links", { params: { page: 1, page_size: 20, sort: "sort_order" } })
      .then((response) => response.data.items)
      .catch(() => []),
  );
}
