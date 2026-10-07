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

export const SERVICE_SCOPE = [
  {
    title: "Digital Marketing",
    to: "/solutions/digital-marketing",
    items: ["Social Media Marketing", "Search Engine Optimization", "Search Engine Marketing", "Performance Marketing", "Campaign Management"],
  },
  {
    title: "Online Advertising",
    to: "/solutions/digital-marketing",
    items: ["Google Ads", "Meta Ads", "Display Advertising", "Search Advertising", "Video Advertising"],
  },
  {
    title: "Offline Advertising",
    to: "/solutions/offline-advertising",
    items: ["Outdoor Advertising", "Print Advertising", "Promotional Campaigns", "Local Advertising"],
  },
  {
    title: "Influencer & Creator Marketing",
    to: "/solutions/influencer-marketing",
    items: ["Influencer Campaigns", "Creator Collaborations", "Campaign Management"],
  },
  {
    title: "Creative & Content Services",
    to: "/solutions/creative-content",
    items: ["Graphic Design", "Social Media Creatives", "Video Content", "Branding Content", "Marketing Content"],
  },
  {
    title: "Lead Generation",
    to: "/solutions/lead-generation",
    items: ["Lead Generation Campaigns", "Landing Pages", "Conversion Campaigns", "Business Lead Solutions"],
  },
  {
    title: "Business Consulting",
    to: "/solutions/business-consulting",
    items: ["Business Strategy", "Marketing Consulting", "Digital Transformation", "Growth Planning"],
  },
  {
    title: "Trade & Business Support",
    to: "/solutions/trade-business-support",
    items: ["Business Facilitation", "Vendor/Business Support", "Trade Support"],
  },
  {
    title: "Outsourcing",
    to: "/solutions/outsourcing",
    items: ["Business Process Support", "Marketing Support", "Technology Support", "Operational Support"],
  },
] as const;

export type SolutionSlug = (typeof SOLUTIONS)[number]["slug"];

export function solutionBySlug(slug: string | undefined) {
  return SOLUTIONS.find((item) => item.slug === slug) ?? null;
}
