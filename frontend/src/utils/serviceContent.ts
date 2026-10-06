export type ServicePageContent = {
  introduction: string | null;
  included: string[];
  benefits: string[];
  process: { title: string; detail: string }[];
  faqs: { question: string; answer: string }[];
  managementFeeNote: string | null;
  track: string | null;
  why: string[];
};

const empty: ServicePageContent = {
  introduction: null,
  included: [],
  benefits: [],
  process: [],
  faqs: [],
  managementFeeNote: null,
  track: null,
  why: [],
};

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
    const process = Array.isArray(parsed.process)
      ? parsed.process.flatMap((item) => {
          if (!item || typeof item !== "object") {
            return [];
          }
          const row = item as Record<string, unknown>;
          if (typeof row.title !== "string" || typeof row.detail !== "string") {
            return [];
          }
          return [{ title: row.title, detail: row.detail }];
        })
      : [];
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
      benefits: asStrings(parsed.benefits),
      process,
      faqs,
      managementFeeNote: typeof parsed.management_fee_note === "string" ? parsed.management_fee_note : null,
      track: typeof parsed.track === "string" ? parsed.track : null,
      why: asStrings(parsed.why),
    };
  } catch {
    return { ...empty, introduction: description };
  }
}
