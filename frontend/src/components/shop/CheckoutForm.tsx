import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { useAuth } from "@/hooks/useAuth";
import type { CheckoutAddress, CheckoutDetails } from "@/services/shopService";

const DRAFT_KEY = "aurexion.checkout";

const emptyAddress = (): CheckoutAddress => ({
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
});

export function readCheckoutDraft(): CheckoutDetails | null {
  const raw = sessionStorage.getItem(DRAFT_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as CheckoutDetails;
  } catch {
    return null;
  }
}

export function CheckoutForm({ disabled = false }: { disabled?: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const saved = readCheckoutDraft();
  const [name, setName] = useState(saved?.name ?? user?.full_name ?? "");
  const [email, setEmail] = useState(saved?.email ?? user?.email ?? "");
  const [phone, setPhone] = useState(saved?.phone ?? user?.phone ?? "");
  const [shipping, setShipping] = useState<CheckoutAddress>(saved?.shipping ?? emptyAddress());
  const [billing, setBilling] = useState<CheckoutAddress>(saved?.billing ?? emptyAddress());
  const [sameBilling, setSameBilling] = useState(saved?.billing_same_as_shipping ?? true);
  const [error, setError] = useState<string | null>(null);

  const setShip = (key: keyof CheckoutAddress, value: string) => {
    setShipping((current) => ({ ...current, [key]: value }));
  };
  const setBill = (key: keyof CheckoutAddress, value: string) => {
    setBilling((current) => ({ ...current, [key]: value }));
  };

  const onSubmit = () => {
    if (name.trim().length < 2 || !email.includes("@") || phone.trim().length < 8) {
      setError("Enter your name, a valid email, and a phone number.");
      return;
    }
    if (!shipping.line1.trim() || !shipping.city.trim() || !shipping.state.trim() || !shipping.postal_code.trim()) {
      setError("Enter the shipping address, city, state, and postal code.");
      return;
    }
    if (!sameBilling && (!billing.line1.trim() || !billing.city.trim() || !billing.state.trim() || !billing.postal_code.trim())) {
      setError("Enter the billing address, or use the shipping address.");
      return;
    }
    const details: CheckoutDetails = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      shipping: { ...shipping, country: shipping.country.trim() || "India" },
      billing: sameBilling ? null : { ...billing, country: billing.country.trim() || "India" },
      billing_same_as_shipping: sameBilling,
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(details));
    navigate("/payment");
  };

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Contact</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput label="Full name" name="name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
          <FormInput label="Email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          <FormInput label="Phone" name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" required />
        </div>
      </fieldset>
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Shipping address</legend>
        <FormInput label="Address" name="ship-line1" value={shipping.line1} onChange={(event) => setShip("line1", event.target.value)} autoComplete="address-line1" required />
        <FormInput label="Apartment, floor (optional)" name="ship-line2" value={shipping.line2} onChange={(event) => setShip("line2", event.target.value)} autoComplete="address-line2" />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput label="City" name="ship-city" value={shipping.city} onChange={(event) => setShip("city", event.target.value)} autoComplete="address-level2" required />
          <FormInput label="State" name="ship-state" value={shipping.state} onChange={(event) => setShip("state", event.target.value)} autoComplete="address-level1" required />
          <FormInput label="Postal code" name="ship-postal" value={shipping.postal_code} onChange={(event) => setShip("postal_code", event.target.value)} autoComplete="postal-code" required />
          <FormInput label="Country" name="ship-country" value={shipping.country} onChange={(event) => setShip("country", event.target.value)} autoComplete="country-name" required />
        </div>
      </fieldset>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" checked={sameBilling} onChange={(event) => setSameBilling(event.target.checked)} />
        Billing address is the same as shipping
      </label>
      {sameBilling ? null : (
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">Billing address</legend>
          <FormInput label="Address" name="bill-line1" value={billing.line1} onChange={(event) => setBill("line1", event.target.value)} autoComplete="billing address-line1" required />
          <FormInput label="Apartment, floor (optional)" name="bill-line2" value={billing.line2} onChange={(event) => setBill("line2", event.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput label="City" name="bill-city" value={billing.city} onChange={(event) => setBill("city", event.target.value)} required />
            <FormInput label="State" name="bill-state" value={billing.state} onChange={(event) => setBill("state", event.target.value)} required />
            <FormInput label="Postal code" name="bill-postal" value={billing.postal_code} onChange={(event) => setBill("postal_code", event.target.value)} required />
            <FormInput label="Country" name="bill-country" value={billing.country} onChange={(event) => setBill("country", event.target.value)} required />
          </div>
        </fieldset>
      )}
      {error ? (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <Button type="submit" tone="light" disabled={disabled}>
        Continue to payment
      </Button>
    </form>
  );
}
