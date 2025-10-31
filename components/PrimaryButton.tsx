"use client";

import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function PrimaryButton({ loading = false, className, children, disabled, ...props }: PrimaryButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-fg0 px-6 text-sm font-semibold uppercase tracking-wide text-bg0 transition hover:bg-fg1 disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      <span>{children}</span>
    </button>
  );
}
