import { Card } from "@/components/ui/Card";
import { formatBilling, formatMoney } from "@/utils/format";

type PackageCardProps = {
  name: string;
  summary?: string | null;
  priceAmount?: string | null;
  currency?: string;
  billingPeriod?: string | null;
  pricePrefix?: string;
  features?: readonly string[];
};

export function PackageCard({
  name,
  summary,
  priceAmount,
  currency = "INR",
  billingPeriod,
  pricePrefix,
  features = [],
}: PackageCardProps) {
  const price = formatMoney(priceAmount, currency);
  const billing = formatBilling(billingPeriod);

  return (
    <Card className="flex h-full flex-col">
      <h3 className="text-xl font-semibold leading-snug">{name}</h3>
      {summary ? <p className="mt-3 text-sm leading-6 text-ink/75">{summary}</p> : null}
      {features.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-ink/75">
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      ) : null}
      {price ? (
        <p className="mt-6 text-sm font-semibold text-ink">
          {pricePrefix ? <span className="font-normal text-ink/60">{pricePrefix} </span> : null}
          {price}
          {billing ? <span className="font-normal text-ink/60"> · {billing}</span> : null}
        </p>
      ) : (
        <p className="mt-6 text-sm text-ink/60">Starting price is confirmed when you enquire.</p>
      )}
    </Card>
  );
}
