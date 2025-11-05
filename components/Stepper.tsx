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
                "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium transition-all duration-150",
                isCompleted
                  ? "border-accent bg-accent text-gray-950"
                  : isActive
                    ? "border-accent bg-accent-subtle text-accent"
                    : "border-surface-border text-text-muted",
              )}
            >
              {index + 1}
            </div>
            <span
              className={cn(
                "hidden text-sm uppercase tracking-wide md:block",
                isActive ? "font-semibold text-accent" : isCompleted ? "text-text-primary" : "text-text-muted",
              )}
            >
              {step}
            </span>
            {index < steps.length - 1 ? (
              <div
                className={cn(
                  "mx-2 hidden h-px flex-1 md:block",
                  isCompleted ? "bg-accent" : "bg-surface-border",
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
