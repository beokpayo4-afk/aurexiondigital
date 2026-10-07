import { Link, useNavigate } from "react-router-dom";

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
import { useCart } from "@/context/useCart";
import type { Service } from "@/types/catalog";
import { faqData, serviceData } from "@/seo/structuredData";
import { readServiceContent } from "@/utils/serviceContent";

type SolutionViewProps = {
  service: Service;
};

export function SolutionView({ service }: SolutionViewProps) {
  const { addPackage } = useCart();
  const navigate = useNavigate();
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
        <section className="bg-paper" aria-label="About this service">
          <Container className="max-w-3xl space-y-5 py-16 sm:py-20">
            {content.introduction.split(/\n\n+/).map((paragraph) => (
              <p key={paragraph} className="text-base leading-7 text-ink/80">
                {paragraph}
              </p>
            ))}
          </Container>
        </section>
      ) : null}

      {content.offers.length > 0 ? (
        <section className="bg-white" aria-labelledby="offers-heading">
          <Container className="py-16 sm:py-20">
            <SectionHeading id="offers-heading" title={content.offersTitle ?? "What we offer"} />
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {content.offers.map((offer) => (
                <Card key={offer.title} className="h-full">
                  <h3 className="text-xl font-semibold">{offer.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/75">{offer.detail}</p>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {content.offers.length === 0 && included.length > 0 ? (
        <section className="bg-white" aria-labelledby="included-heading">
          <Container className="py-16 sm:py-20">
            <SectionHeading id="included-heading" title="Included" />
            <div className="mt-8">
              <ActivityList activities={included} />
            </div>
          </Container>
        </section>
      ) : null}

      {content.why.length > 0 ? (
        <section className="bg-paper" aria-labelledby="why-heading">
          <Container className="py-16 sm:py-20">
            <SectionHeading id="why-heading" title={content.whyTitle ?? "Why choose this service"} />
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {content.why.map((item) => (
                <li key={item} className="rounded-xl border border-line bg-white px-5 py-4 text-sm leading-6 text-ink/80">
                  {item}
                </li>
              ))}
            </ul>
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
                    pricePrefix="Starting from"
                    features={(item.features ?? []).map((feature) => feature.label)}
                    onAdd={item.price_amount ? () => void addPackage(item.id) : undefined}
                    onBuy={
                      item.price_amount
                        ? () => {
                            void addPackage(item.id, { open: false }).then(() => navigate("/checkout"));
                          }
                        : undefined
                    }
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
          <p className="mt-4 max-w-3xl text-sm leading-6 text-ink/75">
            Final pricing may vary based on campaign requirements, duration, location, media/platform costs, production requirements, third-party charges and other project requirements.
          </p>
          <ol className="mt-6 max-w-3xl list-decimal space-y-2 pl-5 text-sm leading-6 text-ink/80">
            <li>Package or service</li>
            <li>Enquire now</li>
            <li>Consultation</li>
            <li>Requirement analysis</li>
            <li>Final proposal</li>
            <li>Payment</li>
            <li>Service execution</li>
          </ol>
        </Container>
      </section>

      {content.process.length > 0 ? (
        <section className="bg-paper" aria-labelledby="process-heading">
          <Container className="py-16 sm:py-20">
            <SectionHeading id="process-heading" title={content.processTitle ?? "How it works"} />
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

      {content.audience.length > 0 ? (
        <section className="bg-white" aria-labelledby="audience-heading">
          <Container className="py-16 sm:py-20">
            <SectionHeading id="audience-heading" title={content.audienceTitle ?? "Who we help"} />
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {content.audience.map((item) => (
                <li key={item} className="text-sm leading-6 text-ink/80">
                  {item}
                </li>
              ))}
            </ul>
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
        title={content.ctaTitle ?? `Ask about ${service.name}.`}
        description={
          content.ctaDescription ??
          "Send an enquiry for this service. Final pricing is confirmed after consultation, and media placement is included only when it is confirmed."
        }
        primary={{ to: enquiryHref, label: content.ctaLabel ?? "Send an enquiry" }}
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
