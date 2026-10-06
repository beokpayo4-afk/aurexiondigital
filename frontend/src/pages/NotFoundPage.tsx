import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { usePageTitle } from "@/hooks/usePageTitle";

export function NotFoundPage() {
  usePageTitle("Page not found", { robots: "noindex, follow" });

  return (
    <section className="bg-paper">
      <Container className="py-20 sm:py-28">
        <p className="text-sm text-champagne-deep">404</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Page not found</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-ink/75">That address is not part of this site.</p>
        <div className="mt-8">
          <Button to="/" tone="light">
            Back to home
          </Button>
        </div>
        <p className="mt-6 text-sm">
          <Link to="/contact" className="text-champagne-deep">
            Contact
          </Link>
        </p>
      </Container>
    </section>
  );
}
