import { Link, useParams } from "react-router-dom";

import { ProductCard } from "@/components/cards/ProductCard";
import { PageIntro } from "@/components/layout/PageIntro";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { technologyTrack } from "@/constants/technology";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { listProducts, listServices } from "@/services/catalogService";
import type { Product, Service } from "@/types/catalog";
import { readServiceContent } from "@/utils/serviceContent";

const AREA = "technology-digital-products";

export function TechnologyTrackPage() {
  const { slug = "" } = useParams();
  const track = technologyTrack(slug);
  usePageTitle(track?.title ?? "Technology", track ? `${track.title} services and products.` : undefined);
  const services = useAsyncData(() => listServices({ business_area: AREA }), [Boolean(track)], { enabled: Boolean(track) });
  const productType = track?.productType ?? "";
  const products = useAsyncData(() => listProducts({ product_type: productType }), [productType], { enabled: Boolean(productType) });
  const matched = (services.data?.items ?? []).filter((service) => readServiceContent(service.description).track === slug);
  const catalog = (products.data?.items ?? []).filter((product) => {
    if (!track?.productType) {
      return false;
    }
    return (
      product.product_type === track.productType &&
      (product.listing_channel === "technology" || product.listing_channel === "both")
    );
  });

  if (!track) {
    return (
      <section className="bg-paper">
        <Container className="py-20">
          <EmptyState
            title="This technology page is not available"
            description="Go back to the technology page and choose an area."
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

  return (
    <>
      <PageIntro
        eyebrow="Technology"
        title={track.title}
        description={matched[0]?.summary ?? `${track.title} at Aurexion Digital.`}
        crumbs={[
          { label: "Home", to: "/" },
          { label: "Technology", to: "/technology" },
          { label: track.title },
        ]}
      />
      <section className="bg-paper">
        <Container className="py-16 sm:py-20">
          <SectionHeading eyebrow="Services" title="Services included" />
          <div className="mt-8">
            {services.loading ? <LoadingState label="Loading services" /> : null}
            {services.error ? <ErrorState message={services.error} onRetry={services.reload} /> : null}
            {!services.loading && !services.error && matched.length === 0 ? (
              <EmptyState title="No services listed yet" description="You can still send a project enquiry from the technology page." />
            ) : null}
            {matched.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {matched.map((service) => (
                  <TrackService key={service.id} service={service} />
                ))}
              </div>
            ) : null}
          </div>

          <h2 className="mt-16 font-display text-4xl sm:text-5xl">Products</h2>
          <div className="mt-8">
            {products.loading ? <LoadingState label="Loading products" /> : null}
            {products.error ? <ErrorState message={products.error} onRetry={products.reload} /> : null}
            {!products.loading && !products.error && catalog.length === 0 ? (
              <EmptyState
                title="No published products"
                description="Products for this page appear when they are published on the technology channel."
              />
            ) : null}
            {catalog.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {catalog.map((product) => (
                  <TrackProduct key={product.id} product={product} />
                ))}
              </div>
            ) : null}
          </div>
          <p className="mt-10">
            <Link to="/technology#enquire" className="text-sm font-semibold text-champagne-deep">
              Project enquiry
            </Link>
          </p>
        </Container>
      </section>
    </>
  );
}

function TrackService({ service }: { service: Service }) {
  const content = readServiceContent(service.description);
  return (
    <Card className="h-full">
      <h3 className="font-display text-3xl">{service.name}</h3>
      <p className="mt-3 text-sm leading-6 text-ink/75">{content.introduction ?? service.summary}</p>
    </Card>
  );
}

function TrackProduct({ product }: { product: Product }) {
  const price = product.prices.find((item) => item.is_active) ?? product.prices[0];
  return (
    <ProductCard
      name={product.name}
      summary={product.summary}
      productType={product.product_type}
      amount={price?.amount}
      currency={price?.currency}
      billingPeriod={price?.billing_period}
      href={`/technology/products/${product.slug}`}
    />
  );
}
