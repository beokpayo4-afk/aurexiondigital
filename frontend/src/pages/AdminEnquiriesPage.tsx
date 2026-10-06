import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FormInput } from "@/components/ui/FormInput";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ENQUIRY_STATUSES } from "@/constants/enquiry";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/api/client";
import { listServices } from "@/services/catalogService";
import { listEnquiries, updateEnquiry, type ServiceEnquiry } from "@/services/leadService";
import { apiErrorMessage } from "@/utils/apiError";
import { formatDate } from "@/utils/format";

type StaffAccount = { id: string; full_name: string; email: string };

const STATUS_LABEL = Object.fromEntries(ENQUIRY_STATUSES.map((status) => [status.value, status.label]));

export function AdminEnquiriesPage() {
  usePageTitle("Enquiries");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState("new");
  const [assignee, setAssignee] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const enquiries = useAsyncData(
    () => listEnquiries({ page, q: search, status: statusFilter, serviceId: serviceFilter }),
    [page, search, statusFilter, serviceFilter],
  );
  const services = useAsyncData(() => listServices(), []);
  const staff = useAsyncData(() => api.get<StaffAccount[]>("/admin/staff").then((response) => response.data), []);
  const selected = enquiries.data?.items.find((enquiry) => enquiry.id === selectedId) ?? null;
  const pageCount = enquiries.data ? Math.max(1, Math.ceil(enquiries.data.total / enquiries.data.page_size)) : 1;

  const choose = (enquiry: ServiceEnquiry) => {
    setSelectedId(enquiry.id);
    setStatus(enquiry.status);
    setAssignee(enquiry.assigned_to_user_id ?? "");
    setNotes(enquiry.notes ?? "");
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
      const updated = await updateEnquiry(selected.id, {
        status,
        assigned_to_user_id: assignee || null,
        notes,
      });
      setNotice("Enquiry updated.");
      setStatus(updated.status);
      setAssignee(updated.assigned_to_user_id ?? "");
      setNotes(updated.notes ?? "");
      enquiries.reload();
    } catch (error) {
      setSaveError(apiErrorMessage(error, "The enquiry could not be updated."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl">Enquiries</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/75">Service enquiries submitted from the public site.</p>
      <form
        className="mt-6 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch(query.trim());
        }}
      >
        <FormInput label="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select
          label="Status"
          options={ENQUIRY_STATUSES}
          value={statusFilter}
          placeholder="All"
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
        />
        <Select
          label="Service"
          options={(services.data?.items ?? []).map((service) => ({ value: service.id, label: service.name }))}
          value={serviceFilter}
          placeholder="All"
          onChange={(event) => {
            setServiceFilter(event.target.value);
            setPage(1);
          }}
        />
        <Button type="submit">Search</Button>
      </form>
      {services.error ? <p className="mt-3 text-sm text-red-800">{services.error}</p> : null}
      <div className="mt-8">
        {enquiries.loading ? <LoadingState label="Loading enquiries" /> : null}
        {enquiries.error ? <ErrorState message={enquiries.error} onRetry={enquiries.reload} /> : null}
        {!enquiries.loading && !enquiries.error && enquiries.data?.items.length === 0 ? (
          <EmptyState title="No enquiries" description="Enquiries appear here after someone submits a service enquiry." />
        ) : null}
      </div>
      {enquiries.data && enquiries.data.items.length > 0 ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <ul className="divide-y divide-line border-y border-line">
              {enquiries.data.items.map((enquiry) => (
                <li key={enquiry.id}>
                  <button type="button" className="flex w-full min-h-11 flex-col items-start py-4 text-left" onClick={() => choose(enquiry)}>
                    <span className="font-semibold">{enquiry.company_name || enquiry.name}</span>
                    <span className="text-sm text-ink/65">
                      {STATUS_LABEL[enquiry.status] ?? enquiry.status}
                      {enquiry.service_name ? ` · ${enquiry.service_name}` : ""} · {formatDate(enquiry.created_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <p>
                Page {enquiries.data.page} of {pageCount}
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
              <dl className="space-y-2 text-sm text-ink/80">
                <div>
                  <dt className="font-semibold">Company</dt>
                  <dd>{selected.company_name || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Email</dt>
                  <dd>{selected.email}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Phone</dt>
                  <dd>{selected.phone || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Service</dt>
                  <dd>{selected.service_name || "Not linked"}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Message</dt>
                  <dd className="whitespace-pre-wrap">{selected.message}</dd>
                </div>
              </dl>
              <Select label="Status" options={ENQUIRY_STATUSES} allowEmpty={false} value={status} onChange={(event) => setStatus(event.target.value)} />
              <Select
                label="Assign staff"
                options={(staff.data ?? []).map((person) => ({ value: person.id, label: `${person.full_name} (${person.email})` }))}
                value={assignee}
                placeholder="Unassigned"
                onChange={(event) => setAssignee(event.target.value)}
              />
              {staff.error ? <p className="text-sm text-red-800">{staff.error}</p> : null}
              <Textarea label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
              {notice ? (
                <p role="status" className="text-sm text-ink/75">
                  {notice}
                </p>
              ) : null}
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
            <p className="text-sm text-ink/70">Select an enquiry to review it.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
