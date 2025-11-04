"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Base styles - adaptive surface
        "rounded-lg border border-surface-border bg-surface-1 p-4 md:p-6",
        // Subtle shadow with neural precision
        "shadow-md",
        // Hover state - subtle lift
        "transition-all duration-200 hover:border-surface-border/80",
        className,
      )}
      {...props}
    />
  );
}
