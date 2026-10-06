import { Link } from "react-router-dom";

import { Card } from "@/components/ui/Card";
import { ContentImage } from "@/components/ui/ContentImage";
import { formatMoney } from "@/utils/format";

type CourseCardProps = {
  title: string;
  summary?: string | null;
  level?: string | null;
  duration?: string | null;
  priceAmount?: string | null;
  currency?: string;
  thumbnailUrl?: string | null;
  href?: string;
};

export function CourseCard({ title, summary, level, duration, priceAmount, currency = "INR", thumbnailUrl, href }: CourseCardProps) {
  const price = formatMoney(priceAmount, currency);
  const meta = [level, duration].filter(Boolean).join(" · ");

  return (
    <Card interactive className="flex h-full flex-col">
      {thumbnailUrl ? (
        <ContentImage src={thumbnailUrl} alt="" className="mb-5 aspect-video w-full rounded-md object-cover" />
      ) : (
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">No thumbnail</p>
      )}
      {meta ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-champagne-deep">{meta}</p> : null}
      <h3 className={`font-display text-3xl leading-tight ${meta ? "mt-3" : ""}`}>{title}</h3>
      {summary ? <p className="mt-3 text-sm leading-6 text-ink/75">{summary}</p> : null}
      {price ? <p className="mt-6 text-sm font-semibold text-ink">{price}</p> : <p className="mt-6 text-sm text-ink/60">Price is not published</p>}
      {href ? (
        <Link to={href} className="mt-auto inline-flex min-h-11 items-center pt-6 text-sm font-semibold text-champagne-deep hover:text-night">
          View course
        </Link>
      ) : null}
    </Card>
  );
}
