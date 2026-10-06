export const CAMPAIGN_CHANNELS = [
  "Meta Ads",
  "Instagram",
  "YouTube",
  "Google Ads",
  "Influencer Marketing",
  "Billboard",
  "Bus Advertising",
  "Flex/Boards",
  "Event/Hall Advertising",
  "Content Creation",
  "Lead Generation",
  "SEO",
  "Social Media Marketing",
  "Creative Services",
] as const;

export type CampaignChannel = (typeof CAMPAIGN_CHANNELS)[number];
