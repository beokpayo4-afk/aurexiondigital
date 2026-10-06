import { Link } from "react-router-dom";

import { ProductCard } from "@/components/cards/ProductCard";
import { TechnologyEnquiryForm } from "@/components/technology/TechnologyEnquiryForm";
import { Reveal } from "@/components/motion/Reveal";
import { PageIntro } from "@/components/layout/PageIntro";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TECHNOLOGY_TRACKS } from "@/constants/technology";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { listProducts, listServices } from "@/services/catalogService";
import type { Product, Service } from "@/types/catalog";
import { readServiceContent } from "@/utils/serviceContent";

const AREA = "technology-digital-products";

function isTechnologyProduct(product: Product) {
  return (
    (product.listing_channel === "technology" || product.listing_channel === "both") &&
    ["software", "saas", "digital"].includes(product.product_type)
  );
}

function activePrice(product: Product) {
  return product.prices.find((item) => item.is_active) ?? product.prices[0];
}

export function TechnologyPage() {
  usePageTitle("Technology", "Software, SaaS, websites, applications, automation, and digital products.");
  const services = useAsyncData(() => listServices({ business_area: AREA }), []);
  const products = useAsyncData(() => listProducts(), []);
  const published = (services.data?.items ?? []).filter((service) => readServiceContent(service.description).track);
  const software = (products.data?.items ?? []).filter((product) => isTechnologyProduct(product) && product.product_type === "software");
  const saas = (products.data?.items ?? []).filter((product) => isTechnologyProduct(product) && product.product_type === "saas");
  const process = published.flatMap((service) => readServiceContent(service.description).process).slice(0, 4);
  const why = published.flatMap((service) => readServiceContent(service.description).why);

  return (
    <>
      <PageIntro
        eyebrow="Technology"
        title="Software, websites, and products"
        description="Software, SaaS, websites, applications, automation, and digital products. A project starts with an enquiry so the scope is clear before work begins."
      />

      <section className="bg-paper" aria-labelledby="technology-services">
        <Container className="py-16 sm:py-20 lg:py-24">
          <SectionHeading id="technology-services" title="Services" />
          <div className="mt-10">
            {services.loading ? <LoadingState label="Loading services" /> : null}
            {services.error ? <ErrorState message={services.error} onRetry={services.reload} /> : null}
            {!services.loading && !services.error && published.length === 0 ? (
              <EmptyState title="No services listed yet" description="You can still send a project enquiry below." />
            ) : null}
            {published.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {published.map((service) => (
                  <ServiceLink key={service.id} service={service} />
                ))}
              </div>
            ) : null}
          </div>
        </Container>
      </section>

      <ProductBand
        id="featured-software"
        eyebrow="Software"
        title="Software"
        loading={products.loading}
        error={products.error}
        onRetry={products.reload}
        products={software}
        emptyTitle="No software listed yet"
        emptyDescription="Software products will show here when they are added."
      />
      <ProductBand
        id="featured-saas"
        eyebrow="SaaS"
        title="SaaS"
        loading={products.loading}
        error={products.error}
        onRetry={products.reload}
        products={saas}
        emptyTitle="No SaaS products listed yet"
        emptyDescription="SaaS products will show here when they are added."
        surface="white"
      />

      {process.length > 0 ? (
        <section className="bg-paper" aria-labelledby="technology-process">
          <Container className="py-16 sm:py-20">
            <SectionHeading id="technology-process" title="How a project runs" />
            <ol className="mt-8 grid gap-5 md:grid-cols-2">
              {process.map((step, index) => (
                <li key={step.title}>
                  <Card className="h-full">
                    <p className="text-sm text-champagne-deep">{index + 1}</p>
                    <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-ink/75">{step.detail}</p>
                  </Card>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      ) : null}

      <section className="bg-white" aria-labelledby="why-technology">
        <Container className="py-16 sm:py-20">
          {why.length > 0 ? (
            <>
              <SectionHeading id="why-technology" title="Notes" />
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {[...new Set(why)].map((item) => (
                  <Card key={item}>
                    <p className="text-sm leading-6 text-ink/80">{item}</p>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <h2 id="why-technology" className="text-2xl font-semibold">
              Areas
            </h2>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {TECHNOLOGY_TRACKS.map((track) => (
              <Button key={track.slug} to={`/technology/${track.slug}`} variant="secondary" tone="light">
                {track.title}
              </Button>
            ))}
          </div>
        </Container>
      </section>

      <section id="enquire" className="surface-dark" aria-labelledby="project-enquiry">
        <Container className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[1fr_1fr] lg:items-start">
          <SectionHeading
            id="project-enquiry"
            as="h2"
            tone="dark"
            eyebrow="Project"
            title="Project enquiry"
            description="Describe the software, website, app, or automation work. This form does not take payment."
          />
          <div className="rounded-xl bg-paper p-6 text-ink sm:p-8">
            <TechnologyEnquiryForm />
          </div>
        </Container>
      </section>
    </>
  );
}

function ServiceLink({ service }: { service: Service }) {
  const track = readServiceContent(service.description).track;
  return (
    <Reveal>
      <Card interactive className="flex h-full flex-col">
        <h3 className="text-xl font-semibold">{service.name}</h3>
        {service.summary ? <p className="mt-3 flex-1 text-sm leading-6 text-ink/75">{service.summary}</p> : null}
        <Link
          to={track ? `/technology/${track}` : "/technology"}
          className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-champagne-deep"
        >
          View service
        </Link>
      </Card>
    </Reveal>
  );
}

function ProductBand({
  id,
  eyebrow,
  title,
  loading,
  error,
  onRetry,
  products,
  emptyTitle,
  emptyDescription,
  surface = "paper",
}: {
  id: string;
  eyebrow: string;
  title: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  products: Product[];
  emptyTitle: string;
  emptyDescription: string;
  surface?: "paper" | "white";
}) {
  if (!loading && !error && products.length === 0) {
    return null;
  }

  return (
    <section className={surface === "white" ? "bg-white" : "bg-paper"} aria-labelledby={id}>
      <Container className="py-16 sm:py-20">
        <SectionHeading id={id} eyebrow={eyebrow} title={title} />
        <div className="mt-8">
          {loading ? <LoadingState label="Loading products" /> : null}
          {error ? <ErrorState message={error} onRetry={onRetry} /> : null}
          {!loading && !error && products.length === 0 ? <EmptyState title={emptyTitle} description={emptyDescription} /> : null}
          {products.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {products.slice(0, 6).map((product) => {
                const price = activePrice(product);
                return (
                  <ProductCard
                    key={product.id}
                    name={product.name}
                    summary={product.summary}
                    description={product.description}
                    features={product.features}
                    productType={product.product_type}
                    amount={price?.amount}
                    currency={price?.currency}
                    billingPeriod={price?.billing_period}
                    imageUrl={product.images?.[0]?.file_url}
                    imageAlt={product.images?.[0]?.alt_text ?? product.name}
                    href={`/technology/products/${product.slug}`}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
