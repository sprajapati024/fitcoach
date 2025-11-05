"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

interface PlanGenerationProgressProps {
  stage: string;
  message: string;
  percent: number;
}

// Define all stages in order
const stages = [
  { key: "initializing", label: "Starting up" },
  { key: "authenticating", label: "Verifying account" },
  { key: "loading_profile", label: "Loading fitness profile" },
  { key: "analyzing", label: "Assessing goals" },
  { key: "finding_exercises", label: "Finding exercises" },
  { key: "matching_strength", label: "Selecting strength moves" },
  { key: "matching_cardio", label: "Selecting cardio" },
  { key: "optimizing", label: "Optimizing schedule" },
  { key: "building", label: "Building Week 1" },
  { key: "saving", label: "Finalizing plan" },
];

export default function PlanGenerationProgress({
  stage,
  message,
  percent,
}: PlanGenerationProgressProps) {
  const [smoothPercent, setSmoothPercent] = useState(0);

  // Smooth progress bar animation
  useEffect(() => {
    const interval = setInterval(() => {
      setSmoothPercent((prev) => {
        if (prev < percent) {
          return Math.min(prev + 1, percent);
        }
        return prev;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [percent]);

  // Determine current stage index
  const currentStageIndex = stages.findIndex(s => s.key === stage);

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border border-line1 bg-bg1 p-6 shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-fg0">
          Building Your Plan
        </h3>
        <p className="mt-1 text-sm text-fg2">
          This takes 15-20 seconds
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-fg1">Progress</span>
          <span className="text-lg font-bold text-accent">
            {smoothPercent}%
          </span>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-bg2">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-300 ease-out"
            style={{ width: `${smoothPercent}%` }}
          />
        </div>
      </div>

      {/* Current Stage Highlight */}
      <div className="mb-6 rounded-lg border border-accent-subtle bg-accent-subtle/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
            <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-fg2">
              Now Working On
            </p>
            <p className="font-semibold text-fg0">
              {message}
            </p>
          </div>
        </div>
      </div>

      {/* Stage Checklist */}
      <div className="space-y-2">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-fg2">
          Steps
        </p>
        {stages.map((s, index) => {
          const isCompleted = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const isPending = index > currentStageIndex;

          return (
            <div
              key={s.key}
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all ${
                isCurrent
                  ? "bg-bg2"
                  : isCompleted
                  ? "bg-bg1"
                  : "bg-bg1 opacity-50"
              }`}
            >
              {/* Icon */}
              <div
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition-all ${
                  isCompleted
                    ? "bg-success text-white"
                    : isCurrent
                    ? "border-2 border-accent bg-transparent"
                    : "border-2 border-line2 bg-transparent"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : isCurrent ? (
                  <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                ) : null}
              </div>

              {/* Label */}
              <span
                className={`text-sm ${
                  isCurrent
                    ? "font-semibold text-fg0"
                    : isCompleted
                    ? "text-fg1"
                    : "text-fg2"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="mt-6 rounded-md border border-line2 bg-bg2 p-3">
        <p className="text-xs text-fg1">
          <span className="font-semibold text-fg0">Matching exercises</span> to your fitness level, equipment, and schedule.
        </p>
      </div>
    </div>
  );
}
