import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FormInput } from "@/components/ui/FormInput";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { listQuoteRequests, updateQuoteRequest, type QuoteRequest } from "@/services/leadService";
import { apiErrorMessage } from "@/utils/apiError";
import { formatDate } from "@/utils/format";

const STATUSES = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "quoted", label: "Quoted" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "closed", label: "Closed" },
];

export function AdminQuotesPage() {
  usePageTitle("Quote requests");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const quotes = useAsyncData(() => listQuoteRequests({ page, q: search, status: statusFilter }), [page, search, statusFilter]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState("new");
  const [responseMessage, setResponseMessage] = useState("");
  const [responseAmount, setResponseAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const selected = quotes.data?.items.find((quote) => quote.id === selectedId) ?? null;
  const pageCount = quotes.data ? Math.max(1, Math.ceil(quotes.data.total / quotes.data.page_size)) : 1;

  const choose = (quote: QuoteRequest) => {
    setSelectedId(quote.id);
    setStatus(quote.status);
    setResponseMessage(quote.response_message ?? "");
    setResponseAmount(quote.response_amount ?? "");
    setNotice(null);
    setSaveError(null);
  };

  const save = async () => {
    if (!selected) {
      return;
    }
    setSaving(true);
    setNotice(null);
    setSaveError(null);
    try {
      const updated = await updateQuoteRequest(selected.id, {
        status,
        response_message: responseMessage.trim(),
        response_amount: responseAmount.trim(),
      });
      setNotice("Quote request updated.");
      setStatus(updated.status);
      quotes.reload();
    } catch (error) {
      setSaveError(apiErrorMessage(error, "The quote request could not be updated."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl">Quote requests</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/75">Custom campaign requests submitted from the public form.</p>
      <form
        className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch(query.trim());
        }}
      >
        <FormInput label="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select
          label="Status"
          options={STATUSES}
          value={statusFilter}
          placeholder="All"
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
        />
        <Button type="submit">Search</Button>
      </form>
      <div className="mt-8">
        {quotes.loading ? <LoadingState label="Loading quote requests" /> : null}
        {quotes.error ? <ErrorState message={quotes.error} onRetry={quotes.reload} /> : null}
        {!quotes.loading && !quotes.error && quotes.data?.items.length === 0 ? (
          <EmptyState title="No quote requests" description="Requests appear here after someone submits the custom quote form." />
        ) : null}
      </div>
      {quotes.data && quotes.data.items.length > 0 ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div>
          <ul className="divide-y divide-line border-y border-line">
            {quotes.data.items.map((quote) => (
              <li key={quote.id}>
                <button type="button" className="flex w-full min-h-11 flex-col items-start py-4 text-left" onClick={() => choose(quote)}>
                  <span className="font-semibold">{quote.organization || quote.name}</span>
                  <span className="text-sm text-ink/65">
                    {quote.status} · {formatDate(quote.created_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <p>
              Page {quotes.data.page} of {pageCount}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" tone="light" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                Previous
              </Button>
              <Button type="button" variant="secondary" tone="light" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>
                Next
              </Button>
            </div>
          </div>
          </div>
          {selected ? (
            <form
              className="space-y-4 rounded-xl border border-line bg-white p-6 shadow-card"
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <h2 className="font-display text-3xl">{selected.name}</h2>
              <p className="text-sm text-ink/75">{selected.email}</p>
              <dl className="space-y-2 text-sm text-ink/80">
                <div>
                  <dt className="font-semibold">Company/Brand</dt>
                  <dd>{selected.organization || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Phone</dt>
                  <dd>{selected.phone || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Product/Service</dt>
                  <dd>{selected.product_service || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Target location</dt>
                  <dd>{selected.target_location || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Target audience</dt>
                  <dd>{selected.target_audience || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Estimated budget</dt>
                  <dd>{selected.estimated_budget || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Channels</dt>
                  <dd>{selected.channels.length > 0 ? selected.channels.join(", ") : "None selected"}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Marketing requirement</dt>
                  <dd className="whitespace-pre-wrap">{selected.requirements}</dd>
                </div>
              </dl>
              <Select label="Status" options={STATUSES} value={status} onChange={(event) => setStatus(event.target.value)} />
              <Textarea label="Response" value={responseMessage} onChange={(event) => setResponseMessage(event.target.value)} />
              <FormInput label="Response amount" value={responseAmount} onChange={(event) => setResponseAmount(event.target.value)} />
              {notice ? <p role="status" className="text-sm text-ink/75">{notice}</p> : null}
              {saveError ? (
                <p role="alert" className="text-sm text-red-800">
                  {saveError}
                </p>
              ) : null}
              <button type="submit" className="min-h-11 rounded-md bg-champagne px-5 text-sm font-semibold text-night" disabled={saving} aria-busy={saving}>
                {saving ? "Saving" : "Save"}
              </button>
            </form>
          ) : (
            <p className="text-sm text-ink/70">Select a request to review it.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
