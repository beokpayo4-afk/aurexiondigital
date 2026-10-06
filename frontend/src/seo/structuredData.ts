import { SITE } from "@/constants/site";

export type JsonObject = Record<string, unknown>;

export function organizationData(origin: string): JsonObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: origin,
    description: SITE.description,
    telephone: "+919153940559",
    email: SITE.email,
    logo: `${origin}/favicon.jpg`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Flat No. S2, Plot 129, E6-A, Rera Colony, Nr Sai Board, Bagroda",
      addressLocality: "Bhopal",
      postalCode: "462026",
      addressRegion: "Madhya Pradesh",
      addressCountry: "IN",
    },
  };
}

export function websiteData(origin: string): JsonObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.shortName,
    url: origin,
    description: SITE.description,
    publisher: {
      "@type": "Organization",
      name: SITE.name,
    },
  };
}

export function breadcrumbData(origin: string, items: { name: string; path?: string }[]): JsonObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: `${origin}${item.path}` } : {}),
    })),
  };
}

export function serviceData(origin: string, service: { name: string; slug: string; summary?: string | null }): JsonObject {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    url: `${origin}/solutions/${service.slug}`,
    ...(service.summary ? { description: service.summary } : {}),
    provider: {
      "@type": "Organization",
      name: SITE.name,
    },
  };
}

export function productData(
  origin: string,
  product: {
    name: string;
    path: string;
    summary?: string | null;
    description?: string | null;
    image?: string | null;
    price?: string | null;
    currency?: string | null;
  },
): JsonObject {
  const description = product.description || product.summary;
  const data: JsonObject = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: `${origin}${product.path}`,
    brand: {
      "@type": "Brand",
      name: SITE.shortName,
    },
  };
  if (description) {
    data.description = description;
  }
  if (product.image) {
    data.image = product.image.startsWith("http") ? product.image : `${origin}${product.image}`;
  }
  if (product.price && product.currency) {
    data.offers = {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      url: `${origin}${product.path}`,
    };
  }
  return data;
}

export function courseData(
  origin: string,
  course: {
    title: string;
    slug: string;
    summary?: string | null;
    description?: string | null;
    image?: string | null;
    price?: string | null;
    currency?: string | null;
  },
): JsonObject {
  const description = course.description || course.summary;
  const data: JsonObject = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    url: `${origin}/academy/course/${course.slug}`,
    provider: {
      "@type": "Organization",
      name: SITE.name,
    },
  };
  if (description) {
    data.description = description;
  }
  if (course.image) {
    data.image = course.image.startsWith("http") ? course.image : `${origin}${course.image}`;
  }
  if (course.price && course.currency) {
    data.offers = {
      "@type": "Offer",
      price: course.price,
      priceCurrency: course.currency,
      url: `${origin}/academy/course/${course.slug}`,
    };
  }
  return data;
}

export function faqData(items: { question: string; answer: string }[]): JsonObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
