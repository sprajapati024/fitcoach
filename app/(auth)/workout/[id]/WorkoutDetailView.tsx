"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExerciseLogger, type LoggerResult } from "@/app/(auth)/dashboard/ExerciseLogger";
import { PrimaryButton } from "@/components/PrimaryButton";
import { WorkoutEditor } from "@/components/WorkoutEditor";
import type { workouts, WorkoutPayload } from "@/drizzle/schema";
import { Edit2 } from "lucide-react";

type Workout = typeof workouts.$inferSelect;

interface WorkoutDetailViewProps {
  workout: Workout;
}

export function WorkoutDetailView({ workout }: WorkoutDetailViewProps) {
  const router = useRouter();
  const [isLogging, setIsLogging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const workoutPayload = workout.payload as WorkoutPayload;
  const today = new Date().toISOString().split("T")[0];
  const isPast = workout.sessionDate ? workout.sessionDate < today : false;
  const isFuture = workout.sessionDate ? workout.sessionDate > today : false;

  const handleLoggerComplete = (result: LoggerResult) => {
    void result;
    setIsLogging(false);
    router.refresh();
  };

  if (isLogging) {
    return (
      <ExerciseLogger
        workout={workout}
        onComplete={handleLoggerComplete}
        onCancel={() => setIsLogging(false)}
      />
    );
  }

  // Calculate total exercises
  const totalExercises =
    workoutPayload.blocks?.reduce((sum, block) => sum + (block.exercises?.length ?? 0), 0) ?? 0;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-text-muted text-sm mb-4 hover:text-text-primary"
        >
          ← Back
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {workout.title}
            </h1>
            <div className="flex gap-4 text-sm text-text-muted">
              {workout.sessionDate && (
                <span>
                  {new Date(workout.sessionDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
              <span>Week {(workout.weekIndex || 0) + 1}</span>
            </div>
          </div>
          {workout.isDeload && (
            <span className="text-xs font-medium text-text-muted bg-surface-2 px-2 py-1 rounded">
              Deload Week
            </span>
          )}
        </div>
      </div>

      {/* Workout Summary Card */}
      <div className="bg-surface-1 border border-surface-border rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-text-primary mb-3">Workout Summary</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-text-muted text-xs mb-1">Duration</div>
            <div className="text-text-primary font-medium">
              {workout.durationMinutes} min
            </div>
          </div>
          <div>
            <div className="text-text-muted text-xs mb-1">Exercises</div>
            <div className="text-text-primary font-medium">{totalExercises}</div>
          </div>
          <div>
            <div className="text-text-muted text-xs mb-1">Focus</div>
            <div className="text-text-primary font-medium capitalize">
              {workoutPayload.focus?.replace(/_/g, " ") || "Training"}
            </div>
          </div>
        </div>
      </div>

      {/* Workout Blocks */}
      <div className="space-y-4 mb-6">
        {workoutPayload.blocks?.map((block, blockIndex) => (
          <div
            key={blockIndex}
            className="bg-surface-0 border border-surface-border rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-text-primary">{block.title}</h3>
              <span className="text-xs text-text-muted uppercase tracking-wide">
                {block.type}
              </span>
            </div>

            <div className="space-y-3">
              {block.exercises?.map((exercise, exIndex) => (
                <div
                  key={exIndex}
                  className="bg-surface-1 rounded-md p-3 border border-surface-border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-text-primary mb-1">
                        {exercise.name || exercise.id}
                      </div>
                      <div className="text-sm text-text-muted">
                        {exercise.equipment && (
                          <span className="capitalize">
                            {exercise.equipment.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-text-muted">Sets:</span>{" "}
                      <span className="text-text-primary font-medium">
                        {exercise.sets}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted">Reps:</span>{" "}
                      <span className="text-text-primary font-medium">
                        {exercise.reps}
                      </span>
                    </div>
                    {exercise.tempo && (
                      <div>
                        <span className="text-text-muted">Tempo:</span>{" "}
                        <span className="text-text-primary font-medium">
                          {exercise.tempo}
                        </span>
                      </div>
                    )}
                    {exercise.restSeconds && (
                      <div>
                        <span className="text-text-muted">Rest:</span>{" "}
                        <span className="text-text-primary font-medium">
                          {exercise.restSeconds}s
                        </span>
                      </div>
                    )}
                  </div>

                  {exercise.cues && exercise.cues.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-surface-border">
                      <div className="text-xs text-text-muted mb-1">Form Cues:</div>
                      <ul className="text-xs text-text-secondary space-y-0.5">
                        {exercise.cues.map((cue, cueIndex) => (
                          <li key={cueIndex}>• {cue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="flex gap-3">
          {!isPast && (
            <PrimaryButton
              onClick={() => setIsLogging(true)}
              className="flex-1"
            >
              Start Workout
            </PrimaryButton>
          )}

          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-6 py-3 bg-surface-2 hover:bg-surface-3 text-neutral-200 rounded-lg border border-border"
          >
            <Edit2 className="h-5 w-5" />
            Edit Workout
          </button>
        </div>

        {isFuture && (
          <div className="text-center text-sm text-text-muted">
            This workout is scheduled for{" "}
            {new Date(workout.sessionDate!).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
            })}
          </div>
        )}

        {isPast && (
          <div className="text-center text-sm text-text-muted">
            This workout was scheduled for{" "}
            {new Date(workout.sessionDate!).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
            })}
          </div>
        )}
      </div>

      {/* Workout Editor Modal */}
      <WorkoutEditor
        workout={workout}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={() => {
          setIsEditing(false);
          router.refresh();
        }}
      />
    </div>
  );
}
