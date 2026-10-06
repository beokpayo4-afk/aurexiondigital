const BILLING: Record<string, string> = {
  one_time: "One time",
  monthly: "Monthly",
  yearly: "Yearly",
  custom: "Custom",
};

const PRODUCT_TYPES: Record<string, string> = {
  software: "Software",
  saas: "Software as a service",
  digital: "Digital product",
  ecommerce: "E-commerce",
};

export function formatMoney(amount: string | null | undefined, currency: string): string | null {
  if (amount === null || amount === undefined || amount === "") {
    return null;
  }
  const value = Number(amount);
  if (Number.isNaN(value)) {
    return null;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatBilling(period: string | null | undefined): string | null {
  if (!period) {
    return null;
  }
  return BILLING[period] ?? period;
}

export function formatProductType(value: string): string {
  return PRODUCT_TYPES[value] ?? value;
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
