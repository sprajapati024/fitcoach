'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface NutritionData {
  goals: {
    targetCalories?: number | null;
    targetProteinGrams?: string | null;
    targetCarbsGrams?: string | null;
    targetFatGrams?: string | null;
  } | null;
  summary: {
    totalCalories?: number | null;
    totalProtein?: string | null;
    totalCarbs?: string | null;
    totalFat?: string | null;
  } | null;
}

interface CompactNutritionProps {
  nutrition: NutritionData | null;
}

function getPercentageColor(percentage: number): string {
  if (percentage >= 90) return 'text-green-500';
  if (percentage >= 70) return 'text-yellow-500';
  return 'text-gray-500';
}

export function CompactNutrition({ nutrition }: CompactNutritionProps) {
  if (!nutrition || !nutrition.goals) return null;

  const caloriesConsumed = nutrition.summary?.totalCalories || 0;
  const caloriesTarget = nutrition.goals.targetCalories || 2000;
  const caloriesPct = Math.round((caloriesConsumed / caloriesTarget) * 100);

  const proteinConsumed = parseFloat(nutrition.summary?.totalProtein || '0');
  const proteinTarget = parseFloat(nutrition.goals.targetProteinGrams || '150');
  const proteinPct = Math.round((proteinConsumed / proteinTarget) * 100);

  const carbsConsumed = parseFloat(nutrition.summary?.totalCarbs || '0');
  const carbsTarget = parseFloat(nutrition.goals.targetCarbsGrams || '200');
  const carbsPct = Math.round((carbsConsumed / carbsTarget) * 100);

  const fatConsumed = parseFloat(nutrition.summary?.totalFat || '0');
  const fatTarget = parseFloat(nutrition.goals.targetFatGrams || '65');
  const fatPct = Math.round((fatConsumed / fatTarget) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="rounded-lg border border-gray-800 bg-gray-900/50 p-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Macros Today</h3>
        <Link
          href="/nutrition"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-500 transition active:scale-95 hover:bg-indigo-500/30"
        >
          <Plus className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Compact Nutrition Lines */}
      <div className="space-y-2 font-mono text-xs">
        {/* Calories */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">🔥 Calories</span>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">
              {caloriesConsumed} / {caloriesTarget}
            </span>
            <span className={`${getPercentageColor(caloriesPct)} font-bold min-w-[40px] text-right`}>
              {caloriesPct}%
            </span>
          </div>
        </div>

        {/* Protein */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">🥩 Protein</span>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">
              {Math.round(proteinConsumed)}g / {Math.round(proteinTarget)}g
            </span>
            <span className={`${getPercentageColor(proteinPct)} font-bold min-w-[40px] text-right`}>
              {proteinPct}%
            </span>
          </div>
        </div>

        {/* Carbs */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">🍞 Carbs</span>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">
              {Math.round(carbsConsumed)}g / {Math.round(carbsTarget)}g
            </span>
            <span className={`${getPercentageColor(carbsPct)} font-bold min-w-[40px] text-right`}>
              {carbsPct}%
            </span>
          </div>
        </div>

        {/* Fat */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">🥑 Fat</span>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">
              {Math.round(fatConsumed)}g / {Math.round(fatTarget)}g
            </span>
            <span className={`${getPercentageColor(fatPct)} font-bold min-w-[40px] text-right`}>
              {fatPct}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
