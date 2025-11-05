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
  { key: "initializing", label: "Starting up", shortLabel: "Started" },
  { key: "authenticating", label: "Verifying account", shortLabel: "Verified" },
  { key: "loading_profile", label: "Loading fitness profile", shortLabel: "Loaded" },
  { key: "analyzing", label: "Assessing goals", shortLabel: "Assessed" },
  { key: "finding_exercises", label: "Finding exercises", shortLabel: "Found exercises" },
  { key: "matching_strength", label: "Selecting strength moves", shortLabel: "Selected strength" },
  { key: "matching_cardio", label: "Selecting cardio", shortLabel: "Selected cardio" },
  { key: "optimizing", label: "Optimizing schedule", shortLabel: "Optimized" },
  { key: "building", label: "Building Week 1", shortLabel: "Built Week 1" },
  { key: "saving", label: "Finalizing plan", shortLabel: "Finalized" },
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

  const completedStages = stages.filter((_, index) => index < currentStageIndex);
  const currentStage = currentStageIndex >= 0 ? stages[currentStageIndex] : null;
  const upcomingStages = stages.filter((_, index) => index > currentStageIndex);

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
      {currentStage && (
        <div className="mb-6 animate-fade-in rounded-lg border border-accent-subtle bg-accent-subtle/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent">
              <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-fg2">
                Now Working On
              </p>
              <p className="font-semibold text-fg0">
                {message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Completed Stages - Compact Chips */}
      {completedStages.length > 0 && (
        <div className="mb-4 animate-slide-down">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg2">
            Completed
          </p>
          <div className="flex flex-wrap gap-2">
            {completedStages.map((s) => (
              <div
                key={s.key}
                className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success transition-all duration-300 ease-out"
              >
                <Check className="h-3 w-3" strokeWidth={2.5} />
                <span>{s.shortLabel}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Stages - Compact List */}
      {upcomingStages.length > 0 && (
        <div className="animate-fade-in">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg2">
            Up Next
          </p>
          <div className="space-y-1.5">
            {upcomingStages.map((s, index) => (
              <div
                key={s.key}
                className="flex items-center gap-2 px-2 py-1.5 transition-all duration-300 ease-out"
                style={{ opacity: 0.6 - (index * 0.1) }}
              >
                <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-line2" />
                <span className="text-xs text-fg2">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer note */}
      <div className="mt-6 rounded-md border border-line2 bg-bg2 p-3">
        <p className="text-xs text-fg1">
          <span className="font-semibold text-fg0">Matching exercises</span> to your fitness level, equipment, and schedule.
        </p>
      </div>
    </div>
  );
}
