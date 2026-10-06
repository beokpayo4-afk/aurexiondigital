import { Link } from "react-router-dom";

import { ActivityList } from "@/components/company/ActivityList";
import { PageIntro } from "@/components/layout/PageIntro";
import { CTASection } from "@/components/ui/CTASection";
import { Container } from "@/components/ui/Container";
import { AREAS } from "@/constants/company";
import { SITE } from "@/constants/site";
import { usePageTitle } from "@/hooks/usePageTitle";

export function AboutPage() {
  usePageTitle("About Us");

  return (
    <>
      <PageIntro
        eyebrow="About Us"
        title={SITE.name}
        description={`${SITE.positioning}. The registered office is situated in the State of Madhya Pradesh.`}
      />
      <section className="bg-paper">
        <Container className="py-16 sm:py-20 lg:py-24">
          <h2 className="max-w-3xl font-display text-4xl leading-tight sm:text-5xl">A company limited by shares.</h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink/75">
            The public site is organized around four business areas. Published services, products, and courses are shown on their own pages.
          </p>
          <div className="mt-14 space-y-14">
            {AREAS.map((area) => (
              <section key={area.id} aria-labelledby={area.id}>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <h3 id={area.id} className="font-display text-4xl">
                    {area.title}
                  </h3>
                  <Link to={area.href} className="min-h-11 text-sm font-semibold text-champagne-deep">
                    Open area
                  </Link>
                </div>
                <div className="mt-6">
                  <ActivityList activities={area.activities} />
                </div>
              </section>
            ))}
          </div>
        </Container>
      </section>
      <CTASection
        title="Start with a message."
        description="Use Custom Quote for a commercial request, or Contact for a general message."
        primary={{ to: "/quote", label: "Custom Quote" }}
        secondary={{ to: "/contact", label: "Contact" }}
      />
    </>
  );
}
