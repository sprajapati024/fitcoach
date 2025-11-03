"use client";

import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  current: number;
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex items-center justify-between gap-2 py-4">
      {steps.map((step, index) => {
        const isActive = index === current;
        const isCompleted = index < current;
        return (
          <li key={step} className="flex flex-1 items-center gap-3">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium transition-all duration-200",
                isCompleted
                  ? "border-[var(--neon-dark)] bg-gradient-to-br from-[var(--neon-primary)] to-[var(--neon-glow)] text-bg0 shadow-[0_0_8px_rgba(0,212,255,0.2)]"
                  : isActive
                    ? "border-[var(--neon-primary)] text-[var(--neon-primary)] shadow-[0_0_12px_rgba(0,212,255,0.3)]"
                    : "border-line2 text-fg2",
              )}
            >
              {index + 1}
            </div>
            <span
              className={cn(
                "hidden text-sm uppercase tracking-wide md:block",
                isActive ? "font-semibold text-[var(--neon-primary)]" : isCompleted ? "text-fg0" : "text-fg2",
              )}
            >
              {step}
            </span>
            {index < steps.length - 1 ? (
              <div
                className={cn(
                  "mx-2 hidden h-px flex-1 md:block",
                  isCompleted ? "bg-[var(--neon-primary)]" : "bg-line2",
                )}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
