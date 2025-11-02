"use client";

import { useEffect, useState } from "react";

interface ProgressStage {
  stage: string;
  message: string;
  percent: number;
}

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

const stageColors: Record<string, string> = {
  initializing: "bg-blue-500",
  authenticating: "bg-purple-500",
  loading_profile: "bg-indigo-500",
  analyzing: "bg-cyan-500",
  querying: "bg-green-500",
  validating: "bg-teal-500",
  processing: "bg-yellow-500",
  building: "bg-orange-500",
  saving: "bg-emerald-500",
  retrying: "bg-amber-500",
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
  const color = stageColors[stage] || "bg-gray-500";

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl animate-pulse">{icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Generating Your Plan
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This may take 15-20 seconds
            </p>
          </div>
        </div>
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {smoothPercent}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
        <div
          className={`absolute top-0 left-0 h-full ${color} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${smoothPercent}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>

      {/* Current Stage Message */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 ${color} rounded-full animate-pulse`} />
        <p className="text-gray-700 dark:text-gray-300 font-medium">
          {message}
        </p>
      </div>

      {/* Stage Timeline */}
      <div className="mt-6 space-y-2">
        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
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
          ].map((s) => (
            <div
              key={s.key}
              className={`text-xs px-2 py-1 rounded-md text-center transition-all ${
                stage === s.key
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold"
                  : percent > (["analyzing", "querying", "validating", "processing", "building", "saving"].indexOf(s.key) * 15 + 10)
                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Tip */}
      <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <span className="font-semibold">Tip:</span> Our AI is analyzing your
          profile, finding the best exercises, and creating a personalized plan
          just for you.
        </p>
      </div>
    </div>
  );
}
