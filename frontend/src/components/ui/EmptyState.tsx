import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white px-6 py-10">
      <h3 className="font-display text-3xl leading-tight text-ink">{title}</h3>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink/75">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
