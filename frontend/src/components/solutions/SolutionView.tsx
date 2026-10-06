import { Link } from "react-router-dom";

import { PackageCard } from "@/components/cards/PackageCard";
import { SolutionEnquiryForm } from "@/components/solutions/SolutionEnquiryForm";
import { ActivityList } from "@/components/company/ActivityList";
import { PageIntro } from "@/components/layout/PageIntro";
import { JsonLd } from "@/components/seo/JsonLd";
import { Reveal } from "@/components/motion/Reveal";
import { CTASection } from "@/components/ui/CTASection";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { FAQ } from "@/components/ui/FAQ";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PRICING_DISCLAIMER } from "@/constants/solutions";
import type { Service } from "@/types/catalog";
import { faqData, serviceData } from "@/seo/structuredData";
import { readServiceContent } from "@/utils/serviceContent";

type SolutionViewProps = {
  service: Service;
};

export function SolutionView({ service }: SolutionViewProps) {
  const content = readServiceContent(service.description);
  const included = content.included.length > 0 ? content.included : featureLabels(service);
  const enquiryHref = `/solutions/${service.slug}#enquire`;

  return (
    <>
      <JsonLd data={serviceData(window.location.origin, { name: service.name, slug: service.slug, summary: service.summary })} />
      {content.faqs.length > 0 ? <JsonLd data={faqData(content.faqs)} /> : null}
      <PageIntro
        eyebrow="Solutions"
        title={service.name}
        description={service.summary ?? service.name}
        crumbs={[
          { label: "Home", to: "/" },
          { label: "Solutions", to: "/solutions" },
          { label: service.name },
        ]}
      />

      {content.introduction ? (
        <section className="bg-paper" aria-labelledby="introduction-heading">
          <Container className="py-16 sm:py-20">
            <SectionHeading id="introduction-heading" title="About this service" />
            <p className="mt-6 max-w-3xl text-base leading-7 text-ink/80">{content.introduction}</p>
          </Container>
        </section>
      ) : null}

      {included.length > 0 ? (
        <section className="bg-white" aria-labelledby="included-heading">
          <Container className="py-16 sm:py-20">
            <SectionHeading id="included-heading" title="Included" />
            <div className="mt-8">
              <ActivityList activities={included} />
            </div>
          </Container>
        </section>
      ) : null}

      {content.benefits.length > 0 ? (
        <section className="bg-paper" aria-labelledby="benefits-heading">
          <Container className="py-16 sm:py-20">
            <SectionHeading id="benefits-heading" title="What this is for" />
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {content.benefits.map((benefit) => (
                <Card key={benefit}>
                  <p className="text-sm leading-6 text-ink/80">{benefit}</p>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section className="bg-white" aria-labelledby="packages-heading">
        <Container className="py-16 sm:py-20">
          <SectionHeading
            id="packages-heading"
            title="Packages"
            description="A price on a package is a starting price for the service fee."
          />
          <div className="mt-8">
            {service.packages.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {service.packages.map((item) => (
                  <PackageCard
                    key={item.id}
                    name={item.name}
                    summary={item.summary}
                    priceAmount={item.price_amount}
                    currency={item.currency}
                    billingPeriod={item.billing_period}
                    pricePrefix="Starting at"
                    features={(item.features ?? []).map((feature) => feature.label)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-ink/75">Packages for this service are confirmed when you enquire.</p>
            )}
          </div>
          {content.managementFeeNote ? (
            <p className="mt-8 max-w-3xl text-sm leading-6 text-ink/75">{content.managementFeeNote}</p>
          ) : null}
          <p className="mt-6 max-w-3xl border-t border-line pt-6 text-sm leading-6 text-ink/75">{PRICING_DISCLAIMER}</p>
        </Container>
      </section>

      {content.process.length > 0 ? (
        <section className="bg-paper" aria-labelledby="process-heading">
          <Container className="py-16 sm:py-20">
            <SectionHeading id="process-heading" title="How it works" />
            <ol className="mt-8 grid gap-5 md:grid-cols-2">
              {content.process.map((step, index) => (
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

      {content.faqs.length > 0 ? (
        <section className="bg-white" aria-labelledby="faq-heading">
          <Container className="py-16 sm:py-20">
            <SectionHeading id="faq-heading" title="Questions" />
            <div className="mt-8">
              <FAQ items={content.faqs} />
            </div>
          </Container>
        </section>
      ) : null}

      <CTASection
        title={`Ask about ${service.name}.`}
        description="Send an enquiry for this service. Final pricing is confirmed after consultation, and media placement is included only when it is confirmed."
        primary={{ to: enquiryHref, label: "Send an enquiry" }}
        secondary={{ to: "/contact", label: "Contact" }}
      />

      <section id="enquire" className="bg-paper" aria-labelledby="enquire-heading">
        <Container className="py-16 sm:py-20">
          <Reveal>
            <SectionHeading id="enquire-heading" title={`Ask about ${service.name}`} description="Send the details and we will reply from this enquiry." />
          </Reveal>
          <div className="mt-8">
            <SolutionEnquiryForm serviceId={service.id} serviceName={service.name} />
          </div>
          <p className="mt-8 text-sm text-ink/70">
            <Link to="/solutions" className="font-semibold text-champagne-deep">
              All solutions
            </Link>
          </p>
        </Container>
      </section>
    </>
  );
}

function featureLabels(service: Service): string[] {
  const labels = service.packages.flatMap((item) => (item.features ?? []).map((feature) => feature.label));
  return [...new Set(labels)];
}
