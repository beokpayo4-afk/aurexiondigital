import { Link } from "react-router-dom";

import { ActivityList } from "@/components/company/ActivityList";
import { ContactDetails } from "@/components/company/ContactDetails";
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
        description={`${SITE.positioning}. Registered office: State of Madhya Pradesh.`}
      />
      <section className="bg-paper">
        <Container className="py-16 sm:py-20 lg:py-24">
          <div className="mb-14 max-w-xl rounded-xl border border-line bg-white p-6">
            <h2 className="text-xl font-semibold">{SITE.name}</h2>
            <div className="mt-4">
              <ContactDetails />
            </div>
          </div>
          <div className="max-w-3xl space-y-10">
            <section>
              <h2 className="text-2xl font-semibold">Who We Are</h2>
              <p className="mt-3 text-sm leading-7 text-ink/80">
                Aurexion Digital Private Limited works with individuals, startups, businesses, and organizations. The company is based in Bhopal, Madhya Pradesh.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold">What We Do</h2>
              <p className="mt-3 text-sm leading-7 text-ink/80">
                The company provides digital services, technology solutions, digital products, educational offerings, and business support. Work is scoped with the client before it starts.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold">Our Solutions</h2>
              <p className="mt-3 text-sm leading-7 text-ink/80">
                Solutions cover technology, digital marketing, advertising, education, and business support. Each service has its own page with the scope and, where a package exists, a starting price.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold">Technology & Digital Products</h2>
              <p className="mt-3 text-sm leading-7 text-ink/80">
                Technology work includes software, SaaS products, business automation, websites, applications, digital products, and related technology solutions. Published products and prices are listed in Technology and Shop.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold">Marketing & Advertising</h2>
              <p className="mt-3 text-sm leading-7 text-ink/80">
                Marketing and advertising cover digital campaigns, online and offline advertising, influencer and creator work, creative production, and lead generation. Results depend on the brief, the budget, and the platforms used.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold">Education & Training</h2>
              <p className="mt-3 text-sm leading-7 text-ink/80">
                Education is offered through Aurexion Academy. A course page shows the price, duration, level, modules, and what is included when those details have been published. A certificate is mentioned only when that course has one enabled.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold">Business Solutions</h2>
              <p className="mt-3 text-sm leading-7 text-ink/80">
                Business support includes consulting, trade and vendor support, and outsourcing for process, marketing, technology, and operations. The scope is confirmed in a proposal.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold">Our Approach</h2>
              <p className="mt-3 text-sm leading-7 text-ink/80">
                A service starts with an enquiry, then a consultation, a review of the requirement, a final proposal, payment, and then the work. A package label is not a finished quote.
              </p>
            </section>
          </div>
          <h2 className="mt-16 max-w-3xl text-3xl font-semibold leading-snug">The work is grouped into four areas.</h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink/75">
            Services, products, and courses are listed on their own pages. The lists below are the activities of the company.
          </p>
          <div className="mt-14 space-y-14">
            {AREAS.map((area) => (
              <section key={area.id} aria-labelledby={area.id}>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <h3 id={area.id} className="text-2xl font-semibold">
                    {area.title}
                  </h3>
                  <Link to={area.href} className="min-h-11 text-sm font-semibold text-champagne-deep">
                    View
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
        title="Write to us."
        description="Use Custom Quote for a campaign or a project. Use Contact for a general message."
        primary={{ to: "/quote", label: "Custom Quote" }}
        secondary={{ to: "/contact", label: "Contact" }}
      />
    </>
  );
}
