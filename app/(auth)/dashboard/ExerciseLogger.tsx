'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { workouts, WorkoutPayload } from '@/drizzle/schema';
import { enqueueLog } from '@/lib/offlineQueue';
import type { WorkoutLogRequest } from '@/lib/validation';
import { Pencil, Trash2 } from 'lucide-react';

type Workout = typeof workouts.$inferSelect;

interface LogEntry {
  exerciseId: string;
  set: number;
  weight: number;
  reps: number;
  rpe?: number;
  notes?: string;
}

export type LoggerResult = {
  status: 'completed' | 'queued';
  message: string;
};

interface ExerciseLoggerProps {
  workout: Workout;
  onComplete: (result: LoggerResult) => void;
  onCancel: () => void;
}

type WorkoutBlock = WorkoutPayload['blocks'][number];
type WorkoutExercise = WorkoutBlock['exercises'][number];

interface FlattenedExercise extends WorkoutExercise {
  blockTitle: string;
  blockType: WorkoutBlock['type'];
}

type Feedback = {
  type: 'success' | 'error' | 'info';
  message: string;
};

function renumberEntries(list: LogEntry[]): LogEntry[] {
  const counters = new Map<string, number>();
  return list.map((entry) => {
    const nextCount = (counters.get(entry.exerciseId) ?? 0) + 1;
    counters.set(entry.exerciseId, nextCount);
    return { ...entry, set: nextCount };
  });
}

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function ExerciseLogger({ workout, onComplete, onCancel }: ExerciseLoggerProps) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [notes, setNotes] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [rpeLastSet, setRpeLastSet] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const restTimerRef = useRef<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const workoutPayload = useMemo(() => workout.payload as WorkoutPayload, [workout.payload]);

  const allExercises: FlattenedExercise[] = useMemo(
    () =>
      workoutPayload.blocks?.flatMap((block) =>
        block.exercises?.map((exercise) => ({
          ...exercise,
          blockTitle: block.title,
          blockType: block.type,
        })) ?? [],
      ) ?? [],
    [workoutPayload.blocks],
  );

  const currentExercise = allExercises[currentExerciseIndex];

  const currentExerciseSets = useMemo(
    () => (currentExercise ? entries.filter((entry) => entry.exerciseId === currentExercise.id) : []),
    [entries, currentExercise],
  );

  const editingEntry = editingIndex !== null ? entries[editingIndex] : null;
  const nextSetNumber = editingEntry?.set ?? currentExerciseSets.length + 1;
  const totalSetsLogged = entries.length;
  const isLastExercise = currentExerciseIndex === allExercises.length - 1;

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    return () => {
      if (restTimerRef.current) {
        window.clearInterval(restTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (restRemaining === 0) {
      if (restTimerRef.current !== null) {
        window.clearInterval(restTimerRef.current);
        restTimerRef.current = null;
      }
      setRestRemaining(null);
      setFeedback({ type: 'info', message: 'Rest complete — start your next set when ready.' });
    }
  }, [restRemaining]);

  const resetInputs = () => {
    setWeight('');
    setReps('');
    setRpe('');
    setNotes('');
    setEditingIndex(null);
  };

  const stopRestTimer = () => {
    if (restTimerRef.current !== null) {
      window.clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    setRestRemaining(null);
  };

  const startRestTimer = (seconds?: number) => {
    if (!seconds || seconds <= 0) {
      return;
    }
    stopRestTimer();
    setRestRemaining(seconds);
    restTimerRef.current = window.setInterval(() => {
      setRestRemaining((prev) => {
        if (prev === null) {
          return prev;
        }
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLogSet = () => {
    if (!currentExercise) {
      setFeedback({ type: 'error', message: 'No exercise selected.' });
      return;
    }

    const parsedReps = parseInt(reps, 10);
    if (Number.isNaN(parsedReps) || parsedReps <= 0) {
      setFeedback({ type: 'error', message: 'Enter a valid rep count.' });
      return;
    }

    const parsedWeight = weight.trim() === '' ? 0 : parseFloat(weight);
    if (Number.isNaN(parsedWeight) || parsedWeight < 0) {
      setFeedback({ type: 'error', message: 'Enter a valid weight.' });
      return;
    }

    const parsedRpe = rpe.trim() === '' ? undefined : parseFloat(rpe);
    if (parsedRpe !== undefined && (Number.isNaN(parsedRpe) || parsedRpe < 5 || parsedRpe > 10)) {
      setFeedback({ type: 'error', message: 'RPE must be between 5 and 10.' });
      return;
    }

    const formattedNotes = notes.trim() || undefined;

    const payload: LogEntry = {
      exerciseId: currentExercise.id,
      weight: Math.round(parsedWeight * 10) / 10,
      reps: parsedReps,
      rpe: parsedRpe ? Math.round(parsedRpe * 10) / 10 : undefined,
      notes: formattedNotes,
      set: 0,
    };

    let nextEntries: LogEntry[];
    if (editingIndex !== null) {
      nextEntries = [...entries];
      nextEntries[editingIndex] = { ...payload, set: entries[editingIndex].set };
      setFeedback({ type: 'success', message: 'Set updated.' });
    } else {
      nextEntries = [...entries, payload];
      const restSeconds =
        typeof currentExercise.restSeconds === 'number'
          ? currentExercise.restSeconds
          : undefined;
      startRestTimer(restSeconds);
      setFeedback({ type: 'success', message: 'Set logged.' });
    }

    setEntries(renumberEntries(nextEntries));
    resetInputs();
  };

  const handleEditEntry = (setNumber: number) => {
    if (!currentExercise) return;

    const entryIndex = entries.findIndex(
      (entry) => entry.exerciseId === currentExercise.id && entry.set === setNumber,
    );

    if (entryIndex === -1) return;

    const entry = entries[entryIndex];
    setWeight(entry.weight.toString());
    setReps(entry.reps.toString());
    setRpe(entry.rpe?.toString() ?? '');
    setNotes(entry.notes ?? '');
    setEditingIndex(entryIndex);
    stopRestTimer();
  };

  const handleDeleteEntry = (setNumber: number) => {
    if (!currentExercise) return;

    const entryIndex = entries.findIndex(
      (entry) => entry.exerciseId === currentExercise.id && entry.set === setNumber,
    );

    if (entryIndex === -1) return;

    const updated = renumberEntries(entries.filter((_, index) => index !== entryIndex));
    setEntries(updated);

    if (editingIndex !== null && entryIndex === editingIndex) {
      resetInputs();
    }

    setFeedback({ type: 'info', message: 'Set removed.' });
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < allExercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
      resetInputs();
      stopRestTimer();
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1);
      resetInputs();
      stopRestTimer();
    }
  };

  const handleCompleteWorkout = async () => {
    if (entries.length === 0) {
      setFeedback({ type: 'error', message: 'Log at least one set before completing the workout.' });
      return;
    }

    const parsedOverallRpe = parseFloat(rpeLastSet);
    if (Number.isNaN(parsedOverallRpe) || parsedOverallRpe < 5 || parsedOverallRpe > 10) {
      setFeedback({ type: 'error', message: 'Overall RPE must be between 5 and 10.' });
      return;
    }

    const payload: WorkoutLogRequest = {
      workoutId: workout.id,
      entries: entries.map((entry) => ({
        exerciseId: entry.exerciseId,
        set: entry.set,
        reps: entry.reps,
        weight: entry.weight,
        rpe: entry.rpe,
        notes: entry.notes,
      })),
      rpeLastSet: Math.round(parsedOverallRpe * 10) / 10,
      performedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await enqueueLog(payload);
        onComplete({
          status: 'queued',
          message: 'Offline — workout saved. We will sync it once you are online.',
        });
        return;
      }

      const response = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to log workout');
      }

      onComplete({ status: 'completed', message: 'Workout logged. Nice work!' });
    } catch (error) {
      try {
        await enqueueLog(payload);
        onComplete({
          status: 'queued',
          message: 'Connection issue — workout queued for sync.',
        });
      } catch (queueError) {
        console.error('Error logging workout:', error, queueError);
        setFeedback({
          type: 'error',
          message:
            error instanceof Error ? error.message : 'Failed to log workout. Please try again.',
        });
      }
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

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
      <div className="flex items-center justify-between text-sm text-fg2">
        <button
          onClick={() => {
            stopRestTimer();
            onCancel();
          }}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 transition hover:bg-bg2 hover:text-fg0"
        >
          ← Cancel
        </button>
        <span>
          Exercise {currentExerciseIndex + 1} / {allExercises.length}
        </span>
      </div>

      {feedback ? (
        <Card
          className={`flex items-center justify-between border ${
            feedback.type === 'error'
              ? 'border-red-500/40 text-red-200'
              : feedback.type === 'success'
                ? 'border-green-500/40 text-green-200'
                : 'border-fg2 text-fg1'
          } bg-bg1/80 text-sm`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="rounded-full p-1 text-xs uppercase tracking-wide text-fg2 transition hover:text-fg0"
          >
            Dismiss
          </button>
        </Card>
      ) : null}

      <Card className="space-y-2 bg-bg1/80">
        <p className="text-xs font-medium uppercase tracking-wide text-fg2">
          {currentExercise.blockTitle}
        </p>
        <h2 className="text-xl font-semibold text-fg0">
          {currentExercise.name || currentExercise.id}
        </h2>
        <p className="text-sm text-fg1">
          Target: {currentExercise.sets}×{currentExercise.reps}
          {currentExercise.tempo ? ` • Tempo: ${currentExercise.tempo}` : ''}
        </p>
        {currentExercise.cues && currentExercise.cues.length > 0 ? (
          <div className="mt-2 space-y-1 text-xs text-fg2">
            {currentExercise.cues.map((cue, index) => (
              <div key={index}>• {cue}</div>
            ))}
          </div>
        ) : null}
      </Card>

      {restRemaining !== null ? (
        <Card className="flex items-center justify-between bg-bg0">
          <div>
            <p className="text-xs uppercase tracking-wide text-fg2">Rest timer</p>
            <p className="text-lg font-semibold text-fg0">{formatSeconds(restRemaining)}</p>
          </div>
          <button
            onClick={stopRestTimer}
            className="inline-flex items-center gap-2 rounded-full border border-line1 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-fg2 transition hover:text-fg0"
          >
            Skip
          </button>
        </Card>
      ) : null}

      <Card className="space-y-4 bg-bg0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg0">
            {editingEntry ? `Edit set ${editingEntry.set}` : `Log set ${nextSetNumber}`}
          </h3>
          {editingEntry ? (
            <button
              onClick={resetInputs}
              className="text-xs font-semibold uppercase tracking-wide text-fg2 transition hover:text-fg0"
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1">
            <span className="block text-xs font-medium text-fg2">Weight (kg)</span>
            <input
              type="number"
              step="0.5"
              inputMode="decimal"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              className="w-full rounded-md border border-line1 bg-bg0 px-3 py-2 text-sm text-fg0 placeholder:text-fg2 focus:border-fg0 focus:outline-none focus:ring-1 focus:ring-fg0"
              placeholder="0"
            />
          </label>

          <label className="space-y-1">
            <span className="block text-xs font-medium text-fg2">Reps</span>
            <input
              type="number"
              inputMode="numeric"
              value={reps}
              onChange={(event) => setReps(event.target.value)}
              className="w-full rounded-md border border-line1 bg-bg0 px-3 py-2 text-sm text-fg0 placeholder:text-fg2 focus:border-fg0 focus:outline-none focus:ring-1 focus:ring-fg0"
              placeholder="0"
            />
          </label>

          <label className="space-y-1">
            <span className="block text-xs font-medium text-fg2">RPE (5-10)</span>
            <input
              type="number"
              step="0.5"
              inputMode="decimal"
              value={rpe}
              min={5}
              max={10}
              onChange={(event) => setRpe(event.target.value)}
              className="w-full rounded-md border border-line1 bg-bg0 px-3 py-2 text-sm text-fg0 placeholder:text-fg2 focus:border-fg0 focus:outline-none focus:ring-1 focus:ring-fg0"
              placeholder="7.5"
            />
          </label>
        </div>

        <label className="space-y-1">
          <span className="block text-xs font-medium text-fg2">Notes (optional)</span>
          <input
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full rounded-md border border-line1 bg-bg0 px-3 py-2 text-sm text-fg0 placeholder:text-fg2 focus:border-fg0 focus:outline-none focus:ring-1 focus:ring-fg0"
            placeholder="Felt strong, smooth tempo"
          />
        </label>

        <PrimaryButton
          onClick={handleLogSet}
          className="w-full normal-case"
        >
          {editingEntry ? 'Update Set' : 'Log Set'}
        </PrimaryButton>
      </Card>

      {currentExerciseSets.length > 0 ? (
        <Card className="space-y-3 bg-bg0">
          <h4 className="text-sm font-semibold text-fg0">Logged sets</h4>
          <div className="space-y-1.5">
            {currentExerciseSets.map((set) => (
              <div
                key={set.set}
                className="flex items-center justify-between rounded-md border border-line1/60 px-3 py-2 text-sm text-fg1"
              >
                <div>
                  <p className="font-semibold text-fg0">
                    Set {set.set}: {set.weight}kg × {set.reps}
                  </p>
                  <p className="text-xs text-fg2">
                    {set.rpe ? `@ ${set.rpe} RPE` : 'RPE —'}
                    {set.notes ? ` • ${set.notes}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditEntry(set.set)}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fg2 transition hover:text-fg0"
                  >
                    <Pencil className="h-3 w-3" aria-hidden />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEntry(set.set)}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fg2 transition hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="space-y-4">
        {!isLastExercise ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            {currentExerciseIndex > 0 ? (
              <button
                onClick={handlePreviousExercise}
                className="flex-1 rounded-full border border-line1 bg-bg0 px-4 py-3 text-sm font-semibold text-fg0 transition hover:bg-bg1"
              >
                ← Previous
              </button>
            ) : null}
            <PrimaryButton
              onClick={handleNextExercise}
              className="flex-1 normal-case"
            >
              Next Exercise →
            </PrimaryButton>
          </div>
        ) : (
          <Card className="space-y-3 bg-bg0">
            <label className="block text-sm font-medium text-fg0">
              Overall workout RPE
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min={5}
              max={10}
              value={rpeLastSet}
              onChange={(event) => setRpeLastSet(event.target.value)}
              className="w-full rounded-md border border-line1 bg-bg0 px-3 py-2 text-sm text-fg0 placeholder:text-fg2 focus:border-fg0 focus:outline-none focus:ring-1 focus:ring-fg0"
              placeholder="7.5"
            />
            <PrimaryButton
              onClick={handleCompleteWorkout}
              disabled={isSubmitting}
              className="w-full normal-case disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Saving…' : 'Complete Workout'}
            </PrimaryButton>
          </Card>
        )}

        <p className="text-center text-xs text-fg2">
          {totalSetsLogged} {totalSetsLogged === 1 ? 'set logged' : 'sets logged'}
        </p>
      </div>
    </div>
  );
}
