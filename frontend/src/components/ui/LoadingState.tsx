type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading" }: LoadingStateProps) {
  return (
    <div className="py-8" role="status">
      <div className="h-px w-16 bg-champagne" aria-hidden="true" />
      <p className="mt-3 text-sm text-ink/70">{label}</p>
    </div>
  );
}
