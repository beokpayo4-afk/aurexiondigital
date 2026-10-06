import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/useCart";
import { checkout } from "@/services/shopService";
import { apiErrorMessage } from "@/utils/apiError";

type CheckoutFormProps = {
  disabled?: boolean;
};

export function CheckoutForm({ disabled = false }: CheckoutFormProps) {
  const navigate = useNavigate();
  const { refresh } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await checkout();
      await refresh();
      navigate(`/order-success?order=${result.order_id}`);
    } catch (reason) {
      setError(apiErrorMessage(reason, "The order could not be created."));
      setSubmitting(false);
    }
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <p className="text-sm leading-6 text-ink/75">
        Placing the order creates a pending payment. The gateway publishable key is used only when payment is configured. The secret key stays on the server.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <Button type="submit" tone="light" disabled={disabled || submitting}>
        {submitting ? "Placing order" : "Place order"}
      </Button>
    </form>
  );
}
