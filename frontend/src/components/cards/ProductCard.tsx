import { Link } from "react-router-dom";

import { Card } from "@/components/ui/Card";
import { formatBilling, formatMoney, formatProductType } from "@/utils/format";

type ProductCardProps = {
  name: string;
  summary?: string | null;
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

export function ProductCard({ name, summary, productType, amount, currency = "INR", billingPeriod, href, imageUrl, imageAlt, onAdd, onBuy }: ProductCardProps) {
  const price = formatMoney(amount, currency);
  const billing = formatBilling(billingPeriod);

  return (
    <Card interactive className="flex h-full flex-col">
      {imageUrl ? <img src={imageUrl} alt={imageAlt || name} className="mb-4 aspect-[3/2] w-full rounded-md object-cover" /> : null}
      <p className="text-sm text-champagne-deep">{formatProductType(productType)}</p>
      <h3 className="mt-2 text-xl font-semibold leading-snug">{name}</h3>
      {summary ? <p className="mt-3 text-sm leading-6 text-ink/75">{summary}</p> : null}
      {price ? (
        <p className="mt-6 text-sm font-semibold text-ink">
          {price}
          {billing ? <span className="font-normal text-ink/60"> · {billing}</span> : null}
        </p>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center gap-4 pt-6">
        {href ? (
          <Link to={href} className="inline-flex min-h-11 items-center text-sm font-semibold text-champagne-deep hover:text-night">
            View product
          </Link>
        ) : null}
        {onAdd ? (
          <button type="button" className="min-h-11 text-sm font-semibold text-ink" onClick={onAdd}>
            Add to cart
          </button>
        ) : null}
        {onBuy ? (
          <button type="button" className="min-h-11 rounded-md bg-night px-4 text-sm font-semibold text-white" onClick={onBuy}>
            Buy now
          </button>
        ) : null}
      </div>
    </Card>
  );
}
