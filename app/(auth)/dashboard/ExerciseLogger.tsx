'use client';

import { useState } from 'react';
import type { workouts } from '@/drizzle/schema';

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
  userId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function ExerciseLogger({ workout, userId, onComplete, onCancel }: ExerciseLoggerProps) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [notes, setNotes] = useState('');
  const [rpeLastSet, setRpeLastSet] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const workoutPayload = workout.payload as any;

  // Flatten all exercises from all blocks
  const allExercises = workoutPayload.blocks?.flatMap((block: any) =>
    block.exercises?.map((ex: any) => ({
      ...ex,
      blockTitle: block.title,
    })) || []
  ) || [];

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
      <div className="p-4 max-w-2xl mx-auto">
        <div className="text-center py-8">
          <p className="text-gray-600">No exercises found in this workout.</p>
          <button
            onClick={onCancel}
            className="mt-4 text-black underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const isLastExercise = currentExerciseIndex === allExercises.length - 1;
  const progress = `${currentExerciseIndex + 1} / ${allExercises.length}`;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="text-gray-600 text-sm hover:text-gray-900"
        >
          ← Cancel
        </button>
        <span className="text-sm text-gray-600">Exercise {progress}</span>
      </div>

      {/* Current Exercise Info */}
      <div className="bg-gray-100 rounded-lg p-4 mb-4">
        <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
          {currentExercise.blockTitle}
        </p>
        <h2 className="text-xl font-semibold mb-1">
          {currentExercise.name || currentExercise.id}
        </h2>
        <p className="text-sm text-gray-600">
          Target: {currentExercise.sets}×{currentExercise.reps}
          {currentExercise.tempo && ` • Tempo: ${currentExercise.tempo}`}
        </p>
        {currentExercise.cues && currentExercise.cues.length > 0 && (
          <div className="mt-2 text-xs text-gray-700 space-y-1">
            {currentExercise.cues.map((cue: string, i: number) => (
              <div key={i}>• {cue}</div>
            ))}
          </div>
        )}
      </div>

      {/* Set Input Form */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4 space-y-3">
        <h3 className="font-semibold text-sm text-gray-900">
          Log Set {nextSetNumber}
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700">
              Reps
            </label>
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700">
              RPE (5-10)
            </label>
            <input
              type="number"
              step="0.5"
              min="5"
              max="10"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="7.5"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1 text-gray-700">
            Notes (optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Felt strong, good form"
          />
        </div>

        <button
          onClick={handleLogSet}
          disabled={!weight || !reps}
          className="w-full bg-black text-white py-2.5 rounded font-semibold text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Log Set
        </button>
      </div>

      {/* Logged Sets */}
      {currentExerciseSets.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <h4 className="font-semibold mb-2 text-sm text-gray-900">Logged Sets</h4>
          <div className="space-y-1.5">
            {currentExerciseSets.map((set, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100 last:border-0"
              >
                <span className="text-gray-600">Set {set.set}</span>
                <span className="font-medium">
                  {set.weight}kg × {set.reps}
                  {set.rpe && <span className="text-gray-600 ml-2">@ {set.rpe} RPE</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="space-y-3">
        {!isLastExercise ? (
          <div className="flex gap-2">
            {currentExerciseIndex > 0 && (
              <button
                onClick={handlePreviousExercise}
                className="flex-1 bg-gray-200 text-gray-900 py-2.5 rounded font-semibold text-sm hover:bg-gray-300 transition-colors"
              >
                ← Previous
              </button>
            )}
            <button
              onClick={handleNextExercise}
              className="flex-1 bg-gray-900 text-white py-2.5 rounded font-semibold text-sm hover:bg-gray-800 transition-colors"
            >
              Next Exercise →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {currentExerciseIndex > 0 && (
              <button
                onClick={handlePreviousExercise}
                className="w-full bg-gray-200 text-gray-900 py-2.5 rounded font-semibold text-sm hover:bg-gray-300 transition-colors"
              >
                ← Previous Exercise
              </button>
            )}

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <label className="block text-sm font-medium text-gray-900">
                Overall Workout RPE
              </label>
              <input
                type="number"
                step="0.5"
                min="5"
                max="10"
                value={rpeLastSet}
                onChange={(e) => setRpeLastSet(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="7.5"
              />
              <button
                onClick={handleCompleteWorkout}
                disabled={isSubmitting || !rpeLastSet}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Logging...' : '✓ Complete Workout'}
              </button>
            </div>
          </div>
        )}

        {/* Total Sets Logged */}
        <p className="text-center text-xs text-gray-500">
          {entries.length} {entries.length === 1 ? 'set' : 'sets'} logged
        </p>
      </div>
    </div>
  );
}
