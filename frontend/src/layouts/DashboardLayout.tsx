import { Suspense } from "react";
import { Link, Outlet } from "react-router-dom";

import logo from "@/assets/aurexion-logo.jpg";
import { PageFallback } from "@/components/routing/PageFallback";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/constants/site";
import { useAuth } from "@/hooks/useAuth";
import { canOpenAdmin } from "@/types/auth";

export function DashboardLayout() {
  const { roles, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="surface-dark border-b border-night/10">
        <Container className="flex min-h-20 items-center justify-between gap-4">
          <Link to="/">
            <img src={logo} alt={SITE.shortName} width={168} height={48} className="h-12 w-auto max-w-[9rem]" />
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm">
            <Link to="/" className="text-night/75 hover:text-night">
              Site
            </Link>
            {canOpenAdmin(roles) ? (
              <Link to="/admin" className="text-night/75 hover:text-night">
                Admin
              </Link>
            ) : null}
            <Link to="/account" className="text-night/75 hover:text-night">
              Account
            </Link>
            <Link to="/orders" className="text-night/75 hover:text-night">
              Orders
            </Link>
            <button type="button" className="min-h-11 text-night/75 hover:text-night" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </Container>
      </header>
      <main id="main" className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
