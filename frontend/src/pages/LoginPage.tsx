import { Link, Navigate } from "react-router-dom";

import { LoginForm } from "@/components/forms/LoginForm";
import { Container } from "@/components/ui/Container";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { canOpenAdmin } from "@/types/auth";

export function LoginPage() {
  usePageTitle("Sign in");
  const { isAuthenticated, isReady, roles } = useAuth();

  if (isReady && isAuthenticated) {
    return <Navigate to={canOpenAdmin(roles) ? "/admin" : "/account"} replace />;
  }

  return (
    <section className="bg-paper">
      <Container className="py-16 sm:py-20">
        <div className="max-w-md rounded-xl border border-line bg-white p-6 shadow-card sm:p-8">
          <h1 className="font-display text-5xl">Sign in</h1>
          <p className="mt-4 text-sm leading-6 text-ink/75">Customer and student access uses this account.</p>
          <div className="mt-8">
            <LoginForm />
          </div>
          <p className="mt-6 text-sm">
            <Link to="/register" className="font-semibold text-champagne-deep">
              Create an account
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
