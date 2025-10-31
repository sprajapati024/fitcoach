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
                "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium transition",
                isCompleted
                  ? "border-fg1 bg-fg1 text-bg0"
                  : isActive
                    ? "border-fg0 text-fg0"
                    : "border-line2 text-fg2",
              )}
            >
              {index + 1}
            </div>
            <span
              className={cn(
                "hidden text-sm uppercase tracking-wide md:block",
                isActive ? "text-fg0" : "text-fg2",
              )}
            >
              {step}
            </span>
            {index < steps.length - 1 ? (
              <div className="mx-2 hidden h-px flex-1 bg-line2 md:block" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
