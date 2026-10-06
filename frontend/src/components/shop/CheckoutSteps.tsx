import { Link } from "react-router-dom";

const STEPS = [
  { to: "/cart", label: "Cart" },
  { to: "/checkout", label: "Checkout" },
  { to: "/payment", label: "Payment" },
  { to: "/order-success", label: "Confirmation" },
];

export function CheckoutSteps({ current }: { current: "Cart" | "Checkout" | "Payment" | "Confirmation" }) {
  return (
    <ol className="flex flex-wrap gap-2 text-sm">
      {STEPS.map((step, index) => {
        const active = step.label === current;
        return (
          <li key={step.label} className="flex items-center gap-2">
            {index > 0 ? <span className="text-ink/30">/</span> : null}
            {active ? (
              <span className="font-semibold text-night">{step.label}</span>
            ) : (
              <Link to={step.to} className="text-ink/60 hover:text-night">
                {step.label}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
