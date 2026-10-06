import { SITE } from "@/constants/site";
import { cleanPath, robotsForPath } from "@/seo/pages";

export type DocumentSeo = {
  title: string;
  description: string;
  pathname: string;
  image?: string | null;
  type?: "website" | "article" | "product";
  robots?: string;
  canonicalPath?: string | null;
};

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function absoluteUrl(origin: string, value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return `${origin}${value.startsWith("/") ? value : `/${value}`}`;
}

export function applyDocumentSeo(seo: DocumentSeo): void {
  const origin = window.location.origin;
  const path = cleanPath(seo.canonicalPath || seo.pathname);
  const url = `${origin}${path === "/" ? "/" : path}`;
  const title = seo.title.includes(SITE.shortName) ? seo.title : `${seo.title} · ${SITE.shortName}`;
  const image = absoluteUrl(origin, seo.image || "/hero.jpg");
  const robots = seo.robots || robotsForPath(seo.pathname);

  document.title = title;
  upsertMeta("name", "description", seo.description);
  upsertMeta("name", "robots", robots);
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", seo.description);
  upsertMeta("property", "og:type", seo.type ?? "website");
  upsertMeta("property", "og:url", url);
  upsertMeta("property", "og:image", image);
  upsertMeta("property", "og:site_name", SITE.shortName);
  upsertMeta("property", "og:locale", "en_IN");
  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", seo.description);
  upsertMeta("name", "twitter:image", image);

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", url);
}

export function applySeoOverride(override: {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  canonicalPath?: string | null;
  robots?: string | null;
}): void {
  const origin = window.location.origin;
  if (override.title) {
    document.title = override.title;
    upsertMeta("property", "og:title", override.title);
    upsertMeta("name", "twitter:title", override.title);
  }
  if (override.description) {
    upsertMeta("name", "description", override.description);
    upsertMeta("property", "og:description", override.description);
    upsertMeta("name", "twitter:description", override.description);
  }
  if (override.image) {
    const image = absoluteUrl(origin, override.image);
    upsertMeta("property", "og:image", image);
    upsertMeta("name", "twitter:image", image);
  }
  if (override.robots) {
    upsertMeta("name", "robots", override.robots);
  }
  if (override.canonicalPath) {
    const href = absoluteUrl(origin, cleanPath(override.canonicalPath));
    upsertMeta("property", "og:url", href);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", href);
  }
}
