import { useState } from "react";

import { SITE } from "@/constants/site";
import { formatMoney } from "@/utils/format";
import { safeUrl } from "@/utils/safeUrl";

type ManualPaymentProps = {
  orderNumber: string;
  amount: string;
  currency: string;
  paymentLink?: string | null;
  upiId?: string | null;
};

function upiHref(upiId: string, amount: string, orderNumber: string) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: SITE.name,
    am: Number(amount).toFixed(2),
    cu: "INR",
    tn: orderNumber,
  });
  return `upi://pay?${params.toString()}`;
}

export function ManualPayment({ orderNumber, amount, currency, paymentLink, upiId }: ManualPaymentProps) {
  const [copied, setCopied] = useState(false);
  const link = paymentLink ? safeUrl(paymentLink) : null;
  const total = formatMoney(amount, currency) ?? amount;

  const copyUpi = async () => {
    if (!upiId) {
      return;
    }
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-white p-6">
      <h2 className="text-xl font-semibold">Complete the payment</h2>
      <p className="mt-2 text-sm leading-6 text-ink/75">
        Order {orderNumber} is placed. Pay {total} with Razorpay or any UPI app, and write {orderNumber} in the payment note.
      </p>
      <div className="mt-6 space-y-5">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-champagne px-5 text-sm font-semibold text-night hover:bg-[#d4b67d]"
          >
            Pay {total} with Razorpay
          </a>
        ) : null}
        {upiId ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-champagne-deep">UPI ID</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <span className="break-all text-sm font-semibold text-ink">{upiId}</span>
              <button type="button" className="min-h-11 text-sm font-semibold text-champagne-deep" onClick={() => void copyUpi()}>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <a href={upiHref(upiId, amount, orderNumber)} className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-champagne-deep">
              Open UPI app
            </a>
          </div>
        ) : null}
        <p className="text-sm leading-6 text-ink/70">
          The order is marked paid after the payment is confirmed. Digital downloads and course access open after that.
        </p>
      </div>
    </div>
  );
}
