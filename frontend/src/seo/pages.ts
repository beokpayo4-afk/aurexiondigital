import { SITE } from "@/constants/site";

export type PageSeo = {
  title: string;
  description: string;
};

export const PAGE_SEO: Record<string, PageSeo> = {
  "/": {
    title: "Technology. Marketing. Growth.",
    description: SITE.description,
  },
  "/solutions": {
    title: "Solutions",
    description: "Digital marketing, advertising, creative work, lead generation, consulting, trade support, and outsourcing.",
  },
  "/technology": {
    title: "Technology",
    description: "Software, SaaS, websites, applications, automation, and digital products.",
  },
  "/shop": {
    title: "Shop",
    description: "Digital products, software, SaaS tools, and business resources.",
  },
  "/academy": {
    title: "Academy",
    description: "Published Aurexion Academy courses.",
  },
  "/academy/courses": {
    title: "Courses",
    description: "Published Aurexion Academy courses and prices.",
  },
  "/about": {
    title: "About Us",
    description: `${SITE.name}. ${SITE.positioning}. The registered office is in the State of Madhya Pradesh.`,
  },
  "/contact": {
    title: "Contact",
    description: "Send a message to Aurexion Digital.",
  },
  "/custom-quote": {
    title: "Custom Quote",
    description: "Build a marketing campaign and request a quote.",
  },
};

const PRIVATE_PREFIXES = [
  "/admin",
  "/account",
  "/orders",
  "/checkout",
  "/cart",
  "/learn",
  "/login",
  "/register",
  "/order-success",
  "/academy/login",
  "/academy/register",
  "/academy/dashboard",
];

export function cleanPath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname || "/";
}

export function isPrivatePath(pathname: string): boolean {
  const path = cleanPath(pathname);
  if (path.endsWith("/learn")) {
    return true;
  }
  return PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function robotsForPath(pathname: string): string {
  return isPrivatePath(pathname) ? "noindex, nofollow" : "index, follow";
}

export function defaultDescription(pathname: string): string {
  return PAGE_SEO[cleanPath(pathname)]?.description ?? SITE.description;
}
