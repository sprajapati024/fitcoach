"use client";

import { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { PrimaryButton } from "@/components/PrimaryButton";

interface MealLoggerProps {
  onClose: () => void;
  onMealLogged: () => void;
  initialDate?: string;
}

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export function MealLogger({ onClose, onMealLogged, initialDate }: MealLoggerProps) {
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [notes, setNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState("");

  const today = initialDate || new Date().toISOString().split("T")[0];
  const now = new Date().toISOString();

  const handleAnalyze = async () => {
    if (!description.trim()) {
      setError("Please describe what you ate");
      return;
    }

    setAnalyzing(true);
    setError("");

    try {
      const response = await fetch("/api/nutrition/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealDescription: description }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze meal");
      }

      const data = await response.json();

      // Auto-fill nutrition fields
      setCalories(data.estimatedNutrition.calories.toString());
      setProtein(data.estimatedNutrition.proteinGrams.toFixed(1));
      setCarbs(data.estimatedNutrition.carbsGrams.toFixed(1));
      setFat(data.estimatedNutrition.fatGrams.toFixed(1));
      if (data.estimatedNutrition.fiberGrams) {
        setFiber(data.estimatedNutrition.fiberGrams.toFixed(1));
      }

      // Add breakdown to notes if suggestion exists
      if (data.suggestion) {
        setNotes(data.suggestion);
      }
    } catch (err) {
      console.error("Error analyzing meal:", err);
      setError("Could not analyze meal. Please enter nutrition manually.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError("Please describe what you ate");
      return;
    }

    setLogging(true);
    setError("");

    try {
      const response = await fetch("/api/nutrition/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealDate: today,
          mealTime: now,
          mealType,
          description: description.trim(),
          calories: calories ? parseInt(calories) : undefined,
          proteinGrams: protein ? parseFloat(protein) : undefined,
          carbsGrams: carbs ? parseFloat(carbs) : undefined,
          fatGrams: fat ? parseFloat(fat) : undefined,
          fiberGrams: fiber ? parseFloat(fiber) : undefined,
          notes: notes.trim() || undefined,
          source: "manual",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to log meal");
      }

      onMealLogged();
      onClose();
    } catch (err) {
      console.error("Error logging meal:", err);
      setError("Failed to log meal. Please try again.");
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Log Meal</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Meal Type */}
          <div>
            <label className="block text-sm font-medium mb-3">Meal Type</label>
            <div className="grid grid-cols-4 gap-2">
              {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mealType === type
                      ? "bg-neural-400 text-gray-950"
                      : "bg-surface-hover hover:bg-surface-border"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">What did you eat?</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., Grilled chicken breast, brown rice, steamed broccoli with olive oil"
              className="w-full px-4 py-3 bg-surface-overlay border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-neural-400 min-h-[100px]"
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-neutral-500">{description.length}/1000</span>
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !description.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-gray-950 rounded-lg font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    AI Analyze
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Nutrition Info */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Nutrition Info (Optional - Auto-filled by AI)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Calories</label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-surface-overlay border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-neural-400"
                  min="0"
                  max="10000"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-surface-overlay border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-neural-400"
                  min="0"
                  max="500"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-surface-overlay border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-neural-400"
                  min="0"
                  max="1000"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Fat (g)</label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-surface-overlay border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-neural-400"
                  min="0"
                  max="500"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Fiber (g)</label>
                <input
                  type="number"
                  value={fiber}
                  onChange={(e) => setFiber(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-surface-overlay border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-neural-400"
                  min="0"
                  max="200"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did you feel? Any observations?"
              className="w-full px-4 py-3 bg-surface-overlay border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-neural-400 min-h-[80px]"
              maxLength={500}
            />
            <span className="text-xs text-neutral-500">{notes.length}/500</span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-surface-hover hover:bg-surface-border rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <PrimaryButton
              onClick={handleSubmit}
              disabled={logging || !description.trim()}
              className="flex-1"
            >
              {logging ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging...
                </>
              ) : (
                "Log Meal"
              )}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
