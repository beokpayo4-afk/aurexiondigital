import { forwardRef, type TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, id, className = "", ...props },
  ref,
) {
  const areaId = id ?? props.name ?? label;
  return (
    <div>
      <label htmlFor={areaId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        {...props}
        id={areaId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${areaId}-error` : undefined}
        className={`field ${className}`}
      />
      {error ? (
        <p id={`${areaId}-error`} role="alert" className="mt-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
});
