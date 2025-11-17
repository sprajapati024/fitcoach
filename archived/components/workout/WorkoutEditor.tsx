"use client";

import { useState, useEffect } from "react";
import { Workout } from "@/drizzle/schema";
import {
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Edit2,
} from "lucide-react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ExercisePicker } from "@/components/ExercisePicker";
import type { UserExercise } from "@/drizzle/schema";

type Exercise = {
  id: string;
  name: string;
  equipment: string;
  sets: number;
  reps: string;
  tempo?: string;
  cues?: string[];
  restSeconds?: number;
  notes?: string;
};

type Block = {
  type: string;
  title: string;
  exercises: Exercise[];
  durationMinutes?: number;
};

type WorkoutPayload = {
  workoutId: string;
  focus: string;
  blocks: Block[];
};

interface WorkoutEditorProps {
  workout: Workout;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export function WorkoutEditor({
  workout,
  isOpen,
  onClose,
  onSave,
}: WorkoutEditorProps) {
  const [payload, setPayload] = useState<WorkoutPayload | null>(null);
  const [saving, setSaving] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(
    null
  );
  const [editingExercise, setEditingExercise] = useState<{
    blockIndex: number;
    exerciseIndex: number;
    field: string;
    value: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && workout) {
      setPayload(workout.payload as WorkoutPayload);
    }
  }, [isOpen, workout]);

  const handleAddExercise = (blockIndex: number) => {
    setSelectedBlockIndex(blockIndex);
    setShowExercisePicker(true);
  };

  const handleSelectExercise = async (userExercise: UserExercise) => {
    if (selectedBlockIndex === null || !payload) return;

    const newExercise: Exercise = {
      id: userExercise.exerciseId,
      name: userExercise.name,
      equipment: userExercise.equipment[0] || "bodyweight",
      sets: 3,
      reps: "10-12",
      tempo: "2-0-2-0",
      cues: [],
      restSeconds: 60,
    };

    try {
      const response = await fetch(
        `/api/workouts/${workout.id}/exercises`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blockIndex: selectedBlockIndex,
            exercise: newExercise,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPayload(data.workout.payload);
      } else {
        alert("Failed to add exercise");
      }
    } catch (error) {
      console.error("Error adding exercise:", error);
      alert("Failed to add exercise");
    }

    setShowExercisePicker(false);
    setSelectedBlockIndex(null);
  };

  const handleRemoveExercise = async (
    blockIndex: number,
    exerciseId: string
  ) => {
    if (!confirm("Remove this exercise from the workout?")) return;

    try {
      const response = await fetch(
        `/api/workouts/${workout.id}/exercises?blockIndex=${blockIndex}&exerciseId=${exerciseId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Update local state
        const newPayload = { ...payload! };
        newPayload.blocks[blockIndex].exercises = newPayload.blocks[
          blockIndex
        ].exercises.filter((ex) => ex.id !== exerciseId);
        setPayload(newPayload);
      } else {
        alert("Failed to remove exercise");
      }
    } catch (error) {
      console.error("Error removing exercise:", error);
      alert("Failed to remove exercise");
    }
  };

  const handleUpdateExercise = async (
    blockIndex: number,
    exerciseId: string,
    updates: Partial<Exercise>
  ) => {
    try {
      const response = await fetch(
        `/api/workouts/${workout.id}/exercises`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blockIndex,
            exerciseId,
            updates,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Update local state
        const newPayload = { ...payload! };
        const exerciseIndex = newPayload.blocks[blockIndex].exercises.findIndex(
          (ex) => ex.id === exerciseId
        );
        if (exerciseIndex !== -1) {
          newPayload.blocks[blockIndex].exercises[exerciseIndex] = data.exercise;
          setPayload(newPayload);
        }
      } else {
        alert("Failed to update exercise");
      }
    } catch (error) {
      console.error("Error updating exercise:", error);
      alert("Failed to update exercise");
    }
  };

  const handleMoveExercise = async (
    blockIndex: number,
    exerciseId: string,
    direction: "up" | "down"
  ) => {
    const exercises = payload!.blocks[blockIndex].exercises;
    const currentIndex = exercises.findIndex((ex) => ex.id === exerciseId);
    const newPosition =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newPosition < 0 || newPosition >= exercises.length) return;

    try {
      const response = await fetch(
        `/api/workouts/${workout.id}/exercises/reorder`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blockIndex,
            exerciseId,
            newPosition,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Update local state
        const newPayload = { ...payload! };
        newPayload.blocks[blockIndex].exercises = data.exercises;
        setPayload(newPayload);
      } else {
        alert("Failed to reorder exercise");
      }
    } catch (error) {
      console.error("Error reordering exercise:", error);
      alert("Failed to reorder exercise");
    }
  };

  const startEditingField = (
    blockIndex: number,
    exerciseIndex: number,
    field: string,
    currentValue: string | number
  ) => {
    setEditingExercise({
      blockIndex,
      exerciseIndex,
      field,
      value: String(currentValue),
    });
  };

  const saveEditingField = async () => {
    if (!editingExercise || !payload) return;

    const { blockIndex, exerciseIndex, field, value } = editingExercise;
    const exercise = payload.blocks[blockIndex].exercises[exerciseIndex];

    const updates: Partial<Exercise> = {
      [field]: field === "sets" || field === "restSeconds" ? parseInt(value) : value,
    };

    await handleUpdateExercise(blockIndex, exercise.id, updates);
    setEditingExercise(null);
  };

  const cancelEditingField = () => {
    setEditingExercise(null);
  };

  const renderEditableField = (
    blockIndex: number,
    exerciseIndex: number,
    field: string,
    value: string | number,
    label: string
  ) => {
    const isEditing =
      editingExercise &&
      editingExercise.blockIndex === blockIndex &&
      editingExercise.exerciseIndex === exerciseIndex &&
      editingExercise.field === field;

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">{label}:</span>
          <input
            type="text"
            value={editingExercise.value}
            onChange={(e) =>
              setEditingExercise({ ...editingExercise, value: e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEditingField();
              if (e.key === "Escape") cancelEditingField();
            }}
            onBlur={saveEditingField}
            autoFocus
            className="w-20 px-2 py-1 bg-surface-2 border border-neural-400 rounded text-sm"
          />
        </div>
      );
    }

    return (
      <button
        onClick={() => startEditingField(blockIndex, exerciseIndex, field, value)}
        className="flex items-center gap-1 hover:bg-surface-2 px-2 py-1 rounded"
      >
        <span className="text-xs text-neutral-400">{label}:</span>
        <span className="text-sm font-medium">{value}</span>
        <Edit2 className="h-3 w-3 text-neutral-500" />
      </button>
    );
  };

  if (!isOpen || !payload) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <div
          className="bg-gray-900 border border-border rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{workout.title}</h2>
                <p className="text-neutral-400 mt-1">{workout.focus}</p>
              </div>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Workout Blocks */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {payload.blocks.map((block, blockIndex) => (
              <div
                key={blockIndex}
                className="bg-surface-1 border border-border rounded-lg overflow-hidden"
              >
                {/* Block Header */}
                <div className="bg-surface-2 px-4 py-3 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{block.title}</h3>
                    <p className="text-xs text-neutral-400 uppercase">
                      {block.type}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddExercise(blockIndex)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-neural-500 hover:bg-neural-600 text-white rounded-md text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Exercise
                  </button>
                </div>

                {/* Exercises */}
                <div className="divide-y divide-border">
                  {block.exercises.length === 0 ? (
                    <div className="p-8 text-center text-neutral-400">
                      No exercises in this block yet. Click "Add Exercise" to get
                      started.
                    </div>
                  ) : (
                    block.exercises.map((exercise, exerciseIndex) => (
                      <div
                        key={exercise.id}
                        className="p-4 hover:bg-surface-2/50"
                      >
                        <div className="flex items-start gap-4">
                          {/* Reorder Buttons */}
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() =>
                                handleMoveExercise(
                                  blockIndex,
                                  exercise.id,
                                  "up"
                                )
                              }
                              disabled={exerciseIndex === 0}
                              className="p-1 hover:bg-surface-3 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleMoveExercise(
                                  blockIndex,
                                  exercise.id,
                                  "down"
                                )
                              }
                              disabled={
                                exerciseIndex === block.exercises.length - 1
                              }
                              className="p-1 hover:bg-surface-3 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Exercise Info */}
                          <div className="flex-1">
                            <h4 className="font-semibold">{exercise.name}</h4>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {exercise.equipment}
                            </p>

                            {/* Editable Fields */}
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              {renderEditableField(
                                blockIndex,
                                exerciseIndex,
                                "sets",
                                exercise.sets,
                                "Sets"
                              )}
                              {renderEditableField(
                                blockIndex,
                                exerciseIndex,
                                "reps",
                                exercise.reps,
                                "Reps"
                              )}
                              {exercise.tempo &&
                                renderEditableField(
                                  blockIndex,
                                  exerciseIndex,
                                  "tempo",
                                  exercise.tempo,
                                  "Tempo"
                                )}
                              {exercise.restSeconds !== undefined &&
                                renderEditableField(
                                  blockIndex,
                                  exerciseIndex,
                                  "restSeconds",
                                  exercise.restSeconds,
                                  "Rest (s)"
                                )}
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() =>
                              handleRemoveExercise(blockIndex, exercise.id)
                            }
                            className="p-2 text-red-400 hover:bg-red-900/20 rounded"
                            title="Remove exercise"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-surface-2 hover:bg-surface-3 text-neutral-200 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Exercise Picker Modal */}
      <ExercisePicker
        isOpen={showExercisePicker}
        onClose={() => {
          setShowExercisePicker(false);
          setSelectedBlockIndex(null);
        }}
        onSelectExercise={handleSelectExercise}
        selectedExerciseIds={
          selectedBlockIndex !== null
            ? payload.blocks[selectedBlockIndex].exercises.map((ex) => ex.id)
            : []
        }
      />
    </>
  );
}
