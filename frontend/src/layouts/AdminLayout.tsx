import { Suspense } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

import { ADMIN_NAV } from "@/admin/resources";
import logo from "@/assets/aurexion-logo.jpg";
import { PageFallback } from "@/components/routing/PageFallback";
import { SITE } from "@/constants/site";
import { useAuth } from "@/hooks/useAuth";

export function AdminLayout() {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="surface-dark border-b border-night/10">
        <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <img src={logo} alt={SITE.shortName} width={168} height={48} className="h-12 w-auto max-w-[9rem]" />
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-champagne-deep">Admin</p>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <Link to="/" className="text-night/75 hover:text-night">
              Site
            </Link>
            <button type="button" className="min-h-11 text-night/75 hover:text-night" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <nav aria-label="Admin" className="border-b border-line bg-white lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
          <ul className="flex gap-1 overflow-x-auto p-3 lg:flex-col">
            {ADMIN_NAV.map((item) => (
              <li key={item.to} className="shrink-0">
                <NavLink
                  to={item.to}
                  end={"end" in item ? item.end : false}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center whitespace-nowrap rounded-md px-3 text-sm ${isActive ? "bg-night text-white" : "text-ink/80 hover:bg-paper"}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <main id="main" className="min-w-0 flex-1">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
