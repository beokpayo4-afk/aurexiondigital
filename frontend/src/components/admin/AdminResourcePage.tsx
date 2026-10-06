import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { AdminField, AdminResource } from "@/admin/resources";
import { api } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FormInput } from "@/components/ui/FormInput";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { PageResult } from "@/types/catalog";
import { apiErrorMessage } from "@/utils/apiError";

type Row = { id: string } & Record<string, unknown>;
type FormValues = Record<string, string | boolean>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function schemaFor(fields: AdminField[]) {
  const shape: Record<string, z.ZodType> = {};
  for (const field of fields) {
    if (field.type === "checkbox") {
      shape[field.name] = z.boolean();
      continue;
    }
    if (field.type === "uuid-list") {
      shape[field.name] = z.string().refine((value) => {
        return value
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .every((line) => UUID_PATTERN.test(line));
      }, "Enter one id per line.");
      continue;
    }
    if (field.type === "number") {
      const pattern = z.string().refine((value) => {
        const text = value.trim();
        if (text === "") {
          return !field.required;
        }
        if (!/^\d+(\.\d+)?$/.test(text)) {
          return false;
        }
        if (field.name === "rating") {
          const rating = Number(text);
          return rating >= 1 && rating <= 5;
        }
        return true;
      }, field.name === "rating" ? "Enter a rating from 1 to 5." : "Enter a number.");
      shape[field.name] = pattern;
      continue;
    }
    const text = z.string();
    shape[field.name] = field.required ? text.trim().min(1, `${field.label} is required.`) : text;
  }
  return z.object(shape);
}

function defaults(fields: AdminField[]): FormValues {
  const values: FormValues = {};
  for (const field of fields) {
    if (field.type === "checkbox") {
      values[field.name] = false;
    } else if (field.name === "currency") {
      values[field.name] = "INR";
    } else if (field.name === "sort_order") {
      values[field.name] = "0";
    } else {
      values[field.name] = "";
    }
  }
  return values;
}

function fromRow(fields: AdminField[], row: Row): FormValues {
  const values = defaults(fields);
  for (const field of fields) {
    const raw = row[field.name];
    if (field.type === "checkbox") {
      values[field.name] = Boolean(raw);
    } else if (field.type === "lines" || field.type === "uuid-list") {
      values[field.name] = Array.isArray(raw) ? raw.join("\n") : "";
    } else if (raw == null) {
      values[field.name] = "";
    } else {
      values[field.name] = String(raw);
    }
  }
  return values;
}

function toPayload(fields: AdminField[], values: FormValues, editing: boolean) {
  const body: Record<string, unknown> = {};
  for (const field of fields) {
    if (editing && field.createOnly) {
      continue;
    }
    const raw = values[field.name];
    if (field.type === "checkbox") {
      body[field.name] = Boolean(raw);
      continue;
    }
    if (field.type === "lines" || field.type === "uuid-list") {
      body[field.name] = String(raw ?? "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      continue;
    }
    const text = String(raw ?? "").trim();
    if (field.type === "number") {
      body[field.name] = text === "" ? null : text;
      continue;
    }
    body[field.name] = text === "" ? null : text;
  }
  return body;
}

function display(row: Row, key: string, format?: "bool" | "active") {
  const value = row[key];
  if (format === "bool") {
    return value ? "Published" : "Draft";
  }
  if (format === "active") {
    return value ? "Active" : "Inactive";
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "Not set";
  }
  if (value == null || value === "") {
    return "Not set";
  }
  const text = String(value);
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

export function AdminResourcePage({ resource }: { resource: AdminResource }) {
  usePageTitle(resource.title);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(resource.defaultSort);
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const filter of resource.filters ?? []) {
      initial[filter.param] = filter.defaultValue ?? "";
    }
    if (resource.publishFilter) {
      initial.is_published = "";
    }
    return initial;
  });
  const [editing, setEditing] = useState<Row | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const schema = useMemo(() => schemaFor(resource.fields), [resource]);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults(resource.fields),
  });

  const list = useAsyncData(async () => {
    const params: Record<string, string | number | undefined> = {
      page,
      page_size: 10,
      sort,
      q: search || undefined,
    };
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        params[key] = value;
      }
    }
    const response = await api.get<PageResult<Row>>(resource.path, { params });
    return response.data;
  }, [resource.path, page, search, sort, filters]);

  const pageCount = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.page_size)) : 1;
  const canPublish = resource.fields.some((field) => field.name === "is_published");

  const startCreate = () => {
    setEditing(null);
    setFormError(null);
    form.reset(defaults(resource.fields));
  };

  const startEdit = (row: Row) => {
    setEditing(row);
    setFormError(null);
    setNotice(null);
    form.reset(fromRow(resource.fields, row));
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    setNotice(null);
    try {
      const body = toPayload(resource.fields, values, editing !== null);
      if (editing) {
        await api.put(`${resource.path}/${editing.id}`, body);
        setNotice("Record updated.");
      } else {
        await api.post(resource.path, body);
        setNotice("Record created.");
        form.reset(defaults(resource.fields));
      }
      setEditing(null);
      list.reload();
    } catch (error) {
      setFormError(apiErrorMessage(error, "The record could not be saved."));
    }
  });

  const togglePublished = async (row: Row) => {
    setNotice(null);
    setFormError(null);
    try {
      await api.put(`${resource.path}/${row.id}`, { is_published: !row.is_published });
      setNotice(row.is_published ? "Record unpublished." : "Record published.");
      list.reload();
    } catch (error) {
      setFormError(apiErrorMessage(error, "The publish state could not be changed."));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }
    setDeleting(true);
    setFormError(null);
    try {
      await api.delete(`${resource.path}/${pendingDelete.id}`);
      setNotice("Record deleted.");
      setPendingDelete(null);
      if (editing?.id === pendingDelete.id) {
        startCreate();
      }
      list.reload();
    } catch (error) {
      setFormError(apiErrorMessage(error, "The record could not be deleted."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl sm:text-5xl">{resource.title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/75">{resource.description}</p>
      <form
        className="mt-6 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch(query.trim());
        }}
      >
        <FormInput label="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select label="Sort" options={resource.sorts} value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} placeholder="Sort" />
        {(resource.filters ?? []).map((filter) => (
          <Select
            key={filter.param}
            label={filter.label}
            options={filter.options}
            value={filters[filter.param] ?? ""}
            placeholder="All"
            allowEmpty={!filter.defaultValue}
            onChange={(event) => {
              setFilters((current) => ({ ...current, [filter.param]: event.target.value }));
              setPage(1);
            }}
          />
        ))}
        {resource.publishFilter ? (
          <Select
            label="Published"
            options={[
              { value: "true", label: "Published" },
              { value: "false", label: "Draft" },
            ]}
            value={filters.is_published ?? ""}
            placeholder="All"
            onChange={(event) => {
              setFilters((current) => ({ ...current, is_published: event.target.value }));
              setPage(1);
            }}
          />
        ) : null}
        <Button type="submit">Search</Button>
      </form>
      {notice ? (
        <p role="status" className="mt-4 text-sm text-ink/75">
          {notice}
        </p>
      ) : null}
      {formError ? (
        <p role="alert" className="mt-4 text-sm text-red-800">
          {formError}
        </p>
      ) : null}
      {(resource.canCreate || editing) && resource.fields.length > 0 ? (
        <form className="mt-8 max-w-3xl space-y-4 rounded-xl border border-line bg-white p-6 shadow-card" onSubmit={onSubmit} noValidate>
          <h2 className="font-display text-3xl">{editing ? "Edit record" : "New record"}</h2>
          {resource.fields.map((field) => {
            const error = form.formState.errors[field.name]?.message;
            const message = typeof error === "string" ? error : undefined;
            if (field.type === "checkbox") {
              return (
                <label key={field.name} className="flex min-h-11 items-center gap-3 text-sm">
                  <input type="checkbox" {...form.register(field.name)} />
                  {field.label}
                </label>
              );
            }
            if (field.type === "textarea" || field.type === "lines" || field.type === "uuid-list") {
              return (
                <div key={field.name}>
                  <Textarea label={field.label} {...form.register(field.name)} error={message} disabled={Boolean(editing && field.createOnly)} />
                  {field.help ? <p className="mt-1 text-xs text-ink/60">{field.help}</p> : null}
                </div>
              );
            }
            if (field.type === "select" && field.options) {
              return (
                <Select
                  key={field.name}
                  label={field.label}
                  options={field.options}
                  {...form.register(field.name)}
                  error={message}
                  disabled={Boolean(editing && field.createOnly)}
                />
              );
            }
            return (
              <div key={field.name}>
                <FormInput label={field.label} {...form.register(field.name)} error={message} disabled={Boolean(editing && field.createOnly)} />
                {field.help ? <p className="mt-1 text-xs text-ink/60">{field.help}</p> : null}
              </div>
            );
          })}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving" : editing ? "Save changes" : "Create"}
            </Button>
            {editing ? (
              <Button type="button" variant="secondary" tone="light" onClick={startCreate}>
                Cancel edit
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}
      <div className="mt-8">
        {list.loading ? <LoadingState label={`Loading ${resource.title.toLowerCase()}`} /> : null}
        {list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : null}
        {!list.loading && !list.error && list.data?.items.length === 0 ? (
          <EmptyState title={`No ${resource.title.toLowerCase()}`} description="Records appear here when they exist." />
        ) : null}
        {list.data && list.data.items.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-card">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-[0.14em] text-ink/55">
                <tr>
                  <th className="px-4 py-3 font-semibold">Id</th>
                  {resource.columns.map((column) => (
                    <th key={column.key} className="px-4 py-3 font-semibold">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.data.items.map((row) => (
                  <tr key={row.id} className="border-b border-line last:border-b-0">
                    <td className="max-w-[12rem] break-all px-4 py-3 font-mono text-xs">{row.id}</td>
                    {resource.columns.map((column) => (
                      <td key={column.key} className="px-4 py-3">
                        {display(row, column.key, column.format)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {resource.canEdit ? (
                          <button type="button" className="min-h-11 px-2 text-sm font-semibold text-champagne-deep" onClick={() => startEdit(row)}>
                            Edit
                          </button>
                        ) : null}
                        {canPublish ? (
                          <button type="button" className="min-h-11 px-2 text-sm font-semibold" onClick={() => void togglePublished(row)}>
                            {row.is_published ? "Unpublish" : "Publish"}
                          </button>
                        ) : null}
                        {resource.canDelete ? (
                          <button type="button" className="min-h-11 px-2 text-sm font-semibold text-red-800" onClick={() => setPendingDelete(row)}>
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {list.data && list.data.total > 0 ? (
          <div className="mt-4 flex items-center justify-between gap-4 text-sm">
            <p>
              Page {list.data.page} of {pageCount} · {list.data.total} records
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
        ) : null}
      </div>
      <Modal open={pendingDelete !== null} title="Delete record" onClose={() => setPendingDelete(null)}>
        <p className="text-sm leading-6 text-night/80">This removes the record from the admin list and the public site.</p>
        <div className="mt-6 flex gap-3">
          <Button type="button" onClick={() => void confirmDelete()} disabled={deleting}>
            {deleting ? "Deleting" : "Delete"}
          </Button>
          <Button type="button" variant="secondary" tone="dark" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
