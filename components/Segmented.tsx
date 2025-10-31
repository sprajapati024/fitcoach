"use client";

import { cn } from "@/lib/utils";

interface SegmentedOption<T extends string> {
  label: string;
  value: T;
  description?: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-2 rounded-[var(--radius-md)] border border-line1 bg-bg2 p-2 sm:grid-cols-2",
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            type="button"
            key={option.value}
            onClick={() => {
              if (!isActive) {
                onChange(option.value);
              }
            }}
            className={cn(
              "flex h-full flex-col items-start gap-1 rounded-[var(--radius-sm)] border px-3 py-3 text-left transition",
              isActive
                ? "border-fg0 bg-fg0 text-bg0"
                : "border-line1 bg-bg2 text-fg1 hover:border-fg0 hover:bg-bg1",
            )}
          >
            <span className="text-sm font-medium uppercase tracking-wide">
              {isActive ? "✓ " : ""}{option.label}
            </span>
            {option.description ? (
              <span className={cn("text-xs", isActive ? "text-bg1" : "text-fg2")}>{option.description}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
