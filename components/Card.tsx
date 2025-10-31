"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-line1 bg-bg1/70 p-4 shadow-[0_1px_0_#1f1f1f]",
        className,
      )}
      {...props}
    />
  );
}
