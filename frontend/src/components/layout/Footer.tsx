import { Link } from "react-router-dom";

import logo from "@/assets/aurexion-logo.jpg";
import { ContactDetails } from "@/components/company/ContactDetails";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/constants/site";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listPublicSocialLinks } from "@/services/contentService";
import { safeUrl } from "@/utils/safeUrl";

export function Footer() {
  const social = useAsyncData(() => listPublicSocialLinks(), []);
  return (
    <footer className="surface-dark mt-auto border-t border-night/10">
      <Container className="grid gap-10 py-14 sm:py-16 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <img src={logo} alt={SITE.name} className="h-16 w-auto rounded-md bg-white" />
          <p className="mt-4 text-lg font-semibold">{SITE.name}</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-night/70">{SITE.positioning}</p>
        </div>
        <nav aria-label="Company">
          <p className="text-sm font-semibold text-ink">Company</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/about" className="text-night/75 hover:text-night">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-night/75 hover:text-night">
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="/solutions" className="text-night/75 hover:text-night">
                Services
              </Link>
            </li>
            <li>
              <Link to="/technology" className="text-night/75 hover:text-night">
                Technology
              </Link>
            </li>
            <li>
              <Link to="/shop" className="text-night/75 hover:text-night">
                Shop
              </Link>
            </li>
            <li>
              <Link to="/academy" className="text-night/75 hover:text-night">
                Academy
              </Link>
            </li>
            <li>
              <Link to="/company" className="text-night/75 hover:text-night">
                Company Information
              </Link>
            </li>
            <li>
              <Link to="/custom-quote" className="text-night/75 hover:text-night">
                Custom Quote
              </Link>
            </li>
            <li>
              <Link to="/login" className="text-night/75 hover:text-night">
                Sign in
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Legal">
          <p className="text-sm font-semibold text-ink">Legal</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/privacy" className="text-night/75 hover:text-night">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="text-night/75 hover:text-night">
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link to="/refunds" className="text-night/75 hover:text-night">
                Refund & Cancellation Policy
              </Link>
            </li>
            <li>
              <Link to="/shipping" className="text-night/75 hover:text-night">
                Shipping & Delivery Policy
              </Link>
            </li>
            <li>
              <Link to="/disclaimer" className="text-night/75 hover:text-night">
                Disclaimer
              </Link>
            </li>
            <li>
              <Link to="/data-security" className="text-night/75 hover:text-night">
                Data Security
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <p className="text-sm font-semibold text-ink">Contact</p>
          <div className="mt-4">
            <ContactDetails tone="dark" />
          </div>
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
      <Container className="border-t border-night/10 py-5 text-xs text-night/50">
        © 2026 {SITE.name}. All Rights Reserved.
      </Container>
    </footer>
  );
}
