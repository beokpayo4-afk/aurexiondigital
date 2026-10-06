import type { JsonObject } from "@/seo/structuredData";

export function JsonLd({ data }: { data: JsonObject }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
