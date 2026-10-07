import { SITE } from "@/constants/site";

type ContactDetailsProps = {
  tone?: "dark" | "light";
};

export function ContactDetails({ tone = "light" }: ContactDetailsProps) {
  const muted = tone === "dark" ? "text-night/75" : "text-ink/75";
  const label = "text-champagne-deep";
  const link = tone === "dark" ? "text-night hover:text-champagne-deep" : "text-ink hover:text-champagne-deep";

  return (
    <address className="not-italic">
      <dl className={`space-y-4 text-sm leading-6 ${muted}`}>
        <div>
          <dt className={`text-xs font-semibold uppercase tracking-[0.18em] ${label}`}>Phone</dt>
          <dd className="mt-1">
            <a className={link} href={SITE.phoneHref}>
              {SITE.phone}
            </a>
          </dd>
        </div>
        <div>
          <dt className={`text-xs font-semibold uppercase tracking-[0.18em] ${label}`}>Email</dt>
          <dd className="mt-1">
            <a className={`break-all ${link}`} href={SITE.emailHref}>
              {SITE.email}
            </a>
          </dd>
        </div>
        <div>
          <dt className={`text-xs font-semibold uppercase tracking-[0.18em] ${label}`}>Address</dt>
          <dd className="mt-1 max-w-xs">
            {SITE.addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </dd>
        </div>
      </dl>
    </address>
  );
}
