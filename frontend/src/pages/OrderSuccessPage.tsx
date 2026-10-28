import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { GatewayPayment } from "@/components/shop/GatewayPayment";
import { ManualPayment } from "@/components/shop/ManualPayment";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { downloadOrderItem, getOrder, getPaymentConfig, listOrderDownloads } from "@/services/shopService";
import { formatMoney } from "@/utils/format";
import { apiErrorMessage } from "@/utils/apiError";

export function OrderSuccessPage() {
  const [params] = useSearchParams();
  const orderId = params.get("order") ?? "";
  usePageTitle("Order");
  const order = useAsyncData(() => getOrder(orderId), [orderId]);
  const downloads = useAsyncData(() => (orderId ? listOrderDownloads(orderId) : Promise.resolve([])), [orderId]);
  const paymentConfig = useAsyncData(() => getPaymentConfig(), []);
  const gateway = Boolean(paymentConfig.data?.enabled);
  const manualPayment =
    paymentConfig.data && !gateway && (paymentConfig.data.payment_link || paymentConfig.data.upi_id) ? paymentConfig.data : null;
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const status = order.data?.status;
  const paid = status === "paid" || status === "fulfilled";
  const heading = paid ? "Payment successful" : status === "pending" ? "Complete the payment" : "Order confirmation";
  const onPaid = () => {
    order.reload();
    downloads.reload();
  };

  if (!orderId) {
    return (
      <Container className="py-20">
        <EmptyState title="No order was selected" description="Open an order from your account." />
      </Container>
    );
  }

  return (
    <Container className="py-16 sm:py-20">
      <h1 className="font-display text-5xl">{heading}</h1>
      {order.loading ? <LoadingState label="Loading order" /> : null}
      {order.error ? <ErrorState message={order.error} onRetry={order.reload} /> : null}
      {order.data ? (
        <div className="mt-8 max-w-2xl">
          <p className="text-sm text-ink/75">
            {order.data.order_number} · {order.data.status} · {formatMoney(order.data.total, order.data.currency)}
          </p>
          {paid ? (
            <p role="status" className="mt-4 rounded-xl border border-line bg-white p-4 text-sm font-semibold text-ink">
              Payment of {formatMoney(order.data.total, order.data.currency)} received for order {order.data.order_number}.
            </p>
          ) : null}
          {params.get("emailed") === "1" ? (
            <p className="mt-4 text-sm leading-6 text-ink/75">A confirmation email was sent to {order.data.customer_email}.</p>
          ) : (
            <p className="mt-4 text-sm leading-6 text-ink/75">
              This page is your confirmation{order.data.customer_email ? ` for ${order.data.customer_email}` : ""}. Email delivery needs SMTP settings on the server.
            </p>
          )}
          {order.data.ship_line1 ? (
            <p className="mt-4 text-sm leading-6 text-ink/75">
              Shipping: {order.data.ship_line1}, {order.data.ship_city}, {order.data.ship_state} {order.data.ship_postal_code}
            </p>
          ) : null}
          {order.data.items && order.data.items.length > 0 ? (
            <ul className="mt-6 space-y-2 text-sm">
              {order.data.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 border-t border-line py-2">
                  <span>
                    {item.name_snapshot} × {item.quantity}
                  </span>
                  <span>{formatMoney(item.line_total, order.data?.currency ?? "INR")}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {order.data.status === "pending" && gateway ? (
            <div className="mt-6">
              <GatewayPayment
                orderId={order.data.id}
                orderNumber={order.data.order_number}
                amount={order.data.total}
                currency={order.data.currency}
                customer={{ name: order.data.customer_name, email: order.data.customer_email, phone: order.data.customer_phone }}
                autoStart={params.get("pay") === "1"}
                onPaid={onPaid}
              />
            </div>
          ) : null}
          {order.data.status === "pending" && manualPayment ? (
            <div className="mt-6">
              <ManualPayment
                orderNumber={order.data.order_number}
                amount={order.data.total}
                currency={order.data.currency}
                paymentLink={manualPayment.payment_link}
                upiId={manualPayment.upi_id}
              />
            </div>
          ) : null}
          {order.data.status === "pending" && !gateway && !manualPayment && !paymentConfig.loading ? (
            <p className="mt-4 text-sm leading-6 text-ink/75">
              Payment is still pending. A digital download stays locked until the payment gateway confirms success.
            </p>
          ) : null}
          <h2 className="mt-10 font-display text-3xl">Downloads</h2>
          {downloads.loading ? <LoadingState label="Loading downloads" /> : null}
          {downloads.data && downloads.data.length === 0 ? (
            <p className="mt-3 text-sm text-ink/70">This order has no digital download.</p>
          ) : null}
          <ul className="mt-4 space-y-3">
            {downloads.data?.map((item) => (
              <li key={item.order_item_id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3">
                <span className="text-sm">{item.name}</span>
                {item.available ? (
                  <button
                    type="button"
                    className="min-h-11 text-sm font-semibold text-champagne-deep"
                    onClick={() => {
                      setDownloadError(null);
                      downloadOrderItem(orderId, item.order_item_id).catch((reason: unknown) => {
                        setDownloadError(apiErrorMessage(reason, "The download is not available."));
                      });
                    }}
                  >
                    Download
                  </button>
                ) : (
                  <span className="text-sm text-ink/60">Available after successful payment</span>
                )}
              </li>
            ))}
          </ul>
          {downloadError ? (
            <p role="alert" className="mt-3 text-sm text-red-800">
              {downloadError}
            </p>
          ) : null}
          <Link to="/orders" className="mt-8 inline-flex min-h-11 items-center text-sm font-semibold text-champagne-deep">
            Order history
          </Link>
        </div>
      ) : null}
    </Container>
  );
}
