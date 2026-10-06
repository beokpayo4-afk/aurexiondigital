import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "header" | "footer";
};

export function Container({ children, className = "", as = "div" }: ContainerProps) {
  const Tag = as;
  return <Tag className={`mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10 xl:max-w-page ${className}`}>{children}</Tag>;
}
