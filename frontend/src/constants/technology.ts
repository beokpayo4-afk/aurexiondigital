export const TECHNOLOGY_TRACKS = [
  { slug: "software", title: "Software", productType: "software" },
  { slug: "saas", title: "SaaS", productType: "saas" },
  { slug: "web-development", title: "Web Development", productType: null },
  { slug: "app-development", title: "App Development", productType: null },
  { slug: "business-automation", title: "Business Automation", productType: null },
  { slug: "digital-products", title: "Digital Products", productType: "digital" },
] as const;

export type TechnologyTrack = (typeof TECHNOLOGY_TRACKS)[number];

export function technologyTrack(slug: string | undefined): TechnologyTrack | null {
  return TECHNOLOGY_TRACKS.find((item) => item.slug === slug) ?? null;
}
