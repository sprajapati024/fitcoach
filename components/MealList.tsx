"use client";

import { useEffect, useState } from "react";
import { Edit, Trash2, Sunrise, Sun, Sunset, Cookie } from "lucide-react";
import type { Meal } from "@/drizzle/schema";

interface MealListProps {
  date?: string;
  refreshTrigger?: number;
  onMealDeleted?: () => void;
}

const MEAL_ICONS = {
  breakfast: Sunrise,
  lunch: Sun,
  dinner: Sunset,
  snack: Cookie,
};

const MEAL_COLORS = {
  breakfast: "text-yellow-400",
  lunch: "text-orange-400",
  dinner: "text-indigo-400",
  snack: "text-pink-400",
};

export function MealList({ date, refreshTrigger, onMealDeleted }: MealListProps) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const targetDate = date || new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchMeals();
  }, [targetDate, refreshTrigger]);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/nutrition/meals?date=${targetDate}`);
      if (response.ok) {
        const data = await response.json();
        setMeals(data.meals || []);
      }
    } catch (error) {
      console.error("Error fetching meals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mealId: string) => {
    if (!confirm("Delete this meal?")) return;

    setDeleting(mealId);
    try {
      const response = await fetch(`/api/nutrition/meals?id=${mealId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMeals(meals.filter((m) => m.id !== mealId));
        onMealDeleted?.();
      } else {
        alert("Failed to delete meal");
      }
    } catch (error) {
      console.error("Error deleting meal:", error);
      alert("Failed to delete meal");
    } finally {
      setDeleting(null);
    }
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface-overlay border border-border rounded-lg p-4 animate-pulse"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-surface-hover rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-hover rounded w-32" />
                <div className="h-3 bg-surface-hover rounded w-full" />
                <div className="h-3 bg-surface-hover rounded w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div className="text-center py-12 bg-surface-overlay border border-border rounded-lg">
        <Cookie className="h-12 w-12 text-neutral-500 mx-auto mb-3" />
        <p className="text-neutral-400">No meals logged yet</p>
        <p className="text-sm text-neutral-500 mt-1">Click "Log Meal" to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meals.map((meal) => {
        const Icon = MEAL_ICONS[meal.mealType as keyof typeof MEAL_ICONS];
        const iconColor = MEAL_COLORS[meal.mealType as keyof typeof MEAL_COLORS];
        const calories = meal.calories ? parseInt(meal.calories.toString()) : null;
        const protein = meal.proteinGrams ? parseFloat(meal.proteinGrams.toString()) : null;
        const carbs = meal.carbsGrams ? parseFloat(meal.carbsGrams.toString()) : null;
        const fat = meal.fatGrams ? parseFloat(meal.fatGrams.toString()) : null;

        return (
          <div
            key={meal.id}
            className="bg-surface-overlay border border-border rounded-lg p-4 hover:border-neural-400 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="p-2 bg-surface-hover rounded-lg">
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize">{meal.mealType}</span>
                      <span className="text-xs text-neutral-500">
                        • {formatTime(meal.mealTime)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(meal.id)}
                      disabled={deleting === meal.id}
                      className="p-1.5 hover:bg-red-900/20 rounded text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                      title="Delete meal"
                    >
                      {deleting === meal.id ? (
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-neutral-300 mb-3">{meal.description}</p>

                {/* Nutrition Info */}
                {(calories || protein || carbs || fat) && (
                  <div className="flex flex-wrap gap-3 text-xs">
                    {calories && (
                      <span className="px-2 py-1 bg-orange-900/20 text-orange-300 rounded">
                        {calories} cal
                      </span>
                    )}
                    {protein && (
                      <span className="px-2 py-1 bg-red-900/20 text-red-300 rounded">
                        {protein.toFixed(0)}g P
                      </span>
                    )}
                    {carbs && (
                      <span className="px-2 py-1 bg-yellow-900/20 text-yellow-300 rounded">
                        {carbs.toFixed(0)}g C
                      </span>
                    )}
                    {fat && (
                      <span className="px-2 py-1 bg-purple-900/20 text-purple-300 rounded">
                        {fat.toFixed(0)}g F
                      </span>
                    )}
                  </div>
                )}

                {/* Notes */}
                {meal.notes && (
                  <p className="text-xs text-neutral-500 mt-2 italic">
                    💬 {meal.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
