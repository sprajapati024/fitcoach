'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExerciseLogger, type LoggerResult } from './ExerciseLogger';
import { CoachBrief } from './CoachBrief';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { workouts, WorkoutPayload } from '@/drizzle/schema';
import { enqueueLog } from '@/lib/offlineQueue';
import type { WorkoutLogRequest } from '@/lib/validation';

type Workout = typeof workouts.$inferSelect;

interface TodayViewProps {
  workout: Workout | null;
  userId: string;
}

type Feedback = {
  type: 'success' | 'error' | 'info';
  message: string;
};

export function TodayView({ workout, userId }: TodayViewProps) {
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
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
        <h1 className="text-2xl font-semibold text-fg0">Today</h1>

        <CoachBrief userId={userId} />

        <Card className="space-y-2 bg-bg1 text-center">
          <p className="text-sm text-fg1">No workout scheduled for today.</p>
          <p className="text-xs text-fg2">Enjoy the recovery—your body adapts while you rest.</p>
        </Card>
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

  const sessionDate = workout.sessionDate
    ? new Date(workout.sessionDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-semibold text-fg0">Today&apos;s Workout</h1>
        {sessionDate && <span className="text-sm text-fg2">Scheduled for {sessionDate}</span>}
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
            className="touch-feedback rounded-full p-1 text-xs uppercase tracking-wide text-fg2 transition-all active:text-fg0"
          >
            Dismiss
          </button>
        </Card>
      ) : null}

      <CoachBrief userId={userId} />

      <Card className="space-y-1 bg-bg1/80">
        <h2 className="text-lg font-semibold text-fg0">
          {workoutPayload.focus || workout.title || 'Training Session'}
        </h2>
        <p className="text-sm text-fg2">
          {(workoutPayload.blocks?.length ?? 0)} blocks · {workout.durationMinutes || 60} min
        </p>
      </Card>

      <div className="space-y-4">
        {workoutPayload.blocks?.map((block, index) => (
          <Card key={index} className="space-y-3 bg-bg0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fg0">{block.title}</h3>
              <span className="text-xs uppercase tracking-wide text-fg2">{block.type}</span>
            </div>
            <div className="space-y-2">
              {block.exercises?.map((exercise, exIndex) => (
                <div key={exIndex} className="rounded-md border border-line1/60 p-3 text-sm text-fg1">
                  <div className="text-fg0">{exercise.name || exercise.id}</div>
                  <div className="text-xs text-fg2">
                    {exercise.sets}×{exercise.reps}
                    {exercise.tempo && ` • Tempo: ${exercise.tempo}`}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <PrimaryButton
        onClick={() => setIsLogging(true)}
        className="w-full normal-case"
      >
        Start Workout
      </PrimaryButton>

      {!isSkipping ? (
        <button
          onClick={() => setIsSkipping(true)}
          className="touch-feedback w-full text-sm font-medium text-fg2 transition-all active:text-fg0"
        >
          Skip Today
        </button>
      ) : (
        <Card className="space-y-3 bg-bg0">
          <p className="text-sm font-medium text-fg0">Why are you skipping?</p>
          <select
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
            className="w-full rounded-md border border-line1 bg-bg0 px-3 py-2 text-sm text-fg0 transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">Select a reason...</option>
            <option value="rest">Planned rest day</option>
            <option value="injury">Injury or discomfort</option>
            <option value="schedule">Schedule conflict</option>
            <option value="fatigue">Too fatigued</option>
            <option value="other">Other</option>
          </select>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => setIsSkipping(false)}
              className="touch-feedback flex-1 rounded-full border border-line1 bg-bg0 px-4 py-2 text-sm font-semibold text-fg0 transition-all active:bg-bg1"
            >
              Cancel
            </button>
            <PrimaryButton
              onClick={handleSkipToday}
              disabled={!skipReason || isSkipSubmitting}
              loading={isSkipSubmitting}
              className="flex-1 normal-case disabled:cursor-not-allowed disabled:opacity-60"
            >
              Confirm Skip
            </PrimaryButton>
          </div>
        </Card>
      )}
    </div>
  );
}
