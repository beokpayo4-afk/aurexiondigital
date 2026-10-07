import { Link } from "react-router-dom";

type PolicyAcceptanceProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
};

export function PolicyAcceptance({ checked, onChange, id = "policy-acceptance" }: PolicyAcceptanceProps) {
  return (
    <div className="mt-6 flex items-start gap-3 text-sm leading-6 text-ink/80">
      <input
        id={id}
        className="mt-1"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <p>
        <label htmlFor={id}>I agree to the </label>
        <Link className="font-semibold text-champagne-deep" to="/terms">
          Terms & Conditions
        </Link>
        ,{" "}
        <Link className="font-semibold text-champagne-deep" to="/privacy">
          Privacy Policy
        </Link>
        , and{" "}
        <Link className="font-semibold text-champagne-deep" to="/refunds">
          Refund & Cancellation Policy
        </Link>
        .
      </p>
    </div>
  );
}
