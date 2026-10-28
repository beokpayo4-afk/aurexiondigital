import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { readCheckoutDraft } from "@/components/shop/CheckoutForm";
import { CheckoutSteps } from "@/components/shop/CheckoutSteps";
import { ManualPayment } from "@/components/shop/ManualPayment";
import { OrderSummary } from "@/components/shop/OrderSummary";
import { PageIntro } from "@/components/layout/PageIntro";
import { PolicyAcceptance } from "@/components/legal/PolicyAcceptance";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { useCart } from "@/context/useCart";
import { usePageTitle } from "@/hooks/usePageTitle";
import { checkout, type CheckoutResult } from "@/services/shopService";
import { apiErrorMessage } from "@/utils/apiError";

export function PaymentPage() {
  usePageTitle("Payment");
  const navigate = useNavigate();
  const { cart, refresh } = useCart();
  const draft = readCheckoutDraft();
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<CheckoutResult | null>(null);
  const empty = !cart || cart.items.length === 0;

  const pay = async () => {
    if (!draft || empty || !accepted) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await checkout(draft);
      await refresh();
      if (!result.payment.enabled && !result.payment.payment_link && !result.payment.upi_id) {
        setError("Payment could not be started because no payment gateway is connected.");
        setSubmitting(false);
        return;
      }
      sessionStorage.removeItem("aurexion.checkout");
      if (result.payment.enabled) {
        navigate(`/order-success?order=${result.order_id}&pay=1&emailed=${result.email_sent ? "1" : "0"}`);
        return;
      }
      setPlaced(result);
      setSubmitting(false);
    } catch (reason) {
      const message = apiErrorMessage(reason, "The payment could not be started.");
      setError(message);
      if (message === "The cart is empty") {
        await refresh();
      }
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
            {placed ? (
              <>
                <ManualPayment
                  orderNumber={placed.order_number}
                  amount={placed.total}
                  currency={placed.currency}
                  paymentLink={placed.payment.payment_link}
                  upiId={placed.payment.upi_id}
                />
                <Link to={`/order-success?order=${placed.order_id}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-champagne-deep">
                  View order {placed.order_number}
                </Link>
              </>
            ) : !draft ? (
              <p className="text-sm leading-6 text-ink/75">
                Add your contact and address details first. <Link to="/checkout" className="font-semibold text-champagne-deep">Return to checkout</Link>
              </p>
            ) : (
              <div className="rounded-xl border border-line bg-white p-6">
                <h2 className="text-sm font-semibold">Customer</h2>
                <p className="mt-2 text-sm text-ink/80">{draft.name}</p>
                <p className="text-sm text-ink/70">{draft.email}</p>
                <p className="text-sm text-ink/70">{draft.phone}</p>
                <h2 className="mt-6 text-sm font-semibold">Billing</h2>
                <p className="mt-2 text-sm leading-6 text-ink/80">
                  {draft.shipping.line1}, {draft.shipping.city}, {draft.shipping.state} {draft.shipping.postal_code}
                </p>
                <p className="mt-6 text-sm leading-6 text-ink/75">
                  {cart?.items.some((item) => !item.is_downloadable) ? "This order includes a service or a physical delivery." : "Digital items are delivered by email after payment is recorded."} Payment stays pending until it is confirmed.
                </p>
                <PolicyAcceptance id="payment-policy-acceptance" checked={accepted} onChange={setAccepted} />
                {error ? (
                  <p role="alert" className="mt-4 text-sm text-red-800">
                    {error}
                  </p>
                ) : null}
                <Button type="button" className="mt-6" tone="light" disabled={empty || submitting || !accepted} onClick={() => void pay()}>
                  {submitting ? "Confirming payment" : "Pay now"}
                </Button>
              </div>
            )}
          </div>
          {placed ? (
            <OrderSummary orderNumber={placed.order_number} total={placed.total} currency={placed.currency} status={placed.status} />
          ) : (
            <OrderSummary cart={cart} />
          )}
        </Container>
      </section>
    </>
  );
}
