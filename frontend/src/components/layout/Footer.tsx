import { Link } from "react-router-dom";

import { ContactDetails } from "@/components/company/ContactDetails";
import { Container } from "@/components/ui/Container";
import { PUBLIC_NAV } from "@/constants/navigation";
import { SITE } from "@/constants/site";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listPublicSocialLinks } from "@/services/contentService";
import { safeUrl } from "@/utils/safeUrl";

export function Footer() {
  const social = useAsyncData(() => listPublicSocialLinks(), []);
  return (
    <footer className="surface-dark mt-auto border-t border-night/10">
      <Container className="grid gap-10 py-14 sm:py-16 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-3xl">{SITE.shortName}</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-night/70">{SITE.positioning}</p>
          <div className="mt-6">
            <ContactDetails tone="dark" />
          </div>
        </div>
        <nav aria-label="Footer">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-champagne-deep">Explore</p>
          <ul className="mt-4 space-y-2 text-sm">
            {PUBLIC_NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-night/75 hover:text-night">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-champagne-deep">Enquiries</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/custom-quote" className="text-night/75 hover:text-night">
                Custom Quote
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-night/75 hover:text-night">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/login" className="text-night/75 hover:text-night">
                Sign in
              </Link>
            </li>
          </ul>
          {social.data && social.data.length > 0 ? (
            <ul className="mt-6 space-y-2 text-sm">
              {social.data.map((item) => {
                const href = safeUrl(item.url);
                if (!href) {
                  return null;
                }
                return (
                  <li key={item.id}>
                    <a href={href} className="break-all text-night/75 hover:text-night" rel="noopener noreferrer" target="_blank">
                      {item.platform}
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </Container>
      <Container className="border-t border-night/10 py-5 text-xs text-night/50">{SITE.name}</Container>
    </footer>
  );
}
