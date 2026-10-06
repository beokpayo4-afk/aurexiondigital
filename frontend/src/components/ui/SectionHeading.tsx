type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  as?: "h1" | "h2";
  tone?: "dark" | "light";
  id?: string;
};

export function SectionHeading({ eyebrow, title, description, as = "h2", tone = "light", id }: SectionHeadingProps) {
  const Heading = as;
  const titleClass = tone === "dark" ? "text-night" : "text-ink";
  const bodyClass = tone === "dark" ? "text-night/75" : "text-ink/75";

  return (
    <div className="max-w-3xl">
      {eyebrow ? <p className="text-sm text-champagne-deep">{eyebrow}</p> : null}
      <Heading id={id} className={`text-balance text-3xl font-semibold leading-snug sm:text-4xl ${titleClass} ${eyebrow ? "mt-2" : ""}`}>
        {title}
      </Heading>
      {description ? <p className={`mt-5 text-base leading-7 sm:text-lg ${bodyClass}`}>{description}</p> : null}
    </div>
  );
}
