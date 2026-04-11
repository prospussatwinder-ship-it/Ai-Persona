import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({ variant = "primary", className = "", ...rest }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-violet-600 text-white hover:bg-violet-500"
      : "border border-zinc-600 text-white hover:border-zinc-400";
  return <button type="button" className={`${base} ${styles} ${className}`} {...rest} />;
}
