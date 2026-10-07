import { SITE } from "@/constants/site";

export type PageSeo = {
  title: string;
  description: string;
};

export const PAGE_SEO: Record<string, PageSeo> = {
  "/": {
    title: "Aurexion Digital",
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
    description: "Courses, workshops, and training from Aurexion Academy.",
  },
  "/academy/courses": {
    title: "Courses",
    description: "Aurexion Academy courses and their prices.",
  },
  "/about": {
    title: "About Us",
    description: `${SITE.name} works in technology, digital marketing, advertising, education, and business solutions.`,
  },
  "/contact": {
    title: "Contact Us",
    description: `Phone ${SITE.phone}, email ${SITE.email}, ${SITE.address}.`,
  },
  "/company": {
    title: "Company Information",
    description: `${SITE.name}. ${SITE.phone}. ${SITE.email}. ${SITE.address}.`,
  },
  "/privacy": {
    title: "Privacy Policy",
    description: "How Aurexion Digital Private Limited collects and uses contact, account, order, and website information.",
  },
  "/terms": {
    title: "Terms & Conditions",
    description: "Terms for using the website, requesting services, and buying products or courses.",
  },
  "/refunds": {
    title: "Refund & Cancellation Policy",
    description: "Refund and cancellation terms for digital products, services, and courses.",
  },
  "/shipping": {
    title: "Shipping & Delivery Policy",
    description: "How digital products, physical products, and services are delivered.",
  },
  "/disclaimer": {
    title: "Disclaimer",
    description: "Limits on website information, marketing results, advertising availability, and prices.",
  },
  "/data-security": {
    title: "Data Security",
    description: "How accounts, orders, and payment secrets are handled.",
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
  "/payment",
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
