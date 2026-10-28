import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ManualPayment } from "@/components/shop/ManualPayment";

describe("manual payment", () => {
  it("shows the Razorpay link and UPI ID for a placed order", () => {
    render(
      <ManualPayment
        orderNumber="AX-55FF558C"
        amount="2499.00"
        currency="INR"
        paymentLink="https://razorpay.me/@aurexiondigitalprivatelimited"
        upiId="aurexiondigital212553.rzp@rxairtel"
      />,
    );

    expect(screen.getByRole("link", { name: /with Razorpay/ })).toHaveAttribute("href", "https://razorpay.me/@aurexiondigitalprivatelimited");
    expect(screen.getByText("aurexiondigital212553.rzp@rxairtel")).toBeInTheDocument();
    const upi = screen.getByRole("link", { name: "Open UPI app" }).getAttribute("href") ?? "";
    expect(upi.startsWith("upi://pay?")).toBe(true);
    expect(upi).toContain("am=2499.00");
    expect(upi).toContain("tn=AX-55FF558C");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
