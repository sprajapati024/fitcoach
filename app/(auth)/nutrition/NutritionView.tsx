"use client";

import { useState } from "react";
import { Droplet, ChevronDown, Target } from "lucide-react";
import { MealLogger } from "@/components/MealLogger";
import { WaterLogger } from "@/components/WaterLogger";
import { GoalsModal } from "@/components/GoalsModal";
import { CompactNutritionHero } from "./CompactNutritionHero";
import { CompactMealsList } from "./CompactMealsList";
import { motion } from "framer-motion";

export function NutritionView() {
  const [showMealLogger, setShowMealLogger] = useState(false);
  const [showWaterLogger, setShowWaterLogger] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleMealLogged = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleWaterLogged = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleMealDeleted = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleGoalsSet = () => {
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
    <div className="min-h-screen bg-black -mx-4 -mt-6">
      {/* Main Content */}
      <main className="mx-auto max-w-md px-3 pt-4 pb-24 space-y-3">
        {/* Date Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-900 hover:bg-gray-800 transition"
          >
            <span className="text-sm font-medium text-white">{formatDate(selectedDate)}</span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
          </button>

          {showDatePicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 p-3 rounded-lg border border-gray-800 bg-gray-900"
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
        </motion.div>

        {/* Hero Card */}
        <CompactNutritionHero
          date={selectedDate}
          refreshTrigger={refreshTrigger}
          onLogMeal={() => setShowMealLogger(true)}
        />

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowWaterLogger(true)}
              className="flex items-center justify-center gap-2 h-12 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-medium transition active:scale-95 hover:bg-cyan-500/20"
            >
              <Droplet className="h-4 w-4" />
              <span>Log Water</span>
            </button>
            <button
              onClick={() => setShowGoalsModal(true)}
              className="flex items-center justify-center gap-2 h-12 rounded-lg border border-gray-800 bg-gray-900 text-gray-300 font-medium transition active:scale-95 hover:bg-gray-800"
            >
              <Target className="h-4 w-4" />
              <span>Goals</span>
            </button>
          </div>
        </motion.div>

        {/* Meals List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Meals Today
          </h2>
          <CompactMealsList
            date={selectedDate}
            refreshTrigger={refreshTrigger}
            onMealDeleted={handleMealDeleted}
          />
        </motion.div>
      </main>

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

      {showGoalsModal && (
        <GoalsModal
          onClose={() => setShowGoalsModal(false)}
          onGoalsSet={handleGoalsSet}
        />
      )}
    </div>
  );
}
