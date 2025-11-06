'use client';

import { motion } from 'framer-motion';
import { Flame, Mic, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  const [summary, setSummary] = useState<NutritionData | null>(null);
  const [goals, setGoals] = useState<NutritionGoals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [date, refreshTrigger]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [summaryRes, goalsRes] = await Promise.all([
        fetch(`/api/nutrition/summary?date=${date}`),
        fetch('/api/nutrition/goals'),
      ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(
          summaryData.summary || {
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFat: 0,
            totalWaterMl: 0,
          }
        );
      }

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setGoals(goalsData.goals);
      }
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      className={`relative overflow-hidden rounded-lg border p-4 ${
        isOverGoal
          ? 'border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-red-500/10'
          : 'border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10'
      }`}
    >
      <div className="space-y-3">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-cyan-500">
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
                isOverGoal
                  ? 'bg-gradient-to-r from-orange-500 to-red-500'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-600'
              }`}
              style={{ width: `${Math.min(caloriesPercent, 100)}%` }}
            />
          </div>

          {isOverGoal && (
            <p className="text-xs text-orange-400 mt-1">
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
          className="w-full flex items-center justify-center gap-2 h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 font-semibold text-white shadow-lg shadow-cyan-500/20 transition active:scale-95 hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          <span>Log Meal</span>
        </button>
      </div>
    </motion.div>
  );
}
