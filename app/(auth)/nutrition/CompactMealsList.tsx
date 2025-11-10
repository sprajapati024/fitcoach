'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Trash2, Coffee, Utensils, Moon, Cookie } from 'lucide-react';
import { useMealsByDate, useDeleteMeal } from '@/lib/query/hooks';
import { useState } from 'react';

interface CompactMealsListProps {
  date: string;
  refreshTrigger?: number; // Optional, no longer needed with React Query auto-refetch
  onMealDeleted: () => void;
}

interface Meal {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  mealTime: number | string; // Can be timestamp or ISO string
  notes: string | null;
}

const mealIcons = {
  breakfast: Coffee,
  lunch: Utensils,
  dinner: Moon,
  snack: Cookie,
};

const mealColors = {
  breakfast: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
  lunch: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  dinner: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30',
  snack: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
};

export function CompactMealsList({ date, refreshTrigger, onMealDeleted }: CompactMealsListProps) {
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  // Use React Query hooks
  const { data: mealsData, isLoading: loading } = useMealsByDate(date);
  const deleteMutation = useDeleteMeal();

  const meals = mealsData || [];

  const handleDelete = async (mealId: string) => {
    if (!confirm('Delete this meal?')) return;

    try {
      await deleteMutation.mutateAsync(mealId);
      onMealDeleted();
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  const formatTime = (time: number | string) => {
    const date = typeof time === 'number' ? new Date(time) : new Date(time);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-lg border border-gray-800 bg-gray-900 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 rounded-lg border border-gray-800 bg-gray-900"
      >
        <p className="text-gray-400 text-sm">No meals logged yet</p>
        <p className="text-gray-600 text-xs mt-1">Tap "Log Meal" to get started</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {meals.map((meal, index) => {
          const Icon = mealIcons[meal.mealType];
          const isExpanded = expandedMeal === meal.id;

          return (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className={`rounded-lg border bg-gradient-to-br ${mealColors[meal.mealType]} overflow-hidden`}
            >
              {/* Main Row */}
              <button
                onClick={() => setExpandedMeal(isExpanded ? null : meal.id)}
                className="w-full p-3 flex items-center gap-3 hover:bg-white/5 transition"
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-900/50">
                  <Icon className="h-4 w-4 text-gray-300" />
                </div>

                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold uppercase text-gray-300">
                      {meal.mealType}
                    </span>
                    <span className="text-xs text-gray-500">{formatTime(meal.mealTime)}</span>
                  </div>
                  <p className="text-sm text-white line-clamp-1">{meal.description}</p>
                </div>

                {meal.calories && (
                  <div className="text-right">
                    <span className="text-sm font-bold text-white">
                      {meal.calories}
                    </span>
                    <span className="text-xs text-gray-400 ml-0.5">cal</span>
                  </div>
                )}

                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-800"
                  >
                    <div className="p-3 space-y-3">
                      {/* Macros */}
                      {(meal.proteinGrams || meal.carbsGrams || meal.fatGrams) && (
                        <div className="flex items-center gap-4 text-sm">
                          {meal.proteinGrams && (
                            <div>
                              <span className="text-gray-400">Protein: </span>
                              <span className="font-medium text-white">
                                {meal.proteinGrams}g
                              </span>
                            </div>
                          )}
                          {meal.carbsGrams && (
                            <div>
                              <span className="text-gray-400">Carbs: </span>
                              <span className="font-medium text-white">
                                {meal.carbsGrams}g
                              </span>
                            </div>
                          )}
                          {meal.fatGrams && (
                            <div>
                              <span className="text-gray-400">Fat: </span>
                              <span className="font-medium text-white">
                                {meal.fatGrams}g
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {meal.notes && (
                        <div className="text-xs text-gray-400 bg-gray-900/50 rounded p-2">
                          {meal.notes}
                        </div>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(meal.id)}
                        disabled={deleteMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium transition active:scale-95 disabled:opacity-50"
                      >
                        {deleteMutation.isPending ? (
                          <span>Deleting...</span>
                        ) : (
                          <>
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete Meal</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
