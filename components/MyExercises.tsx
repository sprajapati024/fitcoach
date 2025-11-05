"use client";

import { useState, useEffect } from "react";
import { UserExercise } from "@/drizzle/schema";
import { Trash2, Info } from "lucide-react";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";

interface MyExercisesProps {
  onExercisesChange?: () => void;
}

export function MyExercises({ onExercisesChange }: MyExercisesProps) {
  const [exercises, setExercises] = useState<UserExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingExercise, setRemovingExercise] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<UserExercise | null>(null);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/exercises");
      const data = await response.json();
      setExercises(data.exercises || []);
    } catch (error) {
      console.error("Error fetching exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    if (!confirm("Remove this exercise from your library?")) return;

    setRemovingExercise(exerciseId);
    try {
      const response = await fetch(`/api/exercises?exerciseId=${exerciseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setExercises(exercises.filter((ex) => ex.exerciseId !== exerciseId));
        onExercisesChange?.();
      } else {
        alert("Failed to remove exercise");
      }
    } catch (error) {
      console.error("Error removing exercise:", error);
      alert("Failed to remove exercise");
    } finally {
      setRemovingExercise(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-neural-400 border-t-transparent"></div>
        <p className="mt-4 text-neutral-400">Loading your exercises...</p>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-400 mb-4">
          You haven't added any exercises to your library yet.
        </p>
        <p className="text-sm text-neutral-500">
          Browse exercises below to add them to your library for tracking.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          My Exercise Library ({exercises.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exercises.map((exercise) => (
          <div
            key={exercise.id}
            className="bg-surface-overlay border border-border rounded-lg overflow-hidden hover:border-neural-400 transition-colors"
          >
            {/* Exercise Image/GIF */}
            {(exercise.imageUrl || exercise.gifUrl) && (
              <div className="aspect-video bg-surface-hover overflow-hidden">
                <img
                  src={exercise.gifUrl || exercise.imageUrl || ""}
                  alt={exercise.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Exercise Info */}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-lg flex-1">{exercise.name}</h3>
                <button
                  onClick={() => setSelectedExercise(exercise)}
                  className="text-neutral-400 hover:text-neural-200"
                  title="View details"
                >
                  <Info className="h-5 w-5" />
                </button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {exercise.bodyParts.slice(0, 2).map((part) => (
                  <span
                    key={part}
                    className="px-2 py-1 bg-neural-900/30 text-neural-300 text-xs rounded"
                  >
                    {part}
                  </span>
                ))}
                {exercise.equipment.slice(0, 1).map((equip) => (
                  <span
                    key={equip}
                    className="px-2 py-1 bg-surface-hover text-neutral-400 text-xs rounded"
                  >
                    {equip}
                  </span>
                ))}
              </div>

              {/* Source Badge */}
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-surface-hover text-neutral-400 text-xs rounded">
                  {exercise.source === "exercisedb"
                    ? "ExerciseDB"
                    : exercise.source === "custom"
                    ? "Custom"
                    : "Built-in"}
                </span>
                {exercise.impactLevel && (
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      exercise.impactLevel === "low"
                        ? "bg-green-900/30 text-green-300"
                        : exercise.impactLevel === "moderate"
                        ? "bg-yellow-900/30 text-yellow-300"
                        : "bg-red-900/30 text-red-300"
                    }`}
                  >
                    {exercise.impactLevel} impact
                  </span>
                )}
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleRemoveExercise(exercise.exerciseId)}
                disabled={removingExercise === exercise.exerciseId}
                className="w-full mt-4 px-4 py-2 bg-red-900/20 hover:bg-red-900/30 text-red-300 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {removingExercise === exercise.exerciseId ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Exercise Details Modal */}
      {selectedExercise && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedExercise(null)}
        >
          <div
            className="bg-surface border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {(selectedExercise.imageUrl || selectedExercise.gifUrl) && (
              <div className="aspect-video bg-surface-hover overflow-hidden">
                <img
                  src={selectedExercise.gifUrl || selectedExercise.imageUrl || ""}
                  alt={selectedExercise.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-6 space-y-4">
              <h2 className="text-2xl font-bold">{selectedExercise.name}</h2>

              {selectedExercise.description && (
                <p className="text-neutral-300">{selectedExercise.description}</p>
              )}

              {selectedExercise.instructions.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Instructions</h3>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-300">
                    {selectedExercise.instructions.map((instruction, i) => (
                      <li key={i}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-2">Equipment</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedExercise.equipment.length > 0 ? (
                      selectedExercise.equipment.map((equip) => (
                        <span
                          key={equip}
                          className="px-2 py-1 bg-surface-hover rounded text-xs"
                        >
                          {equip}
                        </span>
                      ))
                    ) : (
                      <span className="text-neutral-500">None</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Body Parts</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedExercise.bodyParts.map((part) => (
                      <span
                        key={part}
                        className="px-2 py-1 bg-neural-900/30 text-neural-300 rounded text-xs"
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedExercise.targetMuscles.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Target Muscles</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedExercise.targetMuscles.map((muscle) => (
                        <span
                          key={muscle}
                          className="px-2 py-1 bg-surface-hover rounded text-xs"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <PrimaryButton
                  onClick={() => setSelectedExercise(null)}
                  className="flex-1"
                >
                  Close
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
