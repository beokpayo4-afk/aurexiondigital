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

const SHARE_PHOTO = "/2022.webp";
const SHARE_FALLBACK = "/favicon.jpg";

function absoluteUrl(origin: string, value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return `${origin}${value.startsWith("/") ? value : `/${value}`}`;
}

let shareGeneration = 0;

function isShareFallback(path: string): boolean {
  return path === SHARE_FALLBACK;
}

function publishShareImage(origin: string, path: string) {
  const image = absoluteUrl(origin, path);
  upsertMeta("property", "og:image", image);
  upsertMeta("name", "twitter:image", image);
  upsertMeta("name", "twitter:card", isShareFallback(path) ? "summary" : "summary_large_image");
  return image;
}

function setShareImage(origin: string, path?: string | null) {
  const generation = ++shareGeneration;
  const preferred = path || SHARE_PHOTO;
  const image = publishShareImage(origin, preferred);
  if (isShareFallback(preferred)) {
    return;
  }
  const probe = new Image();
  probe.onerror = () => {
    const current = document.head.querySelector('meta[property="og:image"]')?.getAttribute("content");
    if (generation === shareGeneration && current === image) {
      publishShareImage(origin, SHARE_FALLBACK);
    }
  };
  probe.src = image;
}

export function applyDocumentSeo(seo: DocumentSeo): void {
  const origin = window.location.origin;
  const path = cleanPath(seo.canonicalPath || seo.pathname);
  const url = `${origin}${path === "/" ? "/" : path}`;
  const title = seo.title.includes(SITE.shortName) ? seo.title : `${seo.title} · ${SITE.shortName}`;
  const robots = seo.robots || robotsForPath(seo.pathname);

  document.title = title;
  upsertMeta("name", "description", seo.description);
  upsertMeta("name", "robots", robots);
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", seo.description);
  upsertMeta("property", "og:type", seo.type ?? "website");
  upsertMeta("property", "og:url", url);
  setShareImage(origin, seo.image);
  upsertMeta("property", "og:site_name", SITE.shortName);
  upsertMeta("property", "og:locale", "en_IN");
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", seo.description);

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
    setShareImage(origin, override.image);
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
