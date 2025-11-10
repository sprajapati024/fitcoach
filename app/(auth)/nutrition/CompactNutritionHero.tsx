'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useNutritionSummary, useNutritionGoals } from '@/lib/query/hooks';

interface CompactNutritionHeroProps {
  date: string;
  refreshTrigger: number;
  onLogMeal: () => void;
}

interface NutritionData {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalWaterMl: number;
}

interface NutritionGoals {
  targetCalories?: number;
  targetProteinGrams?: number;
  targetCarbsGrams?: number;
  targetFatGrams?: number;
  targetWaterLiters?: number;
}

export function CompactNutritionHero({
  date,
  refreshTrigger,
  onLogMeal,
}: CompactNutritionHeroProps) {
  // Use React Query hooks
  const { data: summary, isLoading: summaryLoading } = useNutritionSummary(date);
  const { data: goals, isLoading: goalsLoading } = useNutritionGoals();

  const loading = summaryLoading || goalsLoading;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="relative overflow-hidden rounded-lg border border-gray-800 bg-gray-900 p-4 animate-pulse"
      >
        <div className="h-20" />
      </motion.div>
    );
  }

  const calories = parseInt(summary?.totalCalories?.toString() || '0');
  const protein = parseFloat(summary?.totalProtein?.toString() || '0');
  const carbs = parseFloat(summary?.totalCarbs?.toString() || '0');
  const fat = parseFloat(summary?.totalFat?.toString() || '0');
  const waterMl = parseInt(summary?.totalWaterMl?.toString() || '0');
  const waterL = (waterMl / 1000).toFixed(1);

  const targetCalories = goals?.targetCalories || 2000;
  const targetProtein = parseFloat(goals?.targetProteinGrams?.toString() || '150');
  const targetCarbs = parseFloat(goals?.targetCarbsGrams?.toString() || '200');
  const targetWater = parseFloat(goals?.targetWaterLiters?.toString() || '2.5');

  const caloriesPercent = Math.min((calories / targetCalories) * 100, 100);
  const isOverGoal = calories > targetCalories;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="relative overflow-hidden rounded-lg border border-gray-700 bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-4"
    >
      <div className="space-y-3">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-300">
            Today
          </span>
        </div>

        {/* Calories Progress */}
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-white">
              {calories.toLocaleString()}
            </span>
            <span className="text-sm text-gray-400">/ {targetCalories.toLocaleString()}</span>
            <span className="text-xs text-gray-500">cal</span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isOverGoal ? 'bg-red-500' : 'bg-gray-600'
              }`}
              style={{ width: `${Math.min(caloriesPercent, 100)}%` }}
            />
          </div>

          {isOverGoal && (
            <p className="text-xs text-red-400 mt-1">
              +{calories - targetCalories} cal over goal
            </p>
          )}
        </div>

        {/* Macros One-Liner */}
        <div className="flex items-center gap-4 text-gray-400 text-sm">
          <div className="flex items-center gap-1.5">
            <span>🥩</span>
            <span className="font-medium">
              {protein.toFixed(0)}g
            </span>
            <span className="text-xs text-gray-600">/ {targetProtein}g</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🌾</span>
            <span className="font-medium">
              {carbs.toFixed(0)}g
            </span>
            <span className="text-xs text-gray-600">/ {targetCarbs}g</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>💧</span>
            <span className="font-medium">{waterL}L</span>
            <span className="text-xs text-gray-600">/ {targetWater}L</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onLogMeal}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-lg bg-gray-800 font-semibold text-white transition active:scale-95 hover:bg-gray-700"
        >
          <Plus className="h-4 w-4" />
          <span>Log Meal</span>
        </button>
      </div>
    </motion.div>
  );
}
