import { Link } from "react-router-dom";

import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { listOrders } from "@/services/catalogService";
import { canOpenAdmin } from "@/types/auth";
import { formatDate, formatMoney } from "@/utils/format";

export function AccountPage() {
  usePageTitle("Account");
  const { user } = useAuth();
  const orders = useAsyncData(() => listOrders(), [user?.id]);

  return (
    <Container className="py-16 sm:py-20">
      <h1 className="font-display text-5xl">Account</h1>
      <p className="mt-4 text-sm leading-6 text-ink/75">{user?.email}</p>
      <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {canOpenAdmin(user?.roles ?? []) ? (
          <Link to="/admin" className="font-semibold text-champagne-deep">
            Admin dashboard
          </Link>
        ) : null}
        <Link to="/orders" className="font-semibold text-champagne-deep">
          Order history
        </Link>
      </p>
      <h2 className="mt-12 font-display text-4xl">Orders</h2>
      <div className="mt-6">
        {orders.loading ? <LoadingState label="Loading orders" /> : null}
        {orders.error ? <ErrorState message={orders.error} onRetry={orders.reload} /> : null}
        {!orders.loading && !orders.error && orders.data?.length === 0 ? (
          <EmptyState title="No orders yet" description="Orders placed with this account will be listed here." />
        ) : null}
        {orders.data && orders.data.length > 0 ? (
          <ul className="divide-y divide-line border-y border-line">
            {orders.data.map((order) => (
              <li key={order.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
                <div>
                  <Link to={`/order-success?order=${order.id}`} className="font-semibold text-champagne-deep">
                    {order.order_number}
                  </Link>
                  <p className="text-sm text-ink/65">{formatDate(order.placed_at)}</p>
                </div>
                <p className="text-sm">
                  {order.status}
                  {formatMoney(order.total, order.currency) ? ` · ${formatMoney(order.total, order.currency)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Container>
  );
}
