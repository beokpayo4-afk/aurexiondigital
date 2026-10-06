import { Link } from "react-router-dom";

import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { CheckoutSteps } from "@/components/shop/CheckoutSteps";
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
      <PageIntro eyebrow="Shop" title="Checkout" description="Your name, email, phone, and addresses are saved with the order. Payment is the next step." />
      <section className="bg-paper">
        <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_0.8fr]">
          <div className="space-y-8">
            <CheckoutSteps current="Checkout" />
            <CheckoutForm disabled={empty} />
          </div>
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
