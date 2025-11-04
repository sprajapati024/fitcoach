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
        // Base styles - neural precision
        "group relative touch-feedback inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-md px-6",
        "text-base font-semibold transition-all duration-200",

        // Neural gradient background (cyan → indigo)
        "bg-gradient-to-r from-cyan-500 to-indigo-600 text-gray-950",

        // Neural shimmer shadow
        "shadow-[0_0_15px_rgba(79,70,229,0.15)]",

        // Hover state - scale + stronger glow
        "hover:scale-105 hover:shadow-[0_0_25px_rgba(79,70,229,0.25)]",

        // Active state - scale down for tactile feedback
        "active:scale-[0.97]",

        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none",

        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Neural Shimmer Effect on Hover */}
      <div
        className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-all duration-500 group-hover:translate-x-[100%] group-hover:opacity-100"
        style={{ transition: 'transform 0.6s ease-in-out, opacity 0.3s ease-in-out' }}
      />

      {loading ? <Loader2 className="relative z-10 h-5 w-5 animate-spin" aria-hidden /> : null}
      <span className="relative z-10">{children}</span>
    </button>
  );
}
