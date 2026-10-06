import { api } from "@/api/client";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatMoney } from "@/utils/format";

type CountItem = { label: string; value: number };

type AdminSummary = {
  customers: number;
  students: number;
  products: number;
  courses: number;
  orders: number;
  enquiries: number;
  quote_requests: number;
  revenue: string | null;
  revenue_currency: string | null;
  orders_by_status: CountItem[];
  quotes_by_status: CountItem[];
  enquiries_by_status: CountItem[];
};

const CARDS: { key: keyof AdminSummary; label: string }[] = [
  { key: "customers", label: "Customers" },
  { key: "students", label: "Students" },
  { key: "products", label: "Products" },
  { key: "courses", label: "Courses" },
  { key: "orders", label: "Orders" },
  { key: "enquiries", label: "Enquiries" },
  { key: "quote_requests", label: "Quote requests" },
];

function Bars({ title, items }: { title: string; items: CountItem[] }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-card">
      <h2 className="font-display text-3xl">{title}</h2>
      {items.length === 0 ? <p className="mt-4 text-sm text-ink/70">No records yet.</p> : null}
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="capitalize">{item.label.replace(/_/g, " ")}</span>
              <span>{item.value}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-paper">
              <div className="h-2 rounded-full bg-champagne" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AdminPage() {
  usePageTitle("Admin");
  const { user } = useAuth();
  const summary = useAsyncData(() => api.get<AdminSummary>("/admin/summary").then((response) => response.data), []);
  const revenue =
    summary.data?.revenue == null || summary.data.revenue_currency == null
      ? "Unavailable"
      : formatMoney(String(summary.data.revenue), summary.data.revenue_currency) ?? String(summary.data.revenue);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl sm:text-5xl">Dashboard</h1>
      <p className="mt-3 text-sm text-ink/75">Signed in as {user?.full_name}.</p>
      <div className="mt-8">
        {summary.loading ? <LoadingState label="Loading dashboard" /> : null}
        {summary.error ? <ErrorState message={summary.error} onRetry={summary.reload} /> : null}
      </div>
      {summary.data ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {CARDS.map((card) => (
              <article key={card.key} className="rounded-xl border border-line bg-white p-5 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/55">{card.label}</p>
                <p className="mt-3 break-words font-display text-4xl leading-tight">{String(summary.data?.[card.key] ?? 0)}</p>
              </article>
            ))}
            <article className="rounded-xl border border-line bg-white p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/55">Revenue</p>
              <p className="mt-3 break-words font-display text-4xl leading-tight">{revenue}</p>
              {summary.data.revenue == null ? (
                <p className="mt-2 text-xs text-ink/60">Paid orders use more than one currency, so a single total is not shown.</p>
              ) : (
                <p className="mt-2 text-xs text-ink/60">Paid and fulfilled orders.</p>
              )}
            </article>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <Bars title="Orders" items={summary.data.orders_by_status} />
            <Bars title="Enquiries" items={summary.data.enquiries_by_status} />
            <Bars title="Quote requests" items={summary.data.quotes_by_status} />
          </div>
        </>
      ) : null}
    </div>
  );
}
