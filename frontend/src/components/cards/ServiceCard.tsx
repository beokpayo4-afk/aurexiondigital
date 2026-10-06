import { Link } from "react-router-dom";

import { Card } from "@/components/ui/Card";
import { areaTitle } from "@/constants/company";

type ServiceCardProps = {
  name: string;
  summary?: string | null;
  area: string;
  href?: string;
};

export function ServiceCard({ name, summary, area, href }: ServiceCardProps) {
  return (
    <Card interactive className="flex h-full flex-col">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-champagne-deep">{areaTitle(area)}</p>
      <h3 className="mt-3 font-display text-3xl leading-tight">{name}</h3>
      {summary ? <p className="mt-3 text-sm leading-6 text-ink/75">{summary}</p> : null}
      {href ? (
        <Link to={href} className="mt-auto inline-flex min-h-11 items-center pt-6 text-sm font-semibold text-champagne-deep hover:text-night">
          Request a quote
        </Link>
      ) : null}
    </Card>
  );
}
