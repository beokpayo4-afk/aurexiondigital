import { Link } from "react-router-dom";

import { Reveal } from "@/components/motion/Reveal";
import { PageIntro } from "@/components/layout/PageIntro";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { SERVICE_SCOPE, SOLUTIONS } from "@/constants/solutions";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { listServices } from "@/services/catalogService";

export function SolutionsPage() {
  usePageTitle("Solutions", "Digital marketing, advertising, creative work, lead generation, consulting, trade support, and outsourcing.");
  const services = useAsyncData(() => listServices(), []);
  const bySlug = new Map((services.data?.items ?? []).map((service) => [service.slug, service]));

  return (
    <>
      <PageIntro
        eyebrow="Solutions"
        title="Marketing and business services"
        description="Digital marketing, advertising, creative work, lead generation, consulting, trade support, and outsourcing."
      />
      <section className="bg-paper">
        <Container className="py-16 sm:py-20 lg:py-24">
          {services.loading ? <LoadingState label="Loading services" /> : null}
          {services.error ? <ErrorState message={services.error} onRetry={services.reload} /> : null}
          <div className="grid gap-5 md:grid-cols-2">
            {SOLUTIONS.map((item, index) => {
              const service = bySlug.get(item.slug);
              return (
                <Reveal key={item.slug} delay={index * 0.04}>
                  <Card interactive className="flex h-full flex-col">
                    <h2 className="text-2xl font-semibold leading-snug">{service?.name ?? item.title}</h2>
                    <p className="mt-4 flex-1 text-sm leading-6 text-ink/75">
                      {service?.summary ?? "Details for this service are being added."}
                    </p>
                    <Link to={`/solutions/${item.slug}`} className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-champagne-deep">
                      View service
                    </Link>
                  </Card>
                </Reveal>
              );
            })}
          </div>
          <div className="mt-16">
            <h2 className="text-3xl font-semibold">Services</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/75">
              These are the services the company can discuss. A package with a price is a starting price. Final pricing may vary based on campaign requirements, duration, location, media/platform costs, production requirements, third-party charges and other project requirements.
            </p>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {SERVICE_SCOPE.map((group) => (
                <Card key={group.title}>
                  <h3 className="text-xl font-semibold">{group.title}</h3>
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-ink/80">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <Link to={group.to} className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-champagne-deep">
                    View service
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
