import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type ButtonProps = {
  children: ReactNode;
  to?: string;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "ghost";
  tone?: "dark" | "light";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export function Button({
  children,
  to,
  type = "button",
  variant = "primary",
  tone = "dark",
  className = "",
  disabled = false,
  onClick,
}: ButtonProps) {
  const styles = [
    "inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold tracking-wide transition-colors",
    variant === "primary" ? "bg-champagne text-night hover:bg-[#d4b67d]" : "",
    variant === "secondary" && tone === "dark" ? "border border-night/15 bg-white/80 text-night hover:border-champagne-deep hover:bg-white" : "",
    variant === "secondary" && tone === "light" ? "border border-line bg-white text-ink hover:border-champagne-deep" : "",
    variant === "ghost" ? "px-2 text-champagne-deep hover:text-night" : "",
    disabled ? "pointer-events-none cursor-not-allowed opacity-60" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <Link to={to} className={styles} onClick={onClick} aria-disabled={disabled || undefined}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={styles} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
