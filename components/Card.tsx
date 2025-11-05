"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Card variant:
   * - default: Standard card with hover effect (for interactive/clickable cards)
   * - static: No hover effect (for display-only content)
   * - compact: Reduced padding (p-3 instead of p-4 md:p-6)
   */
  variant?: 'default' | 'static' | 'compact';
}

export function Card({ className, variant = 'default', ...props }: CardProps) {
  return (
    <div
      className={cn(
        // Base styles - adaptive surface
        "rounded-lg border border-surface-border bg-surface-1",
        // Padding variants
        variant === 'compact' ? "p-3" : "p-4 md:p-6",
        // Subtle shadow with neural precision
        "shadow-md",
        // Hover state - subtle lift (only for default variant)
        variant === 'default' && "transition-all duration-200 hover:border-surface-border/80 hover:shadow-lg",
        className,
      )}
      {...props}
    />
  );
}
