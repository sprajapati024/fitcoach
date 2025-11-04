"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Base styles - clean and defined
        "rounded-lg border border-line1 bg-bg1 p-4 md:p-6",
        // Subtle shadow - no glow
        "shadow-md",
        className,
      )}
      {...props}
    />
  );
}
