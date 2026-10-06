export const PRICING_DISCLAIMER =
  "Package prices are starting prices and may vary depending on campaign requirements, advertising inventory, location, duration, media platform, creator/influencer fees and production requirements. Final pricing will be confirmed after campaign consultation.";

export const SOLUTIONS = [
  { slug: "digital-marketing", title: "Digital Marketing" },
  { slug: "offline-advertising", title: "Offline Advertising" },
  { slug: "influencer-marketing", title: "Influencer Marketing" },
  { slug: "creative-content", title: "Creative & Content" },
  { slug: "lead-generation", title: "Lead Generation" },
  { slug: "business-consulting", title: "Business Consulting" },
  { slug: "trade-business-support", title: "Trade & Business Support" },
  { slug: "outsourcing", title: "Outsourcing" },
] as const;

export type SolutionSlug = (typeof SOLUTIONS)[number]["slug"];

export function solutionBySlug(slug: string | undefined) {
  return SOLUTIONS.find((item) => item.slug === slug) ?? null;
}
