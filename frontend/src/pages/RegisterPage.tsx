import { Link, Navigate } from "react-router-dom";

import { RegisterForm } from "@/components/forms/RegisterForm";
import { Container } from "@/components/ui/Container";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";

export function RegisterPage() {
  usePageTitle("Create account");
  const { isAuthenticated, isReady } = useAuth();

  if (isReady && isAuthenticated) {
    return <Navigate to="/account" replace />;
  }

  return (
    <section className="bg-paper">
      <Container className="py-16 sm:py-20">
        <div className="max-w-md rounded-xl border border-line bg-white p-6 shadow-card sm:p-8">
          <h1 className="text-3xl font-semibold">Create account</h1>
          <p className="mt-4 text-sm leading-6 text-ink/75">Registration creates a customer account.</p>
          <div className="mt-8">
            <RegisterForm />
          </div>
          <p className="mt-6 text-sm">
            <Link to="/login" className="font-semibold text-champagne-deep">
              Already have an account
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
