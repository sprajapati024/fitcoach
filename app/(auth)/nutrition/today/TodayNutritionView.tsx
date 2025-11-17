"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { MacroRingCharts } from "@/components/nutrition/MacroRingCharts";
import { CompactMealsList } from "../CompactMealsList";
import { NutritionCoachBrief } from "./components/NutritionCoachBrief";
import { useNutritionSummary, useNutritionGoals } from "@/lib/query/hooks";

export function TodayNutritionView() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch nutrition data using React Query hooks
  const { data: summary, isLoading: summaryLoading } = useNutritionSummary(selectedDate);
  const { data: goals, isLoading: goalsLoading } = useNutritionGoals();

  const loading = summaryLoading || goalsLoading;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split("T")[0]) {
      return "Today";
    } else if (dateString === yesterday.toISOString().split("T")[0]) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
  };

  // Prepare data for MacroRingCharts
  const calories = {
    current: parseInt(summary?.totalCalories?.toString() || "0"),
    goal: goals?.targetCalories || 2000,
  };

  const protein = {
    current: parseFloat(summary?.totalProtein?.toString() || "0"),
    goal: parseFloat(goals?.targetProteinGrams?.toString() || "150"),
  };

  const carbs = {
    current: parseFloat(summary?.totalCarbs?.toString() || "0"),
    goal: parseFloat(goals?.targetCarbsGrams?.toString() || "200"),
  };

  const fat = {
    current: parseFloat(summary?.totalFat?.toString() || "0"),
    goal: parseFloat(goals?.targetFatGrams?.toString() || "70"),
  };

  const water = {
    current: parseInt(summary?.totalWaterMl?.toString() || "0"),
    goal: parseFloat(goals?.targetWaterLiters?.toString() || "2.5") * 1000,
  };

  return (
    <div className="min-h-screen bg-black -mx-4 -mt-6">
      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-3 pt-4 pb-24 space-y-4">
        {/* Header with Back Button and Date */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-lg border border-gray-800 bg-gray-900 hover:bg-gray-800 transition"
            title="Go back"
          >
            <ArrowLeft className="h-4 w-4 text-gray-400" />
          </button>

          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex-1 flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-900 hover:bg-gray-800 transition"
          >
            <span className="text-sm font-medium text-white">
              {formatDate(selectedDate)}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${
                showDatePicker ? "rotate-180" : ""
              }`}
            />
          </button>
        </motion.div>

        {/* Date Picker Dropdown */}
        {showDatePicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 rounded-lg border border-gray-800 bg-gray-900"
          >
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setShowDatePicker(false);
              }}
              max={new Date().toISOString().split("T")[0]}
              className="w-full h-10 px-3 rounded-lg border border-gray-800 bg-gray-950 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            />
            {selectedDate !== new Date().toISOString().split("T")[0] && (
              <button
                onClick={() => {
                  setSelectedDate(new Date().toISOString().split("T")[0]);
                  setShowDatePicker(false);
                }}
                className="w-full mt-2 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition"
              >
                Jump to Today
              </button>
            )}
          </motion.div>
        )}

        {/* MacroRingCharts Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-4 md:p-6 rounded-lg border border-gray-800 bg-gray-900"
        >
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
          ) : (
            <MacroRingCharts
              calories={calories}
              protein={protein}
              carbs={carbs}
              fat={fat}
              water={water}
            />
          )}
        </motion.div>

        {/* Nutrition Coach Brief */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <NutritionCoachBrief date={selectedDate} />
        </motion.div>

        {/* Today's Meals Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Today's Meals
          </h2>
          <CompactMealsList
            date={selectedDate}
            onMealDeleted={() => {
              // Meals list will auto-refresh via React Query
            }}
          />
        </motion.div>
      </main>
    </div>
  );
}
