import { Card } from "@/components/ui/Card";

type TestimonialCardProps = {
  quote: string;
  name: string;
  detail?: string | null;
};

export function TestimonialCard({ quote, name, detail }: TestimonialCardProps) {
  return (
    <Card className="h-full">
      <blockquote>
        <p className="font-display text-2xl leading-snug text-ink">“{quote}”</p>
        <footer className="mt-6 text-sm text-ink/70">
          <cite className="not-italic font-semibold text-ink">{name}</cite>
          {detail ? <span className="block">{detail}</span> : null}
        </footer>
      </blockquote>
    </Card>
  );
}
