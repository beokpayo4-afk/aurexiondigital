export type PageResult<T> = {
  items: T[];
  page: number;
  page_size: number;
  total: number;
};

export type PackageFeature = {
  id: string;
  label: string;
  sort_order: number;
};

export type ServicePackage = {
  id: string;
  service_id: string;
  slug: string;
  name: string;
  summary: string | null;
  price_amount: string | null;
  currency: string;
  billing_period: string | null;
  features?: PackageFeature[];
};

export type Service = {
  id: string;
  business_area: string;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  packages: ServicePackage[];
};

export type ProductPrice = {
  id: string;
  amount: string;
  currency: string;
  billing_period: string | null;
  is_active: boolean;
};

export type ProductFeature = {
  id: string;
  label: string;
  value: string | null;
  sort_order: number;
};

export type ProductImage = {
  id: string;
  file_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
};

export type Product = {
  id: string;
  business_area: string;
  slug: string;
  name: string;
  summary: string | null;
  description?: string | null;
  product_type: string;
  is_downloadable?: boolean;
  listing_channel: string;
  demo_url?: string | null;
  features?: ProductFeature[];
  images?: ProductImage[];
  prices: ProductPrice[];
};

export type Course = {
  id: string;
  business_area: string;
  slug: string;
  title: string;
  summary: string | null;
  description?: string | null;
  level: string | null;
  duration_label: string | null;
  thumbnail_url?: string | null;
  learning_outcomes?: string[];
  certificate_enabled?: boolean;
  price_amount: string | null;
  currency: string;
};

export type Testimonial = {
  id: string;
  author_name: string;
  author_role: string | null;
  body: string;
  rating: number | null;
  business_area: string | null;
};

export type OrderSummary = {
  id: string;
  order_number: string;
  status: string;
  currency: string;
  total: string;
  placed_at: string;
};
