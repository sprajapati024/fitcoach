"use client";

import { useEffect, useState } from "react";

interface PlanGenerationProgressProps {
  stage: string;
  message: string;
  percent: number;
}

const stageIcons: Record<string, string> = {
  initializing: "⚙️",
  authenticating: "🔐",
  loading_profile: "👤",
  analyzing: "🔍",
  querying: "🏋️",
  validating: "✅",
  processing: "⚡",
  building: "📅",
  saving: "💾",
  retrying: "🔄",
};

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

  const icon = stageIcons[stage] || "⏳";

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border border-line1 bg-bg1 p-6 shadow-md">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="animate-pulse text-3xl">{icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-fg0">
              Generating Your Plan
            </h3>
            <p className="text-sm text-fg2">
              This may take 15-20 seconds
            </p>
          </div>
        </div>
        <span className="text-2xl font-bold text-fg0">
          {smoothPercent}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-4 h-2 w-full overflow-hidden rounded-full bg-bg2">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${smoothPercent}%` }}
        />
      </div>

      {/* Current Stage Message */}
      <div className="flex items-center gap-2 text-sm">
        <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
        <p className="font-medium text-fg0">
          {message}
        </p>
      </div>

      {/* Stage Timeline */}
      <div className="mt-6 space-y-2">
        <div className="mb-2 text-xs uppercase tracking-wide text-fg2">
          Progress Stages
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "analyzing", label: "Analyzing" },
            { key: "querying", label: "Finding" },
            { key: "validating", label: "Validating" },
            { key: "processing", label: "Processing" },
            { key: "building", label: "Building" },
            { key: "saving", label: "Saving" },
          ].map((s, index) => {
            const isActive = stage === s.key;
            const isCompleted = percent > (index * 15 + 10);

            return (
              <div
                key={s.key}
                className={`rounded-md px-2 py-1 text-center text-xs transition-all ${
                  isActive
                    ? "bg-accent-subtle font-semibold text-accent-light"
                    : isCompleted
                    ? "bg-success-bg text-success-light"
                    : "bg-bg2 text-fg2"
                }`}
              >
                {s.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tip */}
      <div className="mt-6 rounded-md border border-line2 bg-bg2 p-3">
        <p className="text-xs text-fg1">
          <span className="font-semibold text-fg0">Tip:</span> Our AI is analyzing your
          profile, finding the best exercises, and creating a personalized plan
          just for you.
        </p>
      </div>
    </div>
  );
}
