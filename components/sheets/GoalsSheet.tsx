"use client";

import { useState, useEffect, useRef } from "react";
import { X, Sparkles } from "lucide-react";
import { PrimaryButton } from "../PrimaryButton";

interface GoalsSheetProps {
  open: boolean;
  onClose: () => void;
  onGoalsSet: () => void;
}

export function GoalsSheet({ open, onClose, onGoalsSet }: GoalsSheetProps) {
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [water, setWater] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState(0);

  // Fetch current goals on mount
  useEffect(() => {
    if (open) {
      fetchCurrentGoals();
    }
  }, [open]);

  const fetchCurrentGoals = async () => {
    try {
      const response = await fetch("/api/nutrition/goals");
      if (response.ok) {
        const data = await response.json();
        if (data.goals) {
          setCalories(data.goals.targetCalories?.toString() || "");
          setProtein(data.goals.targetProteinGrams || "");
          setCarbs(data.goals.targetCarbsGrams || "");
          setFat(data.goals.targetFatGrams || "");
          setWater(data.goals.targetWaterLiters || "");
        }
      }
    } catch (err) {
      console.error("Error fetching goals:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const goalsData = {
        targetCalories: calories ? parseInt(calories) : undefined,
        targetProteinGrams: protein ? parseFloat(protein) : undefined,
        targetCarbsGrams: carbs ? parseFloat(carbs) : undefined,
        targetFatGrams: fat ? parseFloat(fat) : undefined,
        targetWaterLiters: water ? parseFloat(water) : undefined,
        calculationMethod: "manual" as const,
      };

      const response = await fetch("/api/nutrition/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalsData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save goals");
      }

      onGoalsSet();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save goals");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIRecommendation = async () => {
    setIsLoadingRecommended(true);
    setError(null);

    try {
      const response = await fetch("/api/nutrition/goals/recommended");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get recommendations");
      }

      if (data.recommended) {
        setCalories(data.recommended.targetCalories?.toString() || "");
        setProtein(data.recommended.targetProteinGrams?.toString() || "");
        setCarbs(data.recommended.targetCarbsGrams?.toString() || "");
        setFat(data.recommended.targetFatGrams?.toString() || "");
        setWater(data.recommended.targetWaterLiters?.toString() || "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get AI recommendations");
    } finally {
      setIsLoadingRecommended(false);
    }
  };

  // Drag-to-dismiss handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setStartY(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startY === null) return;
    const deltaY = e.clientY - startY;
    if (deltaY > 0) {
      // Only allow downward drag
      setCurrentY(deltaY);
    }
  };

  const handlePointerUp = () => {
    if (currentY > 100) {
      // Threshold to dismiss
      onClose();
    }
    setStartY(null);
    setCurrentY(0);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      data-open={open}
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        className="sheet"
        data-open={open}
        style={{
          transform: `translateY(${currentY}px)`,
          transition: startY === null ? 'transform 280ms cubic-bezier(.2,.8,.2,1)' : 'none',
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Handle */}
        <div className="handle" />

        {/* Header */}
        <div className="sticky top-0 bg-surface-1 border-b border-surface-border p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">Nutrition Goals</h2>
          <button
            onClick={onClose}
            className="touch-feedback rounded-full p-2 hover:bg-surface-2 transition-colors"
          >
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100svh - 200px)' }}>
          {error && (
            <div className="p-4 bg-error/10 border border-error/40 rounded-xl text-error-light text-sm">
              {error}
            </div>
          )}

          {/* AI Recommendation Button */}
          <button
            type="button"
            onClick={handleAIRecommendation}
            disabled={isLoadingRecommended}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 rounded-xl text-text-primary font-medium hover:border-indigo-500/50 transition-all disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${isLoadingRecommended ? 'animate-spin' : ''}`} />
            {isLoadingRecommended ? "Calculating..." : "Get AI Recommendations"}
          </button>

          {/* Calories */}
          <div>
            <label htmlFor="calories" className="block text-sm font-medium text-text-primary mb-2">
              Target Calories
            </label>
            <div className="relative">
              <input
                type="number"
                id="calories"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                min="500"
                max="10000"
                placeholder="2000"
                className="w-full px-4 py-3 bg-surface-0 border border-surface-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                kcal
              </span>
            </div>
          </div>

          {/* Protein */}
          <div>
            <label htmlFor="protein" className="block text-sm font-medium text-text-primary mb-2">
              Target Protein
            </label>
            <div className="relative">
              <input
                type="number"
                id="protein"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                min="0"
                max="500"
                step="1"
                placeholder="150"
                className="w-full px-4 py-3 bg-surface-0 border border-surface-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                g
              </span>
            </div>
          </div>

          {/* Carbs */}
          <div>
            <label htmlFor="carbs" className="block text-sm font-medium text-text-primary mb-2">
              Target Carbs
            </label>
            <div className="relative">
              <input
                type="number"
                id="carbs"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                min="0"
                max="1000"
                step="1"
                placeholder="200"
                className="w-full px-4 py-3 bg-surface-0 border border-surface-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                g
              </span>
            </div>
          </div>

          {/* Fat */}
          <div>
            <label htmlFor="fat" className="block text-sm font-medium text-text-primary mb-2">
              Target Fat
            </label>
            <div className="relative">
              <input
                type="number"
                id="fat"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                min="0"
                max="500"
                step="1"
                placeholder="65"
                className="w-full px-4 py-3 bg-surface-0 border border-surface-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                g
              </span>
            </div>
          </div>

          {/* Water */}
          <div>
            <label htmlFor="water" className="block text-sm font-medium text-text-primary mb-2">
              Target Water
            </label>
            <div className="relative">
              <input
                type="number"
                id="water"
                value={water}
                onChange={(e) => setWater(e.target.value)}
                min="0"
                max="10"
                step="0.1"
                placeholder="2.5"
                className="w-full px-4 py-3 bg-surface-0 border border-surface-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                L
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-surface-0 border border-surface-border rounded-xl text-text-primary font-medium hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <PrimaryButton
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              className="flex-1"
            >
              Save Goals
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
