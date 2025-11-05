"use client";

import { useEffect, useState } from "react";
import { Flame, Beef, Wheat, Droplet } from "lucide-react";

interface NutritionSummaryProps {
  date?: string;
  refreshTrigger?: number;
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

export function NutritionSummary({ date, refreshTrigger }: NutritionSummaryProps) {
  const [summary, setSummary] = useState<NutritionData | null>(null);
  const [goals, setGoals] = useState<NutritionGoals | null>(null);
  const [loading, setLoading] = useState(true);

  const targetDate = date || new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchData();
  }, [targetDate, refreshTrigger]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch summary and goals in parallel
      const [summaryRes, goalsRes] = await Promise.all([
        fetch(`/api/nutrition/summary?date=${targetDate}`),
        fetch("/api/nutrition/goals"),
      ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary || {
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          totalWaterMl: 0,
        });
      }

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setGoals(goalsData.goals);
      }
    } catch (error) {
      console.error("Error fetching nutrition data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface-1 border border-border rounded-lg p-4 animate-pulse">
            <div className="h-8 w-8 bg-surface-2 rounded-lg mb-3" />
            <div className="h-4 bg-surface-2 rounded w-20 mb-2" />
            <div className="h-8 bg-surface-2 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  const calories = parseInt(summary?.totalCalories?.toString() || "0");
  const protein = parseFloat(summary?.totalProtein?.toString() || "0");
  const carbs = parseFloat(summary?.totalCarbs?.toString() || "0");
  const fat = parseFloat(summary?.totalFat?.toString() || "0");
  const waterMl = parseInt(summary?.totalWaterMl?.toString() || "0");
  const waterL = (waterMl / 1000).toFixed(1);

  const targetCalories = goals?.targetCalories || 2000;
  const targetProtein = parseFloat(goals?.targetProteinGrams?.toString() || "150");
  const targetCarbs = parseFloat(goals?.targetCarbsGrams?.toString() || "200");
  const targetFat = parseFloat(goals?.targetFatGrams?.toString() || "65");
  const targetWater = parseFloat(goals?.targetWaterLiters?.toString() || "2.5");

  const caloriesPercent = Math.min((calories / targetCalories) * 100, 100);
  const proteinPercent = Math.min((protein / targetProtein) * 100, 100);
  const carbsPercent = Math.min((carbs / targetCarbs) * 100, 100);
  const fatPercent = Math.min((fat / targetFat) * 100, 100);
  const waterPercent = Math.min((parseFloat(waterL) / targetWater) * 100, 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Calories */}
      <div className="bg-surface-1 border border-border rounded-lg p-4 hover:border-cyan-400 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-orange-900/20 rounded-lg">
            <Flame className="h-5 w-5 text-orange-400" />
          </div>
          <span className="text-sm font-medium text-neutral-400">Calories</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{calories}</span>
            <span className="text-sm text-neutral-400">/ {targetCalories}</span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
              style={{ width: `${caloriesPercent}%` }}
            />
          </div>
          <span className="text-xs text-neutral-500">{Math.round(caloriesPercent)}%</span>
        </div>
      </div>

      {/* Protein */}
      <div className="bg-surface-1 border border-border rounded-lg p-4 hover:border-cyan-400 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-red-900/20 rounded-lg">
            <Beef className="h-5 w-5 text-red-400" />
          </div>
          <span className="text-sm font-medium text-neutral-400">Protein</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{protein.toFixed(0)}g</span>
            <span className="text-sm text-neutral-400">/ {targetProtein}g</span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
          <span className="text-xs text-neutral-500">{Math.round(proteinPercent)}%</span>
        </div>
      </div>

      {/* Carbs */}
      <div className="bg-surface-1 border border-border rounded-lg p-4 hover:border-cyan-400 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-yellow-900/20 rounded-lg">
            <Wheat className="h-5 w-5 text-yellow-400" />
          </div>
          <span className="text-sm font-medium text-neutral-400">Carbs</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{carbs.toFixed(0)}g</span>
            <span className="text-sm text-neutral-400">/ {targetCarbs}g</span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 transition-all duration-500"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
          <span className="text-xs text-neutral-500">{Math.round(carbsPercent)}%</span>
        </div>
      </div>

      {/* Water */}
      <div className="bg-surface-1 border border-border rounded-lg p-4 hover:border-cyan-400 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-cyan-900/20 rounded-lg">
            <Droplet className="h-5 w-5 text-cyan-400" />
          </div>
          <span className="text-sm font-medium text-neutral-400">Water</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{waterL}L</span>
            <span className="text-sm text-neutral-400">/ {targetWater}L</span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 transition-all duration-500"
              style={{ width: `${waterPercent}%` }}
            />
          </div>
          <span className="text-xs text-neutral-500">{Math.round(waterPercent)}%</span>
        </div>
      </div>
    </div>
  );
}
