import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { TechnologyEnquiryForm } from "@/components/technology/TechnologyEnquiryForm";
import { PageIntro } from "@/components/layout/PageIntro";
import { JsonLd } from "@/components/seo/JsonLd";
import { ContentImage } from "@/components/ui/ContentImage";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getProduct } from "@/services/catalogService";
import type { ProductPrice } from "@/types/catalog";
import { productData } from "@/seo/structuredData";
import { safeUrl } from "@/utils/safeUrl";
import { formatBilling, formatMoney } from "@/utils/format";

function isSubscription(price: ProductPrice) {
  return price.billing_period === "monthly" || price.billing_period === "yearly";
}

export function ProductDetailPage() {
  const { slug = "" } = useParams();
  const product = useAsyncData(() => getProduct(slug), [slug]);
  const record = product.data;
  usePageTitle(record?.name ?? "Product", record?.summary ?? undefined);
  const [intent, setIntent] = useState("");

  if (product.loading) {
    return (
      <section className="bg-paper">
        <Container className="py-20">
          <LoadingState label="Loading product" />
        </Container>
      </section>
    );
  }
  if (product.error) {
    return (
      <section className="bg-paper">
        <Container className="py-20">
          <ErrorState message={product.error} onRetry={product.reload} />
        </Container>
      </section>
    );
  }
  if (!record) {
    return (
      <section className="bg-paper">
        <Container className="py-20">
          <EmptyState
            title="This product is not published"
            description="The product page appears when the product is published."
            action={
              <Button to="/technology" tone="light">
                Technology
              </Button>
            }
          />
        </Container>
      </section>
    );
  }

  const prices = record.prices.filter((item) => item.is_active);
  const subscriptions = prices.filter(isSubscription);
  const purchases = prices.filter((item) => !isSubscription(item));
  const image = record.images?.[0];
  const features = record.features ?? [];
  const demoHref = safeUrl(record.demo_url);
  const purchaseMessage = `I want to buy ${record.name}.`;
  const startMessage = `I want to get started with ${record.name}.`;

  return (
    <>
      <JsonLd
        data={productData(window.location.origin, {
          name: record.name,
          path: `/technology/products/${record.slug}`,
          summary: record.summary,
          description: record.description,
          image: image?.file_url,
          price: prices[0]?.amount,
          currency: prices[0]?.currency,
        })}
      />
      <PageIntro
        eyebrow="Technology"
        title={record.name}
        description={record.summary ?? record.name}
        crumbs={[
          { label: "Home", to: "/" },
          { label: "Technology", to: "/technology" },
          { label: record.name },
        ]}
      />
      <section className="bg-paper">
        <Container className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr]">
          <figure className="overflow-hidden rounded-xl border border-line bg-white">
            {image ? (
              <ContentImage
                src={image.file_url}
                alt={image.alt_text?.trim() || record.name}
                width={960}
                height={720}
                className="aspect-[4/3] h-auto w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center px-6">
                <p className="text-sm text-ink/60">No product image is published.</p>
              </div>
            )}
          </figure>
          <div>
            <h2 className="font-display text-4xl">Description</h2>
            <p className="mt-4 text-base leading-7 text-ink/80">{record.description ?? record.summary ?? "No description is published."}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="#enquire" tone="light" onClick={() => setIntent(purchaseMessage)}>
                Buy Now
              </Button>
              <Button to="#enquire" variant="secondary" tone="light" onClick={() => setIntent(startMessage)}>
                Get Started
              </Button>
              {demoHref ? (
                <a
                  href={demoHref}
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-champagne-deep"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  View demo
                </a>
              ) : (
                <p className="self-center text-sm text-ink/60">No demo is published.</p>
              )}
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-ink/60">
              Buy Now and Get Started send an enquiry. Payment is confirmed after that enquiry.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-white" aria-labelledby="product-features">
        <Container className="py-16 sm:py-20">
          <SectionHeading id="product-features" eyebrow="Features" title="Features" />
          <div className="mt-8">
            {features.length > 0 ? (
              <ul className="grid gap-4 md:grid-cols-2">
                {features.map((feature) => (
                  <li key={feature.id} className="border-t border-line py-4 text-sm leading-6 text-ink/80">
                    <span className="font-semibold text-ink">{feature.label}</span>
                    {feature.value ? <span className="block text-ink/70">{feature.value}</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No features published" description="Product features appear here when they are published." />
            )}
          </div>
        </Container>
      </section>

      <section className="bg-paper" aria-labelledby="product-pricing">
        <Container className="py-16 sm:py-20">
          <SectionHeading id="product-pricing" eyebrow="Pricing" title="Pricing" />
          <div className="mt-8">
            {purchases.length > 0 ? (
              <PriceList prices={purchases} />
            ) : (
              <EmptyState title="No price published" description="A one-time price appears here when it is published for this product." />
            )}
          </div>
          <h3 className="mt-12 font-display text-3xl">Subscription</h3>
          <div className="mt-6">
            {subscriptions.length > 0 ? (
              <PriceList prices={subscriptions} />
            ) : (
              <EmptyState title="No subscription published" description="A monthly or yearly price appears here when it is published." />
            )}
          </div>
        </Container>
      </section>

      <section className="bg-white" aria-labelledby="product-demo">
        <Container className="py-16 sm:py-20">
          <SectionHeading id="product-demo" eyebrow="Preview" title="Demo" />
          <div className="mt-8">
            {demoHref ? (
              <a href={demoHref} className="text-sm font-semibold text-champagne-deep" rel="noopener noreferrer" target="_blank">
                Open the published demo
              </a>
            ) : (
              <EmptyState title="No demo published" description="A demo or preview link appears here when it is published." />
            )}
          </div>
        </Container>
      </section>

      <section id="enquire" className="bg-paper" aria-labelledby="product-enquiry">
        <Container className="py-16 sm:py-20">
          <SectionHeading id="product-enquiry" eyebrow="Enquiry" title="Enquiry" description={`This enquiry is for ${record.name}.`} />
          <div className="mt-8">
            <TechnologyEnquiryForm
              key={intent || "enquire"}
              defaultMessage={intent || `I would like to enquire about ${record.name}.`}
              submitLabel={intent.startsWith("I want to buy") ? "Buy Now" : "Get Started"}
            />
          </div>
          <p className="mt-8">
            <Link to="/technology" className="text-sm font-semibold text-champagne-deep">
              Back to technology
            </Link>
          </p>
        </Container>
      </section>
    </>
  );
}

function PriceList({ prices }: { prices: ProductPrice[] }) {
  if (prices.length === 0) {
    return <EmptyState title="No price published" description="A price appears here when it is published for this product." />;
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {prices.map((price) => (
        <li key={price.id} className="rounded-xl border border-line bg-white p-6 shadow-card">
          <p className="font-display text-3xl text-ink">{formatMoney(price.amount, price.currency)}</p>
          {formatBilling(price.billing_period) ? <p className="mt-2 text-sm text-ink/70">{formatBilling(price.billing_period)}</p> : null}
        </li>
      ))}
    </ul>
  );
}
