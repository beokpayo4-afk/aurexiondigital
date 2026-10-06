import { Link } from "react-router-dom";

import { Card } from "@/components/ui/Card";
import { formatBilling, formatMoney, formatProductType } from "@/utils/format";

type CatalogFeature = {
  id?: string;
  label: string;
  value?: string | null;
};

type ProductCardProps = {
  name: string;
  summary?: string | null;
  description?: string | null;
  features?: readonly CatalogFeature[];
  productType: string;
  amount?: string | null;
  currency?: string;
  billingPeriod?: string | null;
  href?: string;
  imageUrl?: string | null;
  imageAlt?: string;
  onAdd?: () => void;
  onBuy?: () => void;
};

export function ProductCard({
  name,
  summary,
  description,
  features = [],
  productType,
  amount,
  currency = "INR",
  billingPeriod,
  href,
  imageUrl,
  imageAlt,
  onAdd,
  onBuy,
}: ProductCardProps) {
  const price = formatMoney(amount, currency);
  const billing = formatBilling(billingPeriod);
  const included = features.filter((feature) => feature.label !== "Perfect for");
  const audience = features.find((feature) => feature.label === "Perfect for")?.value;
  const cta = `Get ${name}`;

  return (
    <Card interactive className="flex h-full flex-col">
      {imageUrl ? <img src={imageUrl} alt={imageAlt || name} className="mb-4 aspect-[3/2] w-full rounded-md object-cover" /> : null}
      <p className="text-sm text-champagne-deep">{formatProductType(productType)}</p>
      <h3 className="mt-2 text-xl font-semibold leading-snug">{name}</h3>
      {summary ? <p className="mt-3 text-sm font-medium leading-6 text-night">{summary}</p> : null}
      {description ? <p className="mt-3 text-sm leading-6 text-ink/75">{description}</p> : null}
      {included.length > 0 ? (
        <ul className="mt-4 space-y-1 text-sm leading-6 text-ink/75">
          {included.map((feature) => (
            <li key={feature.id ?? feature.label}>{feature.label}</li>
          ))}
        </ul>
      ) : null}
      {audience ? <p className="mt-4 text-sm leading-6 text-ink/70">Perfect for: {audience}</p> : null}
      {price ? (
        <p className="mt-6 text-sm font-semibold text-ink">
          {price}
          {billing ? <span className="font-normal text-ink/60"> · {billing}</span> : null}
        </p>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center gap-4 pt-6">
        {onBuy ? (
          <button type="button" className="min-h-11 rounded-md bg-night px-4 text-sm font-semibold text-white" onClick={onBuy}>
            {cta}
          </button>
        ) : href ? (
          <Link to={href} className="inline-flex min-h-11 items-center rounded-md bg-night px-4 text-sm font-semibold text-white">
            {cta}
          </Link>
        ) : null}
        {onAdd ? (
          <button type="button" className="min-h-11 text-sm font-semibold text-ink" onClick={onAdd}>
            Add to cart
          </button>
        ) : null}
        {onBuy && href ? (
          <Link to={href} className="inline-flex min-h-11 items-center text-sm font-semibold text-champagne-deep hover:text-night">
            Details
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
