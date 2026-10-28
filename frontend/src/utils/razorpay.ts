const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayFailure = {
  error?: { description?: string };
};

export type RazorpayOptions = {
  key: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", callback: (response: RazorpayFailure) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let loading: Promise<void> | null = null;

export function loadRazorpay(): Promise<void> {
  if (window.Razorpay) {
    return Promise.resolve();
  }
  if (!loading) {
    loading = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        loading = null;
        script.remove();
        reject(new Error("Razorpay could not be loaded."));
      };
      document.body.appendChild(script);
    });
  }
  return loading;
}

export type RazorpayResult = { paid: RazorpaySuccess } | { paid: null; failure: string | null };

export function openRazorpay(options: Omit<RazorpayOptions, "handler" | "modal">): Promise<RazorpayResult> {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error("Razorpay could not be loaded."));
      return;
    }
    let settled = false;
    let failure: string | null = null;
    const checkout = new window.Razorpay({
      ...options,
      handler: (response) => {
        settled = true;
        resolve({ paid: response });
      },
      modal: {
        ondismiss: () => {
          if (!settled) {
            settled = true;
            resolve({ paid: null, failure });
          }
        },
      },
    });
    checkout.on("payment.failed", (response) => {
      failure = response.error?.description || "The payment failed.";
    });
    checkout.open();
  });
}
