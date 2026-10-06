type ProgressBarProps = {
  value: number;
};

export function ProgressBar({ value }: ProgressBarProps) {
  const width = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={width} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-2 rounded-full bg-champagne" style={{ width: `${width}%` }} />
    </div>
  );
}
