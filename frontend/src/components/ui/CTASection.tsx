import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

type Action = {
  to: string;
  label: string;
};

type CTASectionProps = {
  title: string;
  description: string;
  primary: Action;
  secondary?: Action;
};

export function CTASection({ title, description, primary, secondary }: CTASectionProps) {
  return (
    <section className="surface-dark">
      <Container className="py-20 sm:py-24 lg:py-28">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[1.4fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <h2 className="font-display text-4xl leading-tight sm:text-5xl">{title}</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-night/75">{description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button to={primary.to}>{primary.label}</Button>
              {secondary ? (
                <Button to={secondary.to} variant="secondary" tone="dark">
                  {secondary.label}
                </Button>
              ) : null}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
