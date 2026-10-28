import axios from "axios";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { SITE } from "@/constants/site";
import { startPayment, verifyPayment } from "@/services/shopService";
import { apiErrorMessage } from "@/utils/apiError";
import { formatMoney } from "@/utils/format";
import { loadRazorpay, openRazorpay } from "@/utils/razorpay";

type GatewayPaymentProps = {
  orderId: string;
  orderNumber: string;
  amount: string;
  currency: string;
  customer?: { name?: string | null; email?: string | null; phone?: string | null };
  autoStart?: boolean;
  onPaid: () => void;
};

export function GatewayPayment({ orderId, orderNumber, amount, currency, customer, autoStart = false, onPaid }: GatewayPaymentProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const total = formatMoney(amount, currency) ?? amount;

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      const session = await startPayment(orderId);
      if (!session.enabled || !session.reference || !session.publishable_key) {
        setError("Payment could not be started because no payment gateway is connected.");
        return;
      }
      await loadRazorpay();
      const result = await openRazorpay({
        key: session.publishable_key,
        order_id: session.reference,
        name: SITE.name,
        description: `Order ${orderNumber}`,
        prefill: {
          name: customer?.name ?? undefined,
          email: customer?.email ?? undefined,
          contact: customer?.phone ?? undefined,
        },
        theme: { color: "#c6a56a" },
      });
      if (!result.paid) {
        setError(result.failure ? `${result.failure} You can try again.` : "The payment was not completed. You can try again.");
        return;
      }
      await verifyPayment({ order_id: orderId, ...result.paid });
      onPaid();
    } catch (reason) {
      setError(
        !axios.isAxiosError(reason) && reason instanceof Error ? reason.message : apiErrorMessage(reason, "The payment could not be completed."),
      );
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      void pay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return (
    <div className="rounded-xl border border-line bg-white p-6">
      <h2 className="text-xl font-semibold">Complete the payment</h2>
      <p className="mt-2 text-sm leading-6 text-ink/75">
        Order {orderNumber} is placed. Pay {total} securely with Razorpay using UPI, card, or netbanking.
      </p>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <Button type="button" className="mt-6" tone="light" disabled={busy} onClick={() => void pay()}>
        {busy ? "Opening Razorpay" : `Pay ${total}`}
      </Button>
    </div>
  );
}
