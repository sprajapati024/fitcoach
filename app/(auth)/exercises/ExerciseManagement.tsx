"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MyExercises } from "@/components/MyExercises";
import { ExerciseBrowser } from "@/components/ExerciseBrowser";
import { Library, Search } from "lucide-react";

export function ExerciseManagement() {
  const [activeTab, setActiveTab] = useState<"library" | "browse">("library");
  const [savedExerciseIds, setSavedExerciseIds] = useState<string[]>([]);

  useEffect(() => {
    fetchSavedExerciseIds();
  }, []);

  const fetchSavedExerciseIds = async () => {
    try {
      const response = await fetch("/api/exercises");
      const data = await response.json();
      setSavedExerciseIds(
        (data.exercises || []).map((ex: any) => ex.exerciseId)
      );
    } catch (error) {
      console.error("Error fetching saved exercises:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black -mx-4 -mt-6 -mb-32">
      {/* Header - Sticky */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800 md:hidden"
      >
        <div className="flex items-center justify-between h-14 px-4">
          <div>
            <h1 className="text-xl font-bold text-white">Exercises</h1>
            <p className="text-xs text-gray-500">Browse and manage library</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-0">
          <button
            onClick={() => setActiveTab("library")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "library"
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Library className="h-4 w-4" />
            <span>My Library</span>
          </button>
          <button
            onClick={() => setActiveTab("browse")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "browse"
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Search className="h-4 w-4" />
            <span>Browse</span>
          </button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-3 pt-4 pb-20">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "library" && (
            <MyExercises onExercisesChange={fetchSavedExerciseIds} />
          )}
          {activeTab === "browse" && (
            <ExerciseBrowser
              onAddExercise={fetchSavedExerciseIds}
              savedExerciseIds={savedExerciseIds}
            />
          )}
        </motion.div>

        {/* Spacer for bottom navigation */}
        <div className="h-20" />
      </main>
    </div>
  );
}
