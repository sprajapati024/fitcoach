'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExerciseLogger, type LoggerResult } from './ExerciseLogger';
import { CoachBrief } from './CoachBrief';
import { Card } from '@/components/Card';
import type { workouts, WorkoutPayload } from '@/drizzle/schema';
import { enqueueLog } from '@/lib/offlineQueue';
import type { WorkoutLogRequest } from '@/lib/validation';
import { Dumbbell, Clock, Zap, ChevronRight } from 'lucide-react';

type Workout = typeof workouts.$inferSelect;

interface TodayViewProps {
  workout: Workout | null;
  userId: string;
  userName?: string | null;
}

type Feedback = {
  type: 'success' | 'error' | 'info';
  message: string;
};

export function TodayView({ workout, userId, userName }: TodayViewProps) {
  const router = useRouter();
  const [isLogging, setIsLogging] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSkipSubmitting, setIsSkipSubmitting] = useState(false);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const handleLoggerComplete = (result: LoggerResult) => {
    setIsLogging(false);
    setSkipReason('');
    setIsSkipping(false);
    router.refresh();
    setFeedback({
      type: result.status === 'completed' ? 'success' : 'info',
      message: result.message,
    });
  };

  const handleSkipToday = async () => {
    if (!workout || !skipReason) {
      setFeedback({ type: 'error', message: 'Select a reason before skipping.' });
      return;
    }

    const payload: WorkoutLogRequest = {
      workoutId: workout.id,
      entries: [],
      skipReason,
      performedAt: new Date().toISOString(),
    };

    setIsSkipSubmitting(true);

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await enqueueLog(payload);
        setFeedback({
          type: 'info',
          message: 'Offline — skip queued. We will sync it once you reconnect.',
        });
        setIsSkipping(false);
        setSkipReason('');
        router.refresh();
        return;
      }

      const response = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        setFeedback({
          type: 'success',
          message: result.message ?? 'Workout skipped. Enjoy the recovery.',
        });
        router.refresh();
        setIsSkipping(false);
        setSkipReason('');
      } else {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to skip workout');
      }
    } catch (error) {
      try {
        await enqueueLog(payload);
        setFeedback({
          type: 'info',
          message: 'Connection issue — skip saved offline and will sync soon.',
        });
        setIsSkipping(false);
        setSkipReason('');
        router.refresh();
      } catch (queueError) {
        console.error('Error skipping workout:', error, queueError);
        setFeedback({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to skip workout. Please try again.',
        });
      }
    } finally {
      setIsSkipSubmitting(false);
    }
  };

  if (!workout) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-8 p-4 pb-24">
        <CoachBrief userId={userId} userName={userName} />

        <div className="relative overflow-hidden rounded-3xl border border-surface-border bg-gradient-to-br from-surface-1 to-surface-0 p-8 text-center">
          <div className="absolute -right-20 -top-20 h-64 w-64 animate-drift rounded-full bg-gradient-to-br from-cyan-500/10 to-indigo-600/10 blur-3xl" />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-600/20">
              <Zap className="h-10 w-10 text-cyan-500" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-text-primary">Rest Day</h3>
            <p className="text-sm text-text-muted">Your body adapts while you rest. Recovery is progress.</p>
          </div>
        </div>
      </div>
    );
  }

  const workoutPayload = workout.payload as WorkoutPayload;

  if (isLogging) {
    return (
      <ExerciseLogger
        workout={workout}
        onComplete={handleLoggerComplete}
        onCancel={() => setIsLogging(false)}
      />
    );
  }

  const workoutType = workoutPayload.focus || workout.title || 'Workout';
  const totalExercises = workoutPayload.blocks?.reduce(
    (sum, block) => sum + (block.exercises?.length ?? 0),
    0
  ) ?? 0;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-4 pb-24">
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-2xl border p-4 text-sm ${
            feedback.type === 'error'
              ? 'border-error/40 bg-error/10 text-error-light'
              : feedback.type === 'success'
                ? 'border-success/40 bg-success/10 text-success-light'
                : 'border-info/40 bg-info/10 text-info-light'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="touch-feedback text-xs font-medium uppercase tracking-wide opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <CoachBrief userId={userId} userName={userName} />

      {/* Hero Workout Card */}
      <Link
        href={`/workout/${workout.id}`}
        className="group relative block overflow-hidden rounded-3xl border border-surface-border bg-gradient-to-br from-cyan-500/10 via-surface-1 to-indigo-600/10 p-8 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_40px_rgba(6,182,212,0.2)] active:scale-[0.98]"
      >
        {/* Animated background blobs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 animate-drift rounded-full bg-gradient-to-br from-cyan-500/20 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 animate-drift rounded-full bg-gradient-to-tr from-indigo-600/20 to-transparent blur-3xl" style={{ animationDelay: '1s' }} />

        <div className="relative">
          {/* Workout type badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2">
            <Dumbbell className="h-5 w-5 text-cyan-500" />
            <span className="text-sm font-semibold text-cyan-500">Today's Workout</span>
          </div>

          {/* Workout title */}
          <h2 className="mb-4 text-4xl font-bold text-text-primary">
            {workoutType}
          </h2>

          {/* Workout stats */}
          <div className="mb-6 flex flex-wrap items-center gap-4 text-text-muted">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">{workout.durationMinutes || 60} min</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <span className="text-sm font-medium">{totalExercises} exercises</span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2 text-cyan-500 transition-transform group-hover:translate-x-2">
            <span className="font-semibold">View Details</span>
            <ChevronRight className="h-5 w-5" />
          </div>
        </div>
      </Link>

      {/* Start Workout Button */}
      <button
        onClick={() => setIsLogging(true)}
        className="neural-shimmer w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-4 font-semibold text-gray-950 shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] active:scale-[0.98]"
      >
        Start Workout
      </button>

      {/* Skip workout */}
      {!isSkipping ? (
        <button
          onClick={() => setIsSkipping(true)}
          className="touch-feedback w-full text-sm font-medium text-text-muted transition-all hover:text-text-secondary"
        >
          Skip Today
        </button>
      ) : (
        <div className="space-y-4 rounded-2xl border border-surface-border bg-surface-1 p-6">
          <p className="text-sm font-semibold text-text-primary">Why are you skipping?</p>
          <select
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
            className="w-full rounded-xl border border-surface-border bg-surface-0 px-4 py-3 text-sm text-text-primary transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          >
            <option value="">Select a reason...</option>
            <option value="rest">Planned rest day</option>
            <option value="injury">Injury or discomfort</option>
            <option value="schedule">Schedule conflict</option>
            <option value="fatigue">Too fatigued</option>
            <option value="other">Other</option>
          </select>
          <div className="flex gap-3">
            <button
              onClick={() => setIsSkipping(false)}
              className="touch-feedback flex-1 rounded-xl border border-surface-border bg-surface-0 px-4 py-3 text-sm font-semibold text-text-primary transition-all hover:bg-surface-1 active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={handleSkipToday}
              disabled={!skipReason || isSkipSubmitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-gray-950 transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSkipSubmitting ? 'Confirming...' : 'Confirm Skip'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
