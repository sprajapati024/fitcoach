'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PrimaryButton } from '@/components/PrimaryButton';
import { WorkoutEditor } from '@/components/WorkoutEditor';
import type { workouts, WorkoutPayload } from '@/drizzle/schema';
import { enqueueLog } from '@/lib/offlineQueue';
import type { WorkoutLogRequest } from '@/lib/validation';
import { Pencil, Play, Pause, ChevronDown, ChevronUp, RotateCcw, Copy } from 'lucide-react';

type Workout = typeof workouts.$inferSelect;

interface LogEntry {
  exerciseId: string;
  set: number;
  weight: number;
  reps: number;
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
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [notes, setNotes] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [rpeLastSet, setRpeLastSet] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const restTimerRef = useRef<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Enhanced features
  const [isRestPaused, setIsRestPaused] = useState(false);
  const [workoutStartTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showWorkoutEditor, setShowWorkoutEditor] = useState(false);
  const [historicalData, setHistoricalData] = useState<Record<string, Array<{ set: number; weight: number; reps: number; rpe?: number }>> | null>(null);
  const [lastSessionDate, setLastSessionDate] = useState<string | null>(null);

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

  const totalSetsLogged = entries.length;

  // Auto-expand first incomplete exercise on mount
  useEffect(() => {
    if (allExercises.length > 0) {
      const firstIncomplete = allExercises.find((ex) => {
        const exerciseSets = entries.filter((entry) => entry.exerciseId === ex.id);
        return exerciseSets.length < ex.sets;
      });
      if (firstIncomplete) {
        setExpandedExercises(new Set([firstIncomplete.id]));
        setActiveExerciseId(firstIncomplete.id);
      } else {
        // All complete, expand first
        setExpandedExercises(new Set([allExercises[0].id]));
        setActiveExerciseId(allExercises[0].id);
      }
    }
  }, []);

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
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVbHn7qlYFApEm9/0vGgfBTGD0fTVhDEHHGrC8OKdRw0PWrPm7qZWFQpFnOD1vmofBjF/0PTWgzMHHmvC8OKfRg0OWrTk7qFWFQhGnOD1v2keBTV/z/TYgjMHHmvC8OKfRg0OWbPl7qJVFghGm9/0v2kfBTR+z/TZgjMHH2nC8OKfRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnC7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRg0PWbPl7qNUFwhFm9/0wGkeBTR+zvTZgjMHIGnD7+OeRw==');
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

  const toggleExercise = (exerciseId: string) => {
    setExpandedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
        setActiveExerciseId(exerciseId);
      }
      return next;
    });
  };

  // Play button: Copy set data and start next set
  const handlePlaySet = (exerciseId: string, set: LogEntry) => {
    const exercise = allExercises.find((ex) => ex.id === exerciseId);
    if (!exercise) return;

    setActiveExerciseId(exerciseId);
    setExpandedExercises(new Set([exerciseId]));
    setWeight(set.weight.toString());
    setReps(set.reps.toString());
    setNotes(set.notes ?? '');

    // Start rest timer if configured
    const restSeconds = typeof exercise.restSeconds === 'number' ? exercise.restSeconds : undefined;
    startRestTimer(restSeconds);

    setFeedback({ type: 'info', message: 'Set data copied. Log when ready!' });
  };

  // Undo button: Remove set
  const handleUndoSet = (exerciseId: string, setNumber: number) => {
    const entryIndex = entries.findIndex(
      (entry) => entry.exerciseId === exerciseId && entry.set === setNumber,
    );

    if (entryIndex === -1) return;

    const updated = renumberEntries(entries.filter((_, index) => index !== entryIndex));
    setEntries(updated);

    if (editingIndex !== null && entryIndex === editingIndex) {
      resetInputs();
    }

    setFeedback({ type: 'info', message: 'Set removed.' });
  };


  const handleLogSet = (exerciseId: string) => {
    const exercise = allExercises.find((ex) => ex.id === exerciseId);
    if (!exercise) {
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

    const formattedNotes = notes.trim() || undefined;

    const payload: LogEntry = {
      exerciseId: exercise.id,
      weight: Math.round(parsedWeight * 10) / 10,
      reps: parsedReps,
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
        typeof exercise.restSeconds === 'number'
          ? exercise.restSeconds
          : undefined;
      startRestTimer(restSeconds);
      setFeedback({ type: 'success', message: 'Set logged.' });

      // Auto-expand next incomplete exercise
      const exerciseSets = nextEntries.filter((entry) => entry.exerciseId === exercise.id);
      if (exerciseSets.length >= exercise.sets) {
        // Current exercise complete, find next incomplete
        const nextIncomplete = allExercises.find((ex) => {
          const exSets = nextEntries.filter((entry) => entry.exerciseId === ex.id);
          return exSets.length < ex.sets;
        });
        if (nextIncomplete) {
          setExpandedExercises(new Set([nextIncomplete.id]));
          setActiveExerciseId(nextIncomplete.id);
        }
      }
    }

    setEntries(renumberEntries(nextEntries));
    resetInputs();
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

  if (allExercises.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-400 mb-4">No exercises found in this workout.</p>
          <PrimaryButton onClick={onCancel} className="w-full">
            Go back
          </PrimaryButton>
        </div>
      </div>
    );
  }

  // Calculate completion stats
  const completedExercises = allExercises.filter((ex) => {
    const exerciseSets = entries.filter((entry) => entry.exerciseId === ex.id);
    return exerciseSets.length >= ex.sets;
  }).length;
  const totalSets = allExercises.reduce((sum, ex) => sum + ex.sets, 0);
  const completedSets = entries.length;
  const allExercisesComplete = completedExercises === allExercises.length && completedSets >= totalSets;

  return (
    <div className="min-h-screen bg-black -mx-4 -mt-6 -mb-32">
      {/* Sticky Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800 md:hidden"
      >
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                stopRestTimer();
                onCancel();
              }}
              className="text-gray-400 hover:text-white transition text-sm"
            >
              ← Back
            </button>
            <div className="h-4 w-px bg-gray-800" />
            <button
              onClick={() => setShowWorkoutEditor(true)}
              className="text-xs text-gray-400 hover:text-white transition"
              title="Edit workout"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-white tabular-nums">
              {formatSeconds(elapsedSeconds)}
            </div>
            <div className="text-xs text-gray-500">
              {completedExercises}/{allExercises.length} exercises • {completedSets}/{totalSets} sets
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-900">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${(completedSets / totalSets) * 100}%` }}
          />
        </div>
      </motion.header>

      {/* Rest Timer - Sticky when active */}
      <AnimatePresence>
        {restRemaining !== null && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-14 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800"
          >
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Rest timer</p>
                  <p className="text-2xl font-bold text-white tabular-nums">
                    {formatSeconds(restRemaining)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isRestPaused ? (
                    <button
                      onClick={resumeRestTimer}
                      className="p-2 rounded-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition active:scale-95"
                      title="Resume"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={pauseRestTimer}
                      className="p-2 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 transition active:scale-95"
                      title="Pause"
                    >
                      <Pause className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={stopRestTimer}
                    className="px-3 py-1.5 rounded-full border border-gray-700 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-white transition active:scale-95"
                  >
                    Skip
                  </button>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mb-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all"
                  style={{
                    width: `${((allExercises.find(ex => ex.id === activeExerciseId)?.restSeconds || 60) - restRemaining) / (allExercises.find(ex => ex.id === activeExerciseId)?.restSeconds || 60) * 100}%`,
                  }}
                />
              </div>
              {/* Quick adjust buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => adjustRestTimer(-30)}
                  className="flex-1 px-3 py-1.5 rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700 text-xs font-medium transition active:scale-95"
                >
                  -30s
                </button>
                <button
                  onClick={() => adjustRestTimer(30)}
                  className="flex-1 px-3 py-1.5 rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700 text-xs font-medium transition active:scale-95"
                >
                  +30s
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="mx-auto max-w-md px-3 pt-4 pb-20">
        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-3 rounded-lg border p-3 text-sm ${
                feedback.type === 'error'
                  ? 'border-red-500/30 bg-red-500/10 text-red-400'
                  : feedback.type === 'success'
                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                    : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{feedback.message}</span>
                <button
                  onClick={() => setFeedback(null)}
                  className="text-xs uppercase tracking-wide text-gray-400 hover:text-white transition"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsible Exercise List */}
        <div className="space-y-2">
          {allExercises.map((exercise, index) => {
            const exerciseSets = entries.filter((entry) => entry.exerciseId === exercise.id);
            const isComplete = exerciseSets.length >= exercise.sets;
            const hasLogs = exerciseSets.length > 0;
            const isExpanded = expandedExercises.has(exercise.id);
            const isActive = activeExerciseId === exercise.id;
            const exerciseHistory = historicalData?.[exercise.id];

            return (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-lg border ${
                  isActive
                    ? 'border-cyan-500/30 bg-gray-900'
                    : 'border-gray-800 bg-gray-900'
                }`}
              >
                {/* Collapsed Header - Always visible */}
                <button
                  onClick={() => toggleExercise(exercise.id)}
                  className="w-full p-3 text-left transition active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {isComplete ? (
                          <span className="text-green-400 text-lg">✓</span>
                        ) : hasLogs ? (
                          <span className="text-yellow-400 text-lg">◐</span>
                        ) : (
                          <span className="text-gray-600 text-lg">○</span>
                        )}
                        <div>
                          <h3 className="font-medium text-white text-sm">{exercise.name}</h3>
                          <p className="text-xs text-gray-500">
                            {exercise.blockTitle} • Target: {exercise.sets}×{exercise.reps}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold ${
                        isComplete ? 'text-green-400' : hasLogs ? 'text-yellow-400' : 'text-gray-600'
                      }`}>
                        {exerciseSets.length}/{exercise.sets} sets
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-3 border-t border-gray-800 pt-3">
                        {/* Historical data */}
                        {exerciseHistory && exerciseHistory.length > 0 && (
                          <div className="text-xs">
                            <p className="text-gray-500 mb-1">
                              Last session ({lastSessionDate}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {exerciseHistory.map((set, idx) => (
                                <span key={idx} className="text-gray-400">
                                  {set.weight}kg × {set.reps}
                                  {idx < exerciseHistory.length - 1 ? ' •' : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Form cues */}
                        {exercise.cues && exercise.cues.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {exercise.cues.slice(0, 2).map((cue, idx) => (
                              <div key={idx}>• {cue}</div>
                            ))}
                          </div>
                        )}

                        {/* Logged sets with Play/Undo buttons */}
                        {exerciseSets.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-gray-400">Logged sets:</p>
                            {exerciseSets.map((set) => (
                              <div
                                key={set.set}
                                className="flex items-center justify-between rounded-md border border-gray-800 bg-black/30 px-3 py-2"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-white">
                                    Set {set.set}: {set.weight}kg × {set.reps}
                                  </p>
                                  {set.notes && (
                                    <p className="text-xs text-gray-500">{set.notes}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handlePlaySet(exercise.id, set)}
                                    className="p-2 rounded-md bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition active:scale-95"
                                    title="Copy and start next set"
                                  >
                                    <Play className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleUndoSet(exercise.id, set.set)}
                                    className="p-2 rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700 transition active:scale-95"
                                    title="Remove set"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Set logging form */}
                        <div className="space-y-3 pt-2">
                          <h4 className="text-xs font-semibold text-gray-400">
                            Log set {exerciseSets.length + 1}
                          </h4>

                          <div className="grid grid-cols-2 gap-3">
                            {/* Weight */}
                            <div className="space-y-1">
                              <label className="block text-xs font-medium text-gray-500">Weight (kg)</label>
                              <input
                                type="number"
                                step="2.5"
                                inputMode="decimal"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="w-full rounded-md border border-gray-800 bg-black px-3 py-2 text-sm text-white text-center placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                                placeholder="0"
                              />
                            </div>

                            {/* Reps */}
                            <div className="space-y-1">
                              <label className="block text-xs font-medium text-gray-500">Reps</label>
                              <input
                                type="number"
                                inputMode="numeric"
                                value={reps}
                                onChange={(e) => setReps(e.target.value)}
                                className="w-full rounded-md border border-gray-800 bg-black px-3 py-2 text-sm text-white text-center placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                                placeholder="0"
                              />
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-500">Notes (optional)</label>
                            <input
                              type="text"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="w-full rounded-md border border-gray-800 bg-black px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                              placeholder="Felt strong, smooth tempo"
                            />
                          </div>

                          {/* Quick copy last set */}
                          {exerciseSets.length > 0 && (
                            <button
                              onClick={() => {
                                const lastSet = exerciseSets[exerciseSets.length - 1];
                                handlePlaySet(exercise.id, lastSet);
                              }}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs font-medium transition active:scale-95"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Copy Set {exerciseSets.length}
                            </button>
                          )}

                          <PrimaryButton
                            onClick={() => handleLogSet(exercise.id)}
                            className="w-full"
                          >
                            Log Set {exerciseSets.length + 1}
                          </PrimaryButton>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Complete Workout Section */}
        {allExercisesComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-3 rounded-lg border border-gray-800 bg-gray-900 p-4"
          >
            <h3 className="text-sm font-semibold text-white">Complete Workout</h3>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-400">
                Overall workout RPE (5-10)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                min={5}
                max={10}
                value={rpeLastSet}
                onChange={(e) => setRpeLastSet(e.target.value)}
                className="w-full rounded-md border border-gray-800 bg-black px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                placeholder="7.5"
              />
            </div>
            <PrimaryButton
              onClick={handleCompleteWorkout}
              disabled={isSubmitting}
              className="w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Saving…' : 'Complete Workout'}
            </PrimaryButton>
          </motion.div>
        )}

        <p className="mt-4 text-center text-xs text-gray-600">
          {totalSetsLogged} {totalSetsLogged === 1 ? 'set logged' : 'sets logged'}
        </p>

        {/* Spacer for bottom navigation */}
        <div className="h-20" />
      </main>

      {/* Workout Editor Modal */}
      {showWorkoutEditor && (
        <WorkoutEditor
          workout={workout}
          isOpen={showWorkoutEditor}
          onClose={() => setShowWorkoutEditor(false)}
          onSave={() => {
            setShowWorkoutEditor(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
