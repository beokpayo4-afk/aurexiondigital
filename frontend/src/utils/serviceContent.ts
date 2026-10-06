export type ServicePageContent = {
  introduction: string | null;
  included: string[];
  offers: { title: string; detail: string }[];
  offersTitle: string | null;
  benefits: string[];
  why: string[];
  whyTitle: string | null;
  process: { title: string; detail: string }[];
  processTitle: string | null;
  audience: string[];
  audienceTitle: string | null;
  faqs: { question: string; answer: string }[];
  managementFeeNote: string | null;
  track: string | null;
  ctaTitle: string | null;
  ctaDescription: string | null;
  ctaLabel: string | null;
};

const empty: ServicePageContent = {
  introduction: null,
  included: [],
  offers: [],
  offersTitle: null,
  benefits: [],
  why: [],
  whyTitle: null,
  process: [],
  processTitle: null,
  audience: [],
  audienceTitle: null,
  faqs: [],
  managementFeeNote: null,
  track: null,
  ctaTitle: null,
  ctaDescription: null,
  ctaLabel: null,
};

function titledItems(value: unknown): { title: string; detail: string }[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }
    const row = item as Record<string, unknown>;
    if (typeof row.title !== "string" || typeof row.detail !== "string") {
      return [];
    }
    return [{ title: row.title, detail: row.detail }];
  });
}

function asStrings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function readServiceContent(description: string | null): ServicePageContent {
  if (!description) {
    return empty;
  }
  const trimmed = description.trim();
  if (!trimmed.startsWith("{")) {
    return { ...empty, introduction: description };
  }
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    const process = titledItems(parsed.process);
    const faqs = Array.isArray(parsed.faqs)
      ? parsed.faqs.flatMap((item) => {
          if (!item || typeof item !== "object") {
            return [];
          }
          const row = item as Record<string, unknown>;
          if (typeof row.question !== "string" || typeof row.answer !== "string") {
            return [];
          }
          return [{ question: row.question, answer: row.answer }];
        })
      : [];
    return {
      introduction: typeof parsed.introduction === "string" ? parsed.introduction : null,
      included: asStrings(parsed.included),
      offers: titledItems(parsed.offers),
      offersTitle: typeof parsed.offers_title === "string" ? parsed.offers_title : null,
      benefits: asStrings(parsed.benefits),
      why: asStrings(parsed.why),
      whyTitle: typeof parsed.why_title === "string" ? parsed.why_title : null,
      process,
      processTitle: typeof parsed.process_title === "string" ? parsed.process_title : null,
      audience: asStrings(parsed.audience),
      audienceTitle: typeof parsed.audience_title === "string" ? parsed.audience_title : null,
      faqs,
      managementFeeNote: typeof parsed.management_fee_note === "string" ? parsed.management_fee_note : null,
      track: typeof parsed.track === "string" ? parsed.track : null,
      ctaTitle: typeof parsed.cta_title === "string" ? parsed.cta_title : null,
      ctaDescription: typeof parsed.cta_description === "string" ? parsed.cta_description : null,
      ctaLabel: typeof parsed.cta_label === "string" ? parsed.cta_label : null,
    };
  } catch {
    return { ...empty, introduction: description };
  }
}
