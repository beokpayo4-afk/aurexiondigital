import { Container } from "@/components/ui/Container";
import { Breadcrumbs, type Crumb } from "@/components/seo/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";

type PageIntroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  crumbs?: Crumb[];
};

export function PageIntro({ eyebrow, title, description, crumbs }: PageIntroProps) {
  return (
    <section className="surface-dark">
      <Container className="py-12 sm:py-16">
        {crumbs && crumbs.length > 0 ? <Breadcrumbs items={crumbs} /> : null}
        <SectionHeading as="h1" tone="dark" eyebrow={eyebrow} title={title} description={description} />
      </Container>
    </section>
  );
}
