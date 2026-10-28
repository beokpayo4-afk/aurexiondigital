import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GatewayPayment } from "@/components/shop/GatewayPayment";
import { startPayment, verifyPayment } from "@/services/shopService";
import type { RazorpayOptions } from "@/utils/razorpay";

vi.mock("@/services/shopService", () => ({
  startPayment: vi.fn(),
  verifyPayment: vi.fn(),
}));

type Handlers = { options?: RazorpayOptions; failed?: (response: { error?: { description?: string } }) => void };

function installRazorpay(onOpen: (handlers: Handlers) => void) {
  const handlers: Handlers = {};
  window.Razorpay = class {
    constructor(options: RazorpayOptions) {
      handlers.options = options;
    }
    on(_event: "payment.failed", callback: Handlers["failed"]) {
      handlers.failed = callback;
    }
    open() {
      onOpen(handlers);
    }
  } as unknown as Window["Razorpay"];
}

const session = {
  enabled: true,
  provider: "razorpay",
  publishable_key: "rzp_test_key",
  currency: "INR",
  status: "pending",
  reference: "order_abc123",
};

describe("gateway payment", () => {
  afterEach(() => {
    delete window.Razorpay;
    vi.clearAllMocks();
  });

  it("verifies a Razorpay payment and reports success", async () => {
    vi.mocked(startPayment).mockResolvedValue(session);
    vi.mocked(verifyPayment).mockResolvedValue({ order_id: "order-1", order_number: "AX-1", status: "paid" });
    installRazorpay(({ options }) => {
      expect(options?.key).toBe("rzp_test_key");
      expect(options?.order_id).toBe("order_abc123");
      options?.handler({ razorpay_order_id: "order_abc123", razorpay_payment_id: "pay_1", razorpay_signature: "sig" });
    });
    const onPaid = vi.fn();
    const user = userEvent.setup();
    render(<GatewayPayment orderId="order-1" orderNumber="AX-1" amount="2499.00" currency="INR" onPaid={onPaid} />);

    await user.click(screen.getByRole("button", { name: /Pay/ }));
    await waitFor(() => expect(onPaid).toHaveBeenCalled());
    expect(verifyPayment).toHaveBeenCalledWith({
      order_id: "order-1",
      razorpay_order_id: "order_abc123",
      razorpay_payment_id: "pay_1",
      razorpay_signature: "sig",
    });
  });

  it("shows an error when the customer closes Razorpay after a failed attempt", async () => {
    vi.mocked(startPayment).mockResolvedValue(session);
    installRazorpay(({ options, failed }) => {
      failed?.({ error: { description: "Payment declined." } });
      options?.modal?.ondismiss?.();
    });
    const onPaid = vi.fn();
    const user = userEvent.setup();
    render(<GatewayPayment orderId="order-1" orderNumber="AX-1" amount="2499.00" currency="INR" onPaid={onPaid} />);

    await user.click(screen.getByRole("button", { name: /Pay/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Payment declined. You can try again.");
    expect(onPaid).not.toHaveBeenCalled();
    expect(verifyPayment).not.toHaveBeenCalled();
  });
});
