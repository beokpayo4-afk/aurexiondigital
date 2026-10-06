import { Link } from "react-router-dom";

import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbData } from "@/seo/structuredData";

export type Crumb = {
  label: string;
  to?: string;
};

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const origin = window.location.origin;
  return (
    <>
      <JsonLd data={breadcrumbData(origin, items.map((item) => ({ name: item.label, path: item.to })))} />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-night/70">
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {item.to && index < items.length - 1 ? (
                <Link to={item.to} className="text-champagne-deep hover:text-night">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={index === items.length - 1 ? "page" : undefined}>{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
