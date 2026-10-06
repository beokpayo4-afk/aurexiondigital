import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  tone?: "paper" | "glass";
  interactive?: boolean;
};

export function Card({ children, className = "", tone = "paper", interactive = false }: CardProps) {
  const surface =
    tone === "glass"
      ? "border-night/10 bg-white/75 text-night shadow-none"
      : "border-line bg-white text-ink shadow-card";
  const hover = interactive ? "transition-colors hover:border-champagne-deep" : "";

  return <article className={`min-w-0 rounded-md border p-5 sm:p-6 ${surface} ${hover} ${className}`}>{children}</article>;
}
