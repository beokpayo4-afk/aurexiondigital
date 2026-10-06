import { Button } from "@/components/ui/Button";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title = "This section is unavailable", message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-line bg-white px-6 py-8 shadow-card" role="alert">
      <h3 className="font-display text-3xl leading-tight text-ink">{title}</h3>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink/75">{message}</p>
      {onRetry ? (
        <div className="mt-6">
          <Button type="button" variant="secondary" tone="light" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
