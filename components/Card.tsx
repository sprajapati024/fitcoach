"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-line1 bg-bg1/70 p-4 backdrop-blur-sm",
        // Subtle depth with multi-layer shadow and hint of neon
        "shadow-[0_1px_0_#1f1f1f,0_4px_12px_rgba(0,0,0,0.15),0_0_1px_rgba(0,212,255,0.03)]",
        className,
      )}
      {...props}
    />
  );
}
