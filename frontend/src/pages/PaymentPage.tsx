import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { readCheckoutDraft } from "@/components/shop/CheckoutForm";
import { CheckoutSteps } from "@/components/shop/CheckoutSteps";
import { OrderSummary } from "@/components/shop/OrderSummary";
import { PageIntro } from "@/components/layout/PageIntro";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { useCart } from "@/context/useCart";
import { usePageTitle } from "@/hooks/usePageTitle";
import { checkout } from "@/services/shopService";
import { apiErrorMessage } from "@/utils/apiError";

export function PaymentPage() {
  usePageTitle("Payment");
  const navigate = useNavigate();
  const { cart, refresh } = useCart();
  const draft = readCheckoutDraft();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const empty = !cart || cart.items.length === 0;

  const pay = async () => {
    if (!draft || empty) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await checkout(draft);
      sessionStorage.removeItem("aurexion.checkout");
      await refresh();
      navigate(`/order-success?order=${result.order_id}&emailed=${result.email_sent ? "1" : "0"}`);
    } catch (reason) {
      setError(apiErrorMessage(reason, "The payment could not be started."));
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageIntro eyebrow="Shop" title="Payment" description="Review the total, then confirm the order. Card details are not stored on this page." />
      <section className="bg-paper">
        <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_0.8fr]">
          <div className="space-y-6">
            <CheckoutSteps current="Payment" />
            {!draft ? (
              <p className="text-sm leading-6 text-ink/75">
                Add your contact and address details first. <Link to="/checkout" className="font-semibold text-champagne-deep">Return to checkout</Link>
              </p>
            ) : (
              <div className="rounded-xl border border-line bg-white p-6">
                <p className="text-sm font-semibold">{draft.name}</p>
                <p className="mt-1 text-sm text-ink/70">{draft.email}</p>
                <p className="text-sm text-ink/70">{draft.phone}</p>
                <p className="mt-4 text-sm leading-6 text-ink/80">
                  {draft.shipping.line1}, {draft.shipping.city}, {draft.shipping.state} {draft.shipping.postal_code}
                </p>
                <p className="mt-6 text-sm leading-6 text-ink/75">
                  {cart?.items.some((item) => !item.is_downloadable) ? "This order includes a service or a physical delivery." : "Digital items are delivered by email after payment is recorded."} Payment stays pending until it is confirmed.
                </p>
                {error ? (
                  <p role="alert" className="mt-4 text-sm text-red-800">
                    {error}
                  </p>
                ) : null}
                <Button type="button" className="mt-6" tone="light" disabled={empty || submitting} onClick={() => void pay()}>
                  {submitting ? "Confirming payment" : "Pay now"}
                </Button>
              </div>
            )}
          </div>
          <OrderSummary cart={cart} />
        </Container>
      </section>
    </>
  );
}
