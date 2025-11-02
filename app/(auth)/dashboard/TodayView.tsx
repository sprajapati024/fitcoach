'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExerciseLogger } from './ExerciseLogger';
import { CoachBrief } from './CoachBrief';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { workouts, WorkoutPayload } from '@/drizzle/schema';

type Workout = typeof workouts.$inferSelect;

interface TodayViewProps {
  workout: Workout | null;
  userId: string;
}

export function TodayView({ workout, userId }: TodayViewProps) {
  const router = useRouter();
  const [isLogging, setIsLogging] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [skipReason, setSkipReason] = useState('');

  const handleSkipToday = async () => {
    if (!workout || !skipReason) {
      alert('Please select a reason for skipping');
      return;
    }

    try {
      // Log skip as a workout with 0 duration and no sets
      const response = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId: workout.id,
          entries: [],
          rpeLastSet: null,
          performedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        router.refresh();
        setIsSkipping(false);
      } else {
        const error = await response.json();
        alert(`Failed to skip workout: ${error.error}`);
      }
    } catch (error) {
      console.error('Error skipping workout:', error);
      alert('Failed to skip workout. Please try again.');
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
        onComplete={() => {
          setIsLogging(false);
          router.refresh();
        }}
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
          className="w-full text-sm font-medium text-fg2 transition hover:text-fg0"
        >
          Skip Today
        </button>
      ) : (
        <Card className="space-y-3 bg-bg0">
          <p className="text-sm font-medium text-fg0">Why are you skipping?</p>
          <select
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
            className="w-full rounded-md border border-line1 bg-bg0 px-3 py-2 text-sm text-fg0 focus:border-fg0 focus:outline-none focus:ring-1 focus:ring-fg0"
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
              className="flex-1 rounded-full border border-line1 bg-bg0 px-4 py-2 text-sm font-semibold text-fg0 transition hover:bg-bg1"
            >
              Cancel
            </button>
            <PrimaryButton
              onClick={handleSkipToday}
              disabled={!skipReason}
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
