import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";

type CatalogBlockProps = {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  loadingLabel: string;
  hasItems: boolean;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: { to: string; label: string };
  children: ReactNode;
};

export function CatalogBlock({
  loading,
  error,
  onRetry,
  loadingLabel,
  hasItems,
  emptyTitle,
  emptyDescription,
  emptyAction,
  children,
}: CatalogBlockProps) {
  if (loading) {
    return <LoadingState label={loadingLabel} />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }
  if (!hasItems) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={
          emptyAction ? (
            <Button to={emptyAction.to} tone="light">
              {emptyAction.label}
            </Button>
          ) : undefined
        }
      />
    );
  }
  return <>{children}</>;
}
