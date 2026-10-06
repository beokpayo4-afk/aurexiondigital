import { Link } from "react-router-dom";

import { CartItem } from "@/components/shop/CartItem";
import { CheckoutSteps } from "@/components/shop/CheckoutSteps";
import { OrderSummary } from "@/components/shop/OrderSummary";
import { PageIntro } from "@/components/layout/PageIntro";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { useCart } from "@/context/useCart";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";

export function CartPage() {
  usePageTitle("Cart");
  const { cart, update, remove } = useCart();
  const { isAuthenticated } = useAuth();
  const empty = !cart || cart.items.length === 0;

  return (
    <>
      <PageIntro eyebrow="Shop" title="Cart" description="Change quantities before checkout. Checkout requires an account." />
      <section className="bg-paper">
        <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <CheckoutSteps current="Cart" />
            {empty ? <p className="text-sm text-ink/75">The cart is empty.</p> : null}
            {cart?.items.map((item) => (
              <CartItem key={item.id} item={item} onQuantity={(quantity) => void update(item.id, quantity)} onRemove={() => void remove(item.id)} />
            ))}
          </div>
          <div className="space-y-6">
            <OrderSummary cart={cart} />
            {empty ? null : isAuthenticated ? (
              <Button to="/checkout" tone="light">
                Checkout
              </Button>
            ) : (
              <Link to="/login" state={{ from: "/checkout" }} className="inline-flex min-h-11 items-center text-sm font-semibold text-champagne-deep">
                Sign in to checkout
              </Link>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
