import { PageIntro } from "@/components/layout/PageIntro";
import { ContactDetails } from "@/components/company/ContactDetails";
import { Container } from "@/components/ui/Container";
import { usePageTitle } from "@/hooks/usePageTitle";
import { POLICIES, type PolicyKind } from "@/content/policies";

export function PolicyPage({ kind }: { kind: PolicyKind }) {
  const policy = POLICIES[kind];
  usePageTitle(policy.title, policy.description);

  return (
    <>
      <PageIntro title={policy.title} description={policy.description} />
      <section className="bg-paper">
        <Container className="grid gap-10 py-16 lg:grid-cols-[minmax(0,1fr)_280px] lg:py-20">
          <div className="space-y-8">
            {policy.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <div className="mt-3 space-y-3">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-ink/80">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <ContactDetails />
        </Container>
      </section>
    </>
  );
}
