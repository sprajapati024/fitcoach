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
        "touch-feedback inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold uppercase tracking-wide transition-all duration-200",
        // Neon gradient background
        "bg-gradient-to-r from-[var(--neon-primary)] to-[var(--neon-glow)] text-bg0",
        // Subtle depth with multi-layer shadow
        "shadow-[0_2px_8px_rgba(0,212,255,0.3),0_4px_16px_rgba(0,212,255,0.15),0_0_1px_rgba(0,0,0,0.1)_inset]",
        // Active state - pressed effect
        "active:shadow-[0_1px_4px_rgba(0,212,255,0.4),0_0_8px_rgba(0,212,255,0.2)_inset]",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:from-fg2 disabled:to-fg2",
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
