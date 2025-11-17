/**
 * Example Usage of MacroRingCharts Component
 *
 * This file demonstrates how to integrate the MacroRingCharts
 * component into your nutrition tracking views.
 */

import { MacroRingCharts } from "./MacroRingCharts";
import { useNutritionSummary, useNutritionGoals } from "@/lib/query/hooks";

/**
 * Example 1: Basic Usage with Static Data
 */
export function BasicExample() {
  return (
    <div className="p-6 bg-surface-0">
      <h2 className="text-lg font-semibold mb-4">Today's Progress</h2>
      <MacroRingCharts
        calories={{ current: 1650, goal: 2000 }}
        protein={{ current: 135, goal: 150 }}
        carbs={{ current: 175, goal: 200 }}
        fat={{ current: 58, goal: 65 }}
        water={{ current: 2100, goal: 2500 }}
      />
    </div>
  );
}

/**
 * Example 2: Integration with React Query
 */
export function IntegratedExample({ date }: { date: string }) {
  const { data: summary, isLoading: summaryLoading } = useNutritionSummary(date);
  const { data: goals, isLoading: goalsLoading } = useNutritionGoals();

  if (summaryLoading || goalsLoading) {
    return (
      <div className="p-6 bg-surface-0 animate-pulse">
        <div className="h-32 bg-surface-1 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-surface-0">
      <h2 className="text-lg font-semibold mb-4">Today's Progress</h2>
      <MacroRingCharts
        calories={{
          current: parseInt(summary?.totalCalories?.toString() || "0"),
          goal: goals?.targetCalories || 2000,
        }}
        protein={{
          current: parseFloat(summary?.totalProtein?.toString() || "0"),
          goal: parseFloat(goals?.targetProteinGrams?.toString() || "150"),
        }}
        carbs={{
          current: parseFloat(summary?.totalCarbs?.toString() || "0"),
          goal: parseFloat(goals?.targetCarbsGrams?.toString() || "200"),
        }}
        fat={{
          current: parseFloat(summary?.totalFat?.toString() || "0"),
          goal: parseFloat(goals?.targetFatGrams?.toString() || "65"),
        }}
        water={{
          current: parseInt(summary?.totalWaterMl?.toString() || "0"),
          goal: parseFloat(goals?.targetWaterLiters?.toString() || "2.5") * 1000,
        }}
      />
    </div>
  );
}

/**
 * Example 3: Compact Card Layout
 * Perfect for dashboard widgets or smaller views
 */
export function CompactExample() {
  return (
    <div className="rounded-lg border border-border bg-surface-1 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">Nutrition</h3>
        <button className="text-xs text-cyan-400 hover:text-cyan-300">
          View Details
        </button>
      </div>
      <MacroRingCharts
        calories={{ current: 1800, goal: 2000 }}
        protein={{ current: 120, goal: 150 }}
        carbs={{ current: 180, goal: 200 }}
        fat={{ current: 55, goal: 65 }}
        water={{ current: 2000, goal: 2500 }}
      />
    </div>
  );
}

/**
 * Example 4: Showing Overflow State
 * Demonstrates what happens when you exceed your goals
 */
export function OverflowExample() {
  return (
    <div className="p-6 bg-surface-0">
      <h2 className="text-lg font-semibold mb-4">Over Goal Example</h2>
      <MacroRingCharts
        calories={{ current: 2350, goal: 2000 }} // 117% - over goal
        protein={{ current: 165, goal: 150 }} // 110% - over goal
        carbs={{ current: 220, goal: 200 }} // 110% - over goal
        fat={{ current: 55, goal: 65 }} // 85% - warning state
        water={{ current: 1200, goal: 2500 }} // 48% - danger state
      />
    </div>
  );
}
