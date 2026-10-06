import { Link } from "react-router-dom";

import { CartItem } from "@/components/shop/CartItem";
import { useCart } from "@/context/useCart";

type CartDrawerProps = {
  tone?: "dark" | "light";
};

export function CartDrawer({ tone = "dark" }: CartDrawerProps) {
  const { cart, open, setOpen, update, remove } = useCart();
  if (!open) {
    return null;
  }
  const link = tone === "dark" ? "text-night" : "text-ink";

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-[#0b1826]/80" aria-label="Close cart" onClick={() => setOpen(false)} />
      <aside className="surface-dark absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-night/10 px-5 py-5 sm:px-6 sm:py-6" aria-label="Cart">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl">Cart</h2>
          <button type="button" className="min-h-11 text-sm text-night/80" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
        <div className="mt-6 flex-1 overflow-y-auto rounded-xl bg-paper px-4 text-ink">
          {cart && cart.items.length > 0 ? (
            cart.items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onQuantity={(quantity) => void update(item.id, quantity)}
                onRemove={() => void remove(item.id)}
              />
            ))
          ) : (
            <p className="py-4 text-sm text-ink/70">The cart is empty.</p>
          )}
        </div>
        <Link to="/cart" className={`mt-6 inline-flex min-h-11 items-center text-sm font-semibold ${link}`} onClick={() => setOpen(false)}>
          Review cart
        </Link>
      </aside>
    </div>
  );
}
