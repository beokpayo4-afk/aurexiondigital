import type { Cart } from "@/services/shopService";
import { formatMoney } from "@/utils/format";

type OrderSummaryProps = {
  cart?: Cart | null;
  orderNumber?: string;
  total?: string;
  currency?: string;
  status?: string;
};

export function OrderSummary({ cart, orderNumber, total, currency = "INR", status }: OrderSummaryProps) {
  const amount = cart ? cart.subtotal : total;
  const code = cart ? cart.currency : currency;

  return (
    <div className="rounded-xl border border-line bg-white p-6 shadow-card">
      <h2 className="font-display text-3xl">Order summary</h2>
      {orderNumber ? <p className="mt-3 text-sm text-ink/70">Order {orderNumber}</p> : null}
      {status ? <p className="mt-1 text-sm capitalize text-ink/70">{status}</p> : null}
      {cart ? (
        <ul className="mt-4 space-y-2 text-sm text-ink/80">
          {cart.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{formatMoney(item.line_total, item.currency)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-6 text-sm font-semibold text-ink">Total {formatMoney(amount, code)}</p>
      {cart ? <p className="mt-2 text-sm leading-6 text-ink/70">No separate tax is added on this page.</p> : null}
    </div>
  );
}
