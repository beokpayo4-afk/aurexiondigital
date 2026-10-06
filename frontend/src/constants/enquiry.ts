export const CONTACT_INTERESTS = ["Marketing", "Technology", "Education", "Other"] as const;

export const CONTACT_CHANNELS = ["Online", "Offline", "Both"] as const;

export const ENQUIRY_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "in_progress", label: "In progress" },
  { value: "proposal_sent", label: "Proposal sent" },
  { value: "converted", label: "Converted" },
  { value: "closed", label: "Closed" },
] as const;
