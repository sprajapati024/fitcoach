'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExerciseLogger } from './ExerciseLogger';
import { CoachBrief } from './CoachBrief';
import type { workouts } from '@/drizzle/schema';

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
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Today</h1>

        <CoachBrief userId={userId} />

        <div className="mt-6 bg-white rounded-lg p-6 shadow-sm text-center">
          <p className="text-gray-600 mb-2">No workout scheduled for today.</p>
          <p className="text-gray-500 text-sm">Enjoy your rest day!</p>
        </div>
      </div>
    );
  }

  const workoutPayload = workout.payload as any;

  if (isLogging) {
    return (
      <ExerciseLogger
        workout={workout}
        userId={userId}
        onComplete={() => {
          setIsLogging(false);
          router.refresh();
        }}
        onCancel={() => setIsLogging(false)}
      />
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Today's Workout</h1>

      {/* Coach Brief */}
      <CoachBrief userId={userId} />

      {/* Workout Details */}
      <div className="mt-6 space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-2">
            {workoutPayload.focus || 'Training Session'}
          </h2>
          <p className="text-sm text-gray-600">
            {workoutPayload.blocks?.length || 0} blocks · {workout.durationMinutes || 60} min
          </p>
        </div>

        {/* Workout Blocks */}
        <div className="space-y-4">
          {workoutPayload.blocks?.map((block: any, index: number) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-2 text-gray-900">
                {block.title}
              </h3>
              <div className="space-y-2">
                {block.exercises?.map((exercise: any, exIndex: number) => (
                  <div key={exIndex} className="text-sm text-gray-700 py-1">
                    <div className="font-medium">{exercise.name || exercise.id}</div>
                    <div className="text-gray-500 text-xs mt-0.5">
                      {exercise.sets}×{exercise.reps}
                      {exercise.tempo && ` • Tempo: ${exercise.tempo}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Start Workout Button */}
        <button
          onClick={() => setIsLogging(true)}
          className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
        >
          Start Workout
        </button>

        {/* Skip Today */}
        {!isSkipping ? (
          <button
            onClick={() => setIsSkipping(true)}
            className="w-full text-gray-600 py-2 text-sm hover:text-gray-800 transition-colors"
          >
            Skip Today
          </button>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-gray-900">Why are you skipping?</p>
            <select
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">Select a reason...</option>
              <option value="rest">Planned rest day</option>
              <option value="injury">Injury or discomfort</option>
              <option value="schedule">Schedule conflict</option>
              <option value="fatigue">Too fatigued</option>
              <option value="other">Other</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setIsSkipping(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded font-medium text-sm hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSkipToday}
                disabled={!skipReason}
                className="flex-1 bg-black text-white py-2 rounded font-medium text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
