import { Link } from "react-router-dom";

import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { OrderSummary } from "@/components/shop/OrderSummary";
import { PageIntro } from "@/components/layout/PageIntro";
import { Container } from "@/components/ui/Container";
import { useCart } from "@/context/useCart";
import { usePageTitle } from "@/hooks/usePageTitle";

export function CheckoutPage() {
  usePageTitle("Checkout");
  const { cart, refresh } = useCart();
  const empty = !cart || cart.items.length === 0;

  return (
    <>
      <PageIntro eyebrow="Shop" title="Checkout" description="This creates your order and a pending payment. It does not store a card on this page." />
      <section className="bg-paper">
        <Container className="grid gap-10 py-16 lg:grid-cols-[1fr_0.8fr]">
          <CheckoutForm disabled={empty} />
          <div className="space-y-4">
            <OrderSummary cart={cart} />
            {empty ? (
              <Link to="/shop" className="text-sm font-semibold text-champagne-deep" onClick={() => void refresh()}>
                Return to the shop
              </Link>
            ) : null}
          </div>
        </Container>
      </section>
    </>
  );
}
