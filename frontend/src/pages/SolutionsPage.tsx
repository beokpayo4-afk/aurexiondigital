import { Link } from "react-router-dom";

import { Reveal } from "@/components/motion/Reveal";
import { PageIntro } from "@/components/layout/PageIntro";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { SOLUTIONS } from "@/constants/solutions";
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
        title="Growth services."
        description="Each service page reads the published record, including packages and starting prices when they are set."
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
                    <h2 className="font-display text-4xl">{service?.name ?? item.title}</h2>
                    <p className="mt-4 flex-1 text-sm leading-6 text-ink/75">
                      {service?.summary ?? "This service is not published yet."}
                    </p>
                    <Link to={`/solutions/${item.slug}`} className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-champagne-deep">
                      View service
                    </Link>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>
    </>
  );
}
