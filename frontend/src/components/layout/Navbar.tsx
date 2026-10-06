import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import logo from "@/assets/aurexion-logo.jpg";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Modal } from "@/components/ui/Modal";
import { PUBLIC_NAV } from "@/constants/navigation";
import { SITE } from "@/constants/site";
import { useCart } from "@/context/useCart";
import { useAuth } from "@/hooks/useAuth";
import { canOpenAdmin } from "@/types/auth";

function itemClass(isActive: boolean): string {
  return isActive
    ? "text-champagne-deep"
    : "text-night/75 hover:text-night";
}

export function Navbar() {
  const { isAuthenticated, roles, signOut } = useAuth();
  const { cart, setOpen: setCartOpen } = useCart();
  const count = cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const cartLabel = count > 0 ? `Cart (${count})` : "Cart";

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="surface-dark sticky top-0 z-40 border-b border-night/10">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-paper focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <Container className="flex min-h-20 items-center justify-between gap-3 py-3">
        <NavLink to="/" className="shrink-0" end>
          <img src={logo} alt={SITE.shortName} width={168} height={48} className="h-12 w-auto" />
        </NavLink>
        <nav className="hidden min-w-0 items-center gap-x-4 text-sm xl:flex 2xl:gap-x-6" aria-label="Primary">
          {PUBLIC_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `inline-flex min-h-11 items-center ${itemClass(isActive)}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-2 xl:flex">
          {isAuthenticated ? (
            <>
              {canOpenAdmin(roles) ? (
                <NavLink to="/admin" className="inline-flex min-h-11 items-center text-sm text-night/80 hover:text-night">
                  Admin
                </NavLink>
              ) : null}
              <NavLink to="/account" className="inline-flex min-h-11 items-center text-sm text-night/80 hover:text-night">
                Account
              </NavLink>
              <button type="button" className="inline-flex min-h-11 items-center text-sm text-night/70 hover:text-night" onClick={() => void signOut()}>
                Sign out
              </button>
            </>
          ) : (
            <NavLink to="/login" className="inline-flex min-h-11 items-center text-sm text-night/80 hover:text-night">
              Sign in
            </NavLink>
          )}
          <button type="button" className="inline-flex min-h-11 items-center text-sm text-night/80 hover:text-night" onClick={() => setCartOpen(true)}>
            {cartLabel}
          </button>
          <Button to="/custom-quote">Custom Quote</Button>
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center text-sm text-night xl:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen(true)}
        >
          Menu
        </button>
      </Container>
      <Modal open={menuOpen} title="Menu" onClose={() => setMenuOpen(false)}>
        <nav id="mobile-navigation" className="flex flex-col" aria-label="Mobile">
          {PUBLIC_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `flex min-h-12 items-center border-b border-night/10 text-lg ${itemClass(isActive)}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 flex flex-col items-start gap-3">
          <button
            type="button"
            className="inline-flex min-h-11 items-center text-night/80 hover:text-night"
            onClick={() => {
              setMenuOpen(false);
              setCartOpen(true);
            }}
          >
            {cartLabel}
          </button>
          <Button to="/custom-quote">Custom Quote</Button>
          {isAuthenticated ? (
            <>
              {canOpenAdmin(roles) ? (
                <NavLink to="/admin" className="inline-flex min-h-11 items-center text-night/80 hover:text-night">
                  Admin
                </NavLink>
              ) : null}
              <NavLink to="/account" className="inline-flex min-h-11 items-center text-night/80 hover:text-night">
                Account
              </NavLink>
              <button type="button" className="inline-flex min-h-11 items-center text-night/70 hover:text-night" onClick={() => void signOut()}>
                Sign out
              </button>
            </>
          ) : (
            <NavLink to="/login" className="inline-flex min-h-11 items-center text-night/80 hover:text-night">
              Sign in
            </NavLink>
          )}
        </div>
      </Modal>
    </header>
  );
}
