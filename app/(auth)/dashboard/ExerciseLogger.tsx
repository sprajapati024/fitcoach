'use client';

import { useState } from 'react';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { workouts, WorkoutPayload } from '@/drizzle/schema';

type Workout = typeof workouts.$inferSelect;

interface LogEntry {
  exerciseId: string;
  set: number;
  weight: number;
  reps: number;
  rpe?: number;
  notes?: string;
}

interface ExerciseLoggerProps {
  workout: Workout;
  onComplete: () => void;
  onCancel: () => void;
}

type WorkoutBlock = WorkoutPayload["blocks"][number];
type WorkoutExercise = WorkoutBlock["exercises"][number];

interface FlattenedExercise extends WorkoutExercise {
  blockTitle: string;
  blockType: WorkoutBlock["type"];
}

export function ExerciseLogger({ workout, onComplete, onCancel }: ExerciseLoggerProps) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [notes, setNotes] = useState('');
  const [rpeLastSet, setRpeLastSet] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const workoutPayload = workout.payload as WorkoutPayload;

  // Flatten all exercises from all blocks
  const allExercises: FlattenedExercise[] = workoutPayload.blocks?.flatMap((block) =>
    block.exercises?.map((exercise) => ({
      ...exercise,
      blockTitle: block.title,
      blockType: block.type,
    })) ?? []
  ) ?? [];

  const currentExercise = allExercises[currentExerciseIndex];

  // Get current exercise's logged sets
  const currentExerciseSets = entries.filter(
    (e) => e.exerciseId === currentExercise?.id
  );
  const nextSetNumber = currentExerciseSets.length + 1;

  const handleLogSet = () => {
    if (!weight || !reps) {
      alert('Please fill in weight and reps');
      return;
    }

    if (!currentExercise) return;

    const newEntry: LogEntry = {
      exerciseId: currentExercise.id,
      set: nextSetNumber,
      weight: parseFloat(weight),
      reps: parseInt(reps, 10),
      rpe: rpe ? parseFloat(rpe) : undefined,
      notes: notes.trim() || undefined,
    };

    setEntries([...entries, newEntry]);

    // Clear inputs for next set
    setWeight('');
    setReps('');
    setRpe('');
    setNotes('');
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < allExercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      // Clear inputs
      setWeight('');
      setReps('');
      setRpe('');
      setNotes('');
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      // Clear inputs
      setWeight('');
      setReps('');
      setRpe('');
      setNotes('');
    }
  };

  const handleCompleteWorkout = async () => {
    if (entries.length === 0) {
      alert('Please log at least one set before completing the workout');
      return;
    }

    if (!rpeLastSet) {
      alert('Please rate your overall workout RPE (1-10)');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId: workout.id,
          entries,
          rpeLastSet: parseFloat(rpeLastSet),
          performedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to log workout');
      }

      onComplete();
    } catch (error) {
      console.error('Error logging workout:', error);
      alert(`Failed to log workout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentExercise) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <Card className="flex flex-col items-center gap-4 bg-bg1 text-center">
          <p className="text-sm text-fg2">No exercises found in this workout.</p>
          <PrimaryButton
            onClick={onCancel}
            className="w-full max-w-xs bg-bg2 text-fg0 normal-case hover:bg-line2"
          >
            Go back
          </PrimaryButton>
        </Card>
      </div>
    );
  }

  const isLastExercise = currentExerciseIndex === allExercises.length - 1;
  const progress = `${currentExerciseIndex + 1} / ${allExercises.length}`;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between text-sm text-fg2">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 transition hover:bg-bg2 hover:text-fg0"
        >
          ← Cancel
        </button>
        <span>Exercise {progress}</span>
      </div>

      {/* Current Exercise Info */}
      <Card className="space-y-2 bg-bg1/80">
        <p className="text-xs font-medium uppercase tracking-wide text-fg2">
          {currentExercise.blockTitle}
        </p>
        <h2 className="text-xl font-semibold text-fg0">
          {currentExercise.name || currentExercise.id}
        </h2>
        <p className="text-sm text-fg1">
          Target: {currentExercise.sets}×{currentExercise.reps}
          {currentExercise.tempo && ` • Tempo: ${currentExercise.tempo}`}
        </p>
        {currentExercise.cues && currentExercise.cues.length > 0 && (
          <div className="mt-2 space-y-1 text-xs text-fg2">
            {currentExercise.cues.map((cue, index) => (
              <div key={index}>• {cue}</div>
            ))}
          </div>
        )}
      </Card>

      {/* Set Input Form */}
      <Card className="space-y-4 bg-bg0">
        <h3 className="text-sm font-semibold text-fg0">
          Log Set {nextSetNumber}
        </h3>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-fg2">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full rounded-md border border-line1 bg-bg0 px-3 py-2 text-sm text-fg0 placeholder:text-fg2 focus:border-fg0 focus:outline-none focus:ring-1 focus:ring-fg0"
              placeholder="0"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-fg2">
              Reps
            </label>
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full rounded-md border border-line1 bg-bg0 px-3 py-2 text-sm text-fg0 placeholder:text-fg2 focus:border-fg0 focus:outline-none focus:ring-1 focus:ring-fg0"
              placeholder="0"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-fg2">
              RPE (5-10)
            </label>
            <input
              type="number"
              step="0.5"
              min="5"
              max="10"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              className="w-full rounded-md border border-line1 bg-bg0 px-3 py-2 text-sm text-fg0 placeholder:text-fg2 focus:border-fg0 focus:outline-none focus:ring-1 focus:ring-fg0"
              placeholder="7.5"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-fg2">
            Notes (optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-line1 bg-bg0 px-3 py-2 text-sm text-fg0 placeholder:text-fg2 focus:border-fg0 focus:outline-none focus:ring-1 focus:ring-fg0"
            placeholder="Felt strong, good form"
          />
        </div>

        <PrimaryButton
          onClick={handleLogSet}
          disabled={!weight || !reps}
          className="w-full bg-bg2 text-fg0 normal-case hover:bg-line2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Log Set
        </PrimaryButton>
      </Card>

      {/* Logged Sets */}
      {currentExerciseSets.length > 0 && (
        <Card className="space-y-3 bg-bg0">
          <h4 className="text-sm font-semibold text-fg0">Logged Sets</h4>
          <div className="space-y-1.5">
            {currentExerciseSets.map((set, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-md border border-line1/60 px-3 py-2 text-sm text-fg1"
              >
                <span>Set {set.set}</span>
                <span className="text-fg0">
                  {set.weight}kg × {set.reps}
                  {set.rpe && <span className="ml-2 text-fg2">@ {set.rpe} RPE</span>}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="space-y-4">
        {!isLastExercise ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            {currentExerciseIndex > 0 && (
              <button
                onClick={handlePreviousExercise}
                className="flex-1 rounded-full border border-line1 bg-bg0 px-4 py-3 text-sm font-semibold text-fg0 transition hover:bg-bg1"
              >
                ← Previous
              </button>
            )}
            <PrimaryButton
              onClick={handleNextExercise}
              className="flex-1 normal-case"
            >
              Next Exercise →
            </PrimaryButton>
          </div>
        ) : (
          <div className="space-y-3">
            {currentExerciseIndex > 0 && (
              <button
                onClick={handlePreviousExercise}
                className="w-full rounded-full border border-line1 bg-bg0 px-4 py-3 text-sm font-semibold text-fg0 transition hover:bg-bg1"
              >
                ← Previous Exercise
              </button>
            )}

            <Card className="space-y-3 bg-bg0">
              <label className="block text-sm font-medium text-fg0">
                Overall Workout RPE
              </label>
              <input
                type="number"
                step="0.5"
                min="5"
                max="10"
                value={rpeLastSet}
                onChange={(e) => setRpeLastSet(e.target.value)}
                className="w-full rounded-md border border-line1 bg-bg0 px-3 py-2 text-sm text-fg0 placeholder:text-fg2 focus:border-fg0 focus:outline-none focus:ring-1 focus:ring-fg0"
                placeholder="7.5"
              />
              <PrimaryButton
                onClick={handleCompleteWorkout}
                disabled={isSubmitting || !rpeLastSet}
                className="w-full normal-case"
              >
                {isSubmitting ? 'Logging...' : 'Complete Workout'}
              </PrimaryButton>
            </Card>
          </div>
        )}

        {/* Total Sets Logged */}
        <p className="text-center text-xs text-fg2">
          {entries.length} {entries.length === 1 ? 'set' : 'sets'} logged
        </p>
      </div>
    </div>
  );
}
