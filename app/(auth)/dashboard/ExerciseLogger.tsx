'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { WorkoutEditor } from '@/components/WorkoutEditor';
import type { workouts, WorkoutPayload } from '@/drizzle/schema';
import { enqueueLog } from '@/lib/offlineQueue';
import type { WorkoutLogRequest } from '@/lib/validation';
import { Pencil, Trash2, Menu, Plus, Minus, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

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

  // New state for enhanced features
  const [isRestPaused, setIsRestPaused] = useState(false);
  const [workoutStartTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [showWorkoutEditor, setShowWorkoutEditor] = useState(false);
  const [historicalData, setHistoricalData] = useState<Record<string, Array<{ set: number; weight: number; reps: number; rpe?: number }>> | null>(null);
  const [lastSessionDate, setLastSessionDate] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

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

  // Fetch historical data on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/workouts/${workout.id}/history`);
        if (response.ok) {
          const data = await response.json();
          if (data.hasHistory) {
            setHistoricalData(data.exercises);
            setLastSessionDate(data.lastSession.date);
          }
        }
      } catch (error) {
        console.error('Failed to fetch workout history:', error);
      }
    };
    fetchHistory();
  }, [workout.id]);

  // Track elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - workoutStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [workoutStartTime]);

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
      setIsRestPaused(false);

      // Play audio notification
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVbHn7qlYFApEm9/0vGgfBTGD0fTVhDEHHGrC8OKdRw0PWrPm7qZWFQpFnOD1vmofBjF/0PTWgzMHHmvC8OKfRg0OWrTk7qFWFQhGnOD1v2keBTV/z/TYgjMHH2nC8OKfRg0OWbPl7qJVFghGm9/0v2kfBTR+z/TZgjMHIGnC7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRw==');
        audio.play().catch(() => {
          // Ignore errors if audio playback is not allowed
        });
      } catch (error) {
        // Ignore audio errors
      }

      // Trigger haptic feedback if available
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

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
    setIsRestPaused(false);
  };

  const pauseRestTimer = () => {
    if (restTimerRef.current !== null) {
      window.clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    setIsRestPaused(true);
  };

  const resumeRestTimer = () => {
    if (restRemaining === null || restRemaining <= 0) return;
    setIsRestPaused(false);
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

  const adjustRestTimer = (seconds: number) => {
    setRestRemaining((prev) => {
      if (prev === null) return prev;
      const newTime = Math.max(0, prev + seconds);
      return newTime;
    });
  };

  const startRestTimer = (seconds?: number) => {
    if (!seconds || seconds <= 0) {
      return;
    }
    stopRestTimer();
    setRestRemaining(seconds);
    setIsRestPaused(false);
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

  // Quick action: Copy previous set
  const handleCopyPreviousSet = () => {
    if (currentExerciseSets.length === 0) return;
    const lastSet = currentExerciseSets[currentExerciseSets.length - 1];
    setWeight(lastSet.weight.toString());
    setReps(lastSet.reps.toString());
    setRpe(lastSet.rpe?.toString() ?? '');
    setNotes(lastSet.notes ?? '');
    setFeedback({ type: 'info', message: 'Copied previous set data' });
  };

  // Quick action: Use last session data
  const handleUseLastSession = () => {
    if (!historicalData || !currentExercise) return;
    const exerciseHistory = historicalData[currentExercise.id];
    if (!exerciseHistory || exerciseHistory.length === 0) return;

    const lastSet = exerciseHistory[Math.min(nextSetNumber - 1, exerciseHistory.length - 1)];
    setWeight(lastSet.weight.toString());
    setReps(lastSet.reps.toString());
    setRpe(lastSet.rpe?.toString() ?? '');
    setFeedback({ type: 'info', message: 'Pre-filled with last session data' });
  };

  // Handle touch swipe
  const handleTouchStart = (e: TouchEvent | React.TouchEvent<HTMLDivElement>) => {
    if ('touches' in e) {
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: TouchEvent | React.TouchEvent<HTMLDivElement>) => {
    if ('touches' in e) {
      touchEndX.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;

    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe left - next exercise
        handleNextExercise();
      } else {
        // Swipe right - previous exercise
        handlePreviousExercise();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Increment/decrement helpers
  const incrementWeight = () => {
    const current = parseFloat(weight) || 0;
    setWeight((current + 2.5).toString());
  };

  const decrementWeight = () => {
    const current = parseFloat(weight) || 0;
    setWeight(Math.max(0, current - 2.5).toString());
  };

  const incrementReps = () => {
    const current = parseInt(reps) || 0;
    setReps((current + 1).toString());
  };

  const decrementReps = () => {
    const current = parseInt(reps) || 0;
    setReps(Math.max(0, current - 1).toString());
  };

  const incrementRpe = () => {
    const current = parseFloat(rpe) || 5;
    setRpe(Math.min(10, current + 0.5).toString());
  };

  const decrementRpe = () => {
    const current = parseFloat(rpe) || 5;
    setRpe(Math.max(5, current - 0.5).toString());
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
        <Card className="flex flex-col items-center gap-4 bg-surface-1 text-center">
          <p className="text-sm text-text-muted">No exercises found in this workout.</p>
          <PrimaryButton
            onClick={onCancel}
            className="w-full max-w-xs bg-surface-2 text-text-primary normal-case hover:bg-surface-border"
          >
            Go back
          </PrimaryButton>
        </Card>
      </div>
    );
  }

  // Calculate completion stats
  const completedExercises = allExercises.filter((ex) =>
    entries.some((entry) => entry.exerciseId === ex.id)
  ).length;
  const totalSets = allExercises.reduce((sum, ex) => sum + ex.sets, 0);
  const completedSets = entries.length;

  // Get historical data for current exercise
  const currentExerciseHistory =
    currentExercise && historicalData ? historicalData[currentExercise.id] : null;

  return (
    <div
      className="mx-auto w-full max-w-3xl space-y-4 p-4"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress Header */}
      <Card className="bg-gradient-to-r from-cyan-900/20 to-indigo-900/20 border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                stopRestTimer();
                onCancel();
              }}
              className="text-text-muted hover:text-text-primary transition"
            >
              ← Back
            </button>
            <div className="h-4 w-px bg-surface-border" />
            <button
              onClick={() => setShowExerciseList(true)}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition"
              title="Exercise list"
            >
              <Menu className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowWorkoutEditor(true)}
              className="text-xs text-text-muted hover:text-text-primary transition"
              title="Edit workout"
            >
              Edit
            </button>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-text-primary">
              {formatSeconds(elapsedSeconds)}
            </div>
            <div className="text-xs text-text-muted">
              {completedExercises}/{allExercises.length} exercises • {completedSets}/{totalSets} sets
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${(completedSets / totalSets) * 100}%` }}
          />
        </div>
      </Card>

      {feedback ? (
        <Card
          className={`flex items-center justify-between border ${
            feedback.type === 'error'
              ? 'border-error bg-error-bg text-error-light'
              : feedback.type === 'success'
                ? 'border-success bg-success-bg text-success-light'
                : 'border-text-muted text-text-secondary'
          } bg-surface-1 text-sm`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="rounded-full p-1 text-xs uppercase tracking-wide text-text-muted transition hover:text-text-primary"
          >
            Dismiss
          </button>
        </Card>
      ) : null}

      <Card className="space-y-2 bg-surface-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {currentExercise.blockTitle}
            </p>
            <h2 className="text-xl font-semibold text-text-primary">
              {currentExercise.name || currentExercise.id}
            </h2>
            <p className="text-sm text-text-secondary">
              Target: {currentExercise.sets}×{currentExercise.reps}
              {currentExercise.tempo ? ` • Tempo: ${currentExercise.tempo}` : ''}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handlePreviousExercise}
              disabled={currentExerciseIndex === 0}
              className="p-2 rounded-md hover:bg-surface-2 text-text-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Previous exercise"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNextExercise}
              disabled={currentExerciseIndex === allExercises.length - 1}
              className="p-2 rounded-md hover:bg-surface-2 text-text-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Next exercise"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Historical data display */}
        {currentExerciseHistory && currentExerciseHistory.length > 0 && (
          <div className="pt-2 border-t border-surface-border">
            <p className="text-xs text-text-muted mb-1">
              Last session ({lastSessionDate}):
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {currentExerciseHistory.map((set, idx) => (
                <span key={idx} className="text-text-secondary">
                  {set.weight}kg × {set.reps}
                  {set.rpe ? ` @ ${set.rpe}` : ''}
                  {idx < currentExerciseHistory.length - 1 ? ' •' : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {currentExercise.cues && currentExercise.cues.length > 0 ? (
          <div className="pt-2 border-t border-surface-border space-y-1 text-xs text-text-muted">
            <p className="font-medium">Form cues:</p>
            {currentExercise.cues.slice(0, 2).map((cue, index) => (
              <div key={index}>• {cue}</div>
            ))}
          </div>
        ) : null}
      </Card>

      {restRemaining !== null ? (
        <Card className="bg-surface-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-text-muted">Rest timer</p>
              <p className="text-2xl font-bold text-text-primary tabular-nums">
                {formatSeconds(restRemaining)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isRestPaused ? (
                <button
                  onClick={resumeRestTimer}
                  className="p-2 rounded-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition"
                  title="Resume"
                >
                  <Play className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={pauseRestTimer}
                  className="p-2 rounded-full bg-surface-2 text-text-muted hover:bg-surface-3 transition"
                  title="Pause"
                >
                  <Pause className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={stopRestTimer}
                className="px-3 py-1.5 rounded-full border border-surface-border text-xs font-semibold uppercase tracking-wide text-text-muted hover:text-text-primary transition"
              >
                Skip
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mb-2 h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all"
              style={{
                width: `${((currentExercise.restSeconds || 60) - restRemaining) / (currentExercise.restSeconds || 60) * 100}%`,
              }}
            />
          </div>
          {/* Quick adjust buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => adjustRestTimer(-30)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-md bg-surface-2 text-text-muted hover:bg-surface-3 text-xs font-medium transition"
            >
              -30s
            </button>
            <button
              onClick={() => adjustRestTimer(30)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-md bg-surface-2 text-text-muted hover:bg-surface-3 text-xs font-medium transition"
            >
              +30s
            </button>
          </div>
        </Card>
      ) : null}

      <Card className="space-y-4 bg-surface-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            {editingEntry ? `Edit set ${editingEntry.set}` : `Log set ${nextSetNumber}`}
          </h3>
          {editingEntry ? (
            <button
              onClick={resetInputs}
              className="text-xs font-semibold uppercase tracking-wide text-text-muted transition hover:text-text-primary"
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1">
            <span className="block text-xs font-medium text-text-muted">Weight (kg)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={decrementWeight}
                type="button"
                className="p-2 rounded-md bg-surface-2 hover:bg-surface-3 text-text-muted transition"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                step="2.5"
                inputMode="decimal"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                className="flex-1 rounded-md border border-surface-border bg-surface-0 px-3 py-2 text-sm text-text-primary text-center placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                placeholder="0"
              />
              <button
                onClick={incrementWeight}
                type="button"
                className="p-2 rounded-md bg-surface-2 hover:bg-surface-3 text-text-muted transition"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </label>

          <label className="space-y-1">
            <span className="block text-xs font-medium text-text-muted">Reps</span>
            <div className="flex items-center gap-2">
              <button
                onClick={decrementReps}
                type="button"
                className="p-2 rounded-md bg-surface-2 hover:bg-surface-3 text-text-muted transition"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={(event) => setReps(event.target.value)}
                className="flex-1 rounded-md border border-surface-border bg-surface-0 px-3 py-2 text-sm text-text-primary text-center placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                placeholder="0"
              />
              <button
                onClick={incrementReps}
                type="button"
                className="p-2 rounded-md bg-surface-2 hover:bg-surface-3 text-text-muted transition"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </label>

          <label className="space-y-1">
            <span className="block text-xs font-medium text-text-muted">RPE (5-10)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={decrementRpe}
                type="button"
                className="p-2 rounded-md bg-surface-2 hover:bg-surface-3 text-text-muted transition"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                step="0.5"
                inputMode="decimal"
                value={rpe}
                min={5}
                max={10}
                onChange={(event) => setRpe(event.target.value)}
                className="flex-1 rounded-md border border-surface-border bg-surface-0 px-3 py-2 text-sm text-text-primary text-center placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                placeholder="7.5"
              />
              <button
                onClick={incrementRpe}
                type="button"
                className="p-2 rounded-md bg-surface-2 hover:bg-surface-3 text-text-muted transition"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </label>
        </div>

        <label className="space-y-1">
          <span className="block text-xs font-medium text-text-muted">Notes (optional)</span>
          <input
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full rounded-md border border-surface-border bg-surface-0 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            placeholder="Felt strong, smooth tempo"
          />
        </label>

        {/* Quick action buttons */}
        {!editingEntry && (
          <div className="flex gap-2">
            {currentExerciseSets.length > 0 && (
              <button
                onClick={handleCopyPreviousSet}
                className="flex-1 px-3 py-2 rounded-md bg-surface-2 hover:bg-surface-3 text-text-secondary text-xs font-medium transition border border-surface-border"
              >
                📋 Copy Set {currentExerciseSets.length}
              </button>
            )}
            {currentExerciseHistory && currentExerciseHistory.length > 0 && (
              <button
                onClick={handleUseLastSession}
                className="flex-1 px-3 py-2 rounded-md bg-surface-2 hover:bg-surface-3 text-text-secondary text-xs font-medium transition border border-surface-border"
              >
                ↑ Use Last Session
              </button>
            )}
          </div>
        )}

        <PrimaryButton
          onClick={handleLogSet}
          className="w-full normal-case"
        >
          {editingEntry ? 'Update Set' : `Log Set ${nextSetNumber}`}
        </PrimaryButton>
      </Card>

      {currentExerciseSets.length > 0 ? (
        <Card className="space-y-3 bg-surface-0">
          <h4 className="text-sm font-semibold text-text-primary">Logged sets</h4>
          <div className="space-y-1.5">
            {currentExerciseSets.map((set) => (
              <div
                key={set.set}
                className="flex items-center justify-between rounded-md border border-surface-border/60 px-3 py-2 text-sm text-text-secondary"
              >
                <div>
                  <p className="font-semibold text-text-primary">
                    Set {set.set}: {set.weight}kg × {set.reps}
                  </p>
                  <p className="text-xs text-text-muted">
                    {set.rpe ? `@ ${set.rpe} RPE` : 'RPE —'}
                    {set.notes ? ` • ${set.notes}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditEntry(set.set)}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted transition hover:text-text-primary"
                  >
                    <Pencil className="h-3 w-3" aria-hidden />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEntry(set.set)}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted transition hover:text-red-400"
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
                className="flex-1 rounded-full border border-surface-border bg-surface-0 px-4 py-3 text-sm font-semibold text-text-primary transition hover:bg-surface-1"
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
          <Card className="space-y-3 bg-surface-0">
            <label className="block text-sm font-medium text-text-primary">
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
              className="w-full rounded-md border border-surface-border bg-surface-0 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
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

        <p className="text-center text-xs text-text-muted">
          {totalSetsLogged} {totalSetsLogged === 1 ? 'set logged' : 'sets logged'}
        </p>
      </div>

      {/* Exercise Quick Navigation Modal */}
      {showExerciseList && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
          onClick={() => setShowExerciseList(false)}
        >
          <div
            className="bg-surface-0 rounded-t-2xl w-full max-w-3xl max-h-[70vh] overflow-hidden flex flex-col border-t border-surface-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-surface-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">Exercises</h3>
                <button
                  onClick={() => setShowExerciseList(false)}
                  className="text-text-muted hover:text-text-primary"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {allExercises.map((exercise, index) => {
                const hasLogs = entries.some((entry) => entry.exerciseId === exercise.id);
                const exerciseSets = entries.filter((entry) => entry.exerciseId === exercise.id);
                const isComplete = exerciseSets.length >= exercise.sets;
                const isCurrent = index === currentExerciseIndex;

                return (
                  <button
                    key={exercise.id}
                    onClick={() => {
                      setCurrentExerciseIndex(index);
                      setShowExerciseList(false);
                      resetInputs();
                      stopRestTimer();
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      isCurrent
                        ? 'bg-cyan-500/10 border-cyan-500/30'
                        : 'bg-surface-1 border-surface-border hover:bg-surface-2'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {isComplete ? (
                            <span className="text-green-400">✓</span>
                          ) : hasLogs ? (
                            <span className="text-yellow-400">◐</span>
                          ) : (
                            <span className="text-text-muted">○</span>
                          )}
                          <span className="font-medium text-text-primary">{exercise.name}</span>
                        </div>
                        <div className="text-xs text-text-muted mt-1">
                          {exercise.blockTitle} • {exerciseSets.length}/{exercise.sets} sets
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="text-xs font-semibold text-cyan-400">Current</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Workout Editor Modal */}
      {showWorkoutEditor && (
        <WorkoutEditor
          workout={workout}
          isOpen={showWorkoutEditor}
          onClose={() => setShowWorkoutEditor(false)}
          onSave={() => {
            setShowWorkoutEditor(false);
            // Reload the page to reflect changes
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
