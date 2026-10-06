import type { CartItem as CartLine } from "@/services/shopService";
import { formatMoney } from "@/utils/format";

type CartItemProps = {
  item: CartLine;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
};

export function CartItem({ item, onQuantity, onRemove }: CartItemProps) {
  return (
    <div className="border-t border-line py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-ink">{item.name}</p>
          <p className="mt-1 text-sm text-ink/70">{formatMoney(item.unit_price, item.currency)}</p>
        </div>
        <button type="button" className="min-h-11 text-sm text-ink/60" onClick={onRemove}>
          Remove
        </button>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" className="min-h-11 min-w-11 border border-line" onClick={() => onQuantity(Math.max(1, item.quantity - 1))} aria-label={`Decrease ${item.name}`}>
          −
        </button>
        <span className="min-w-8 text-center text-sm">{item.quantity}</span>
        <button type="button" className="min-h-11 min-w-11 border border-line" onClick={() => onQuantity(Math.min(99, item.quantity + 1))} aria-label={`Increase ${item.name}`}>
          +
        </button>
        <p className="ml-auto text-sm font-semibold">{formatMoney(item.line_total, item.currency)}</p>
      </div>
    </div>
  );
}
