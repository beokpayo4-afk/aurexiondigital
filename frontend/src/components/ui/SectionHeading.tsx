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
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-champagne-deep">
          {eyebrow}
        </p>
      ) : null}
      <Heading id={id} className={`text-balance font-display text-4xl leading-tight sm:text-5xl lg:text-6xl ${titleClass} ${eyebrow ? "mt-4" : ""}`}>
        {title}
      </Heading>
      {description ? <p className={`mt-5 text-base leading-7 sm:text-lg ${bodyClass}`}>{description}</p> : null}
    </div>
  );
}
