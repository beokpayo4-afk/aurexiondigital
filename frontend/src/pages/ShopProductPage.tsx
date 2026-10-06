import { Link, useParams } from "react-router-dom";

import { PageIntro } from "@/components/layout/PageIntro";
import { JsonLd } from "@/components/seo/JsonLd";
import { ContentImage } from "@/components/ui/ContentImage";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useCart } from "@/context/useCart";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getProduct } from "@/services/catalogService";
import { productData } from "@/seo/structuredData";
import { formatBilling, formatMoney } from "@/utils/format";

export function ShopProductPage() {
  const { slug = "" } = useParams();
  const { add } = useCart();
  const product = useAsyncData(() => getProduct(slug), [slug]);
  const record = product.data;
  const shopListed = record && (record.listing_channel === "shop" || record.listing_channel === "both");
  usePageTitle(record?.name ?? "Product", record?.summary || undefined);
  const price = record?.prices.find((item) => item.is_active) ?? record?.prices[0];

  if (product.loading) {
    return (
      <Container className="py-20">
        <LoadingState label="Loading product" />
      </Container>
    );
  }
  if (product.error) {
    return (
      <Container className="py-20">
        <ErrorState message={product.error} onRetry={product.reload} />
      </Container>
    );
  }
  if (!record || !shopListed) {
    return (
      <Container className="py-20">
        <EmptyState
          title="This product is not in the shop"
          description="It appears here when it is published on the shop channel."
          action={
            <Button to="/shop" tone="light">
              Back to shop
            </Button>
          }
        />
      </Container>
    );
  }

  return (
    <>
      <JsonLd
        data={productData(window.location.origin, {
          name: record.name,
          path: `/shop/product/${record.slug}`,
          summary: record.summary,
          description: record.description,
          image: record.images?.[0]?.file_url,
          price: price?.amount,
          currency: price?.currency,
        })}
      />
      <PageIntro
        eyebrow="Shop"
        title={record.name}
        description={record.summary ?? record.name}
        crumbs={[
          { label: "Home", to: "/" },
          { label: "Shop", to: "/shop" },
          { label: record.name },
        ]}
      />
      <section className="bg-paper">
        <Container className="grid gap-10 py-16 lg:grid-cols-[1fr_0.8fr]">
          <div>
            {record.images?.[0] ? (
              <ContentImage
                src={record.images[0].file_url}
                alt={record.images[0].alt_text?.trim() || record.name}
                className="w-full rounded-xl object-cover"
              />
            ) : null}
            <p className="mt-6 text-base leading-7 text-ink/80">{record.description ?? record.summary}</p>
            {record.features && record.features.length > 0 ? (
              <ul className="mt-6 space-y-2 text-sm text-ink/80">
                {record.features.map((feature) => (
                  <li key={feature.id}>
                    {feature.label}
                    {feature.value ? ` — ${feature.value}` : ""}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="rounded-xl border border-line bg-white p-6 shadow-card">
            <p className="text-2xl font-semibold">{price ? formatMoney(price.amount, price.currency) : "Price on request"}</p>
            {price?.billing_period ? <p className="mt-2 text-sm text-ink/70">{formatBilling(price.billing_period)}</p> : null}
            {price ? (
              <button type="button" className="mt-6 min-h-11 rounded-md bg-champagne px-5 text-sm font-semibold text-night" onClick={() => void add(record.id)}>
                Add to cart
              </button>
            ) : (
              <p className="mt-6 text-sm text-ink/70">A product can be added to the cart after a price is published.</p>
            )}
            <p className="mt-6 text-sm leading-6 text-ink/60">Download files are not shown here. Access is released on the order after payment succeeds.</p>
            <Link to="/shop" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-champagne-deep">
              Back to shop
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
