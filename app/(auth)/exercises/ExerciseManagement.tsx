"use client";

import { useState, useEffect } from "react";
import { MyExercises } from "@/components/MyExercises";
import { ExerciseBrowser } from "@/components/ExerciseBrowser";
import { Dumbbell, Library, Search } from "lucide-react";

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
    <div className="min-h-screen bg-surface p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Dumbbell className="h-8 w-8 text-neural-400" />
            Exercise Library
          </h1>
          <p className="text-neutral-400">
            Browse exercises from ExerciseDB and save them to your personal library for tracking
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab("library")}
              className={`pb-4 px-2 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "library"
                  ? "border-neural-400 text-neutral-100"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Library className="h-5 w-5" />
              <span className="font-medium">My Library</span>
            </button>
            <button
              onClick={() => setActiveTab("browse")}
              className={`pb-4 px-2 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "browse"
                  ? "border-neural-400 text-neutral-100"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Search className="h-5 w-5" />
              <span className="font-medium">Browse Exercises</span>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="mt-8">
          {activeTab === "library" && (
            <MyExercises onExercisesChange={fetchSavedExerciseIds} />
          )}
          {activeTab === "browse" && (
            <ExerciseBrowser
              onAddExercise={fetchSavedExerciseIds}
              savedExerciseIds={savedExerciseIds}
            />
          )}
        </div>
      </div>
    </div>
  );
}
