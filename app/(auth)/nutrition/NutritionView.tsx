"use client";

import { useState } from "react";
import { Plus, Droplet, Calendar, Target } from "lucide-react";
import { MealLogger } from "@/components/MealLogger";
import { WaterLogger } from "@/components/WaterLogger";
import { NutritionSummary } from "@/components/NutritionSummary";
import { MealList } from "@/components/MealList";
import { PrimaryButton } from "@/components/PrimaryButton";

export function NutritionView() {
  const [showMealLogger, setShowMealLogger] = useState(false);
  const [showWaterLogger, setShowWaterLogger] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const handleMealLogged = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleWaterLogged = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleMealDeleted = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

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

  return (
    <div className="min-h-screen bg-bg0 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Nutrition</h1>
            <p className="text-neutral-400">Track your meals and hydration</p>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="pl-10 pr-4 py-2 bg-surface-1 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Selected Date Display */}
        <div className="flex items-center gap-2 text-neutral-300">
          <span className="text-lg font-medium">{formatDate(selectedDate)}</span>
          {selectedDate !== new Date().toISOString().split("T")[0] && (
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
              className="text-sm text-cyan-400 hover:text-cyan-300"
            >
              Go to today
            </button>
          )}
        </div>

        {/* Nutrition Summary Cards */}
        <NutritionSummary date={selectedDate} refreshTrigger={refreshTrigger} />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <PrimaryButton
            onClick={() => setShowMealLogger(true)}
            className="flex-1 md:flex-initial"
          >
            <Plus className="h-4 w-4" />
            Log Meal
          </PrimaryButton>
          <button
            onClick={() => setShowWaterLogger(true)}
            className="flex-1 md:flex-initial px-6 py-3 bg-cyan-900/20 hover:bg-cyan-900/30 text-cyan-300 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Droplet className="h-4 w-4" />
            Log Water
          </button>
        </div>

        {/* Meals Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">Meals Logged</h2>
          </div>
          <MealList
            date={selectedDate}
            refreshTrigger={refreshTrigger}
            onMealDeleted={handleMealDeleted}
          />
        </div>

        {/* Goals Link */}
        <div className="p-6 bg-surface-1 border border-border rounded-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-900/30 rounded-lg">
              <Target className="h-6 w-6 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Set Your Nutrition Goals</h3>
              <p className="text-sm text-neutral-400 mb-3">
                Customize your daily targets for calories, macros, and hydration
              </p>
              <button className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">
                Configure Goals →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showMealLogger && (
        <MealLogger
          onClose={() => setShowMealLogger(false)}
          onMealLogged={handleMealLogged}
          initialDate={selectedDate}
        />
      )}

      {showWaterLogger && (
        <WaterLogger
          onClose={() => setShowWaterLogger(false)}
          onWaterLogged={handleWaterLogged}
          initialDate={selectedDate}
        />
      )}
    </div>
  );
}
