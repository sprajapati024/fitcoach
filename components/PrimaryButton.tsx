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
        // Base styles - clean and minimal
        "touch-feedback inline-flex h-12 items-center justify-center gap-2 rounded-md px-6",
        "text-base font-semibold transition-all duration-150",

        // Colors - solid cyan background, dark text
        "bg-accent text-gray-950",

        // Shadows - subtle with tiny accent glow
        "shadow-md shadow-accent",

        // Hover state
        "hover:bg-accent-light hover:shadow-lg",

        // Active state - scale down
        "active:scale-[0.98]",

        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-fg2 disabled:shadow-none",

        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
      <span>{children}</span>
    </button>
  );
}
