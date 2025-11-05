'use client';

import { Flame } from 'lucide-react';

interface MacroRingsProps {
  protein: number;
  carbs: number;
  fat: number;
  totalCalories: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
  caloriesGoal?: number;
}

export function MacroRings({
  protein,
  carbs,
  fat,
  totalCalories,
  proteinGoal = 150,
  carbsGoal = 200,
  fatGoal = 65,
  caloriesGoal = 2000,
}: MacroRingsProps) {
  const proteinPercent = Math.min((protein / proteinGoal) * 100, 100);
  const carbsPercent = Math.min((carbs / carbsGoal) * 100, 100);
  const fatPercent = Math.min((fat / fatGoal) * 100, 100);
  const caloriesPercent = Math.min((totalCalories / caloriesGoal) * 100, 100);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-surface-border bg-gradient-to-br from-indigo-500/5 via-surface-1 to-cyan-500/5 p-6">
      {/* Animated background blob */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 animate-drift rounded-full bg-gradient-to-br from-indigo-500/10 to-transparent blur-3xl" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">Today&apos;s Nutrition</h3>
          <div className="flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5">
            <Flame className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-semibold text-indigo-500">
              {totalCalories} / {caloriesGoal} cal
            </span>
          </div>
        </div>

        {/* Calories progress bar */}
        <div className="mb-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-0">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${caloriesPercent}%` }}
            />
          </div>
        </div>

        {/* Macro rings */}
        <div className="grid grid-cols-3 gap-4">
          {/* Protein */}
          <div className="text-center">
            <div className="relative mx-auto mb-2 h-20 w-20">
              <svg className="h-full w-full -rotate-90 transform">
                {/* Background circle */}
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-surface-0"
                />
                {/* Progress circle */}
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - proteinPercent / 100)}`}
                  className="text-cyan-500 transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-text-primary">{Math.round(proteinPercent)}%</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-text-primary">{protein}g</p>
            <p className="text-xs text-text-muted">Protein</p>
          </div>

          {/* Carbs */}
          <div className="text-center">
            <div className="relative mx-auto mb-2 h-20 w-20">
              <svg className="h-full w-full -rotate-90 transform">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-surface-0"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - carbsPercent / 100)}`}
                  className="text-indigo-500 transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-text-primary">{Math.round(carbsPercent)}%</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-text-primary">{carbs}g</p>
            <p className="text-xs text-text-muted">Carbs</p>
          </div>

          {/* Fat */}
          <div className="text-center">
            <div className="relative mx-auto mb-2 h-20 w-20">
              <svg className="h-full w-full -rotate-90 transform">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-surface-0"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - fatPercent / 100)}`}
                  className="text-purple-500 transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-text-primary">{Math.round(fatPercent)}%</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-text-primary">{fat}g</p>
            <p className="text-xs text-text-muted">Fat</p>
          </div>
        </div>
      </div>
    </div>
  );
}
