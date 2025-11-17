'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Zap, Play, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import type { workouts, WorkoutPayload } from '@/drizzle/schema';

type Workout = typeof workouts.$inferSelect;

interface CompactWeekDayCardProps {
  date: string;
  dayOfWeek: string;
  dayNumber: number;
  workout: Workout | null;
  isToday: boolean;
  status?: 'completed' | 'skipped';
  delay?: number;
}

function formatDate(date: string): string {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function CompactWeekDayCard({
  date,
  dayOfWeek,
  dayNumber,
  workout,
  isToday,
  status,
  delay = 0,
}: CompactWeekDayCardProps) {
  const hasWorkout = !!workout;

  // Rest day card
  if (!hasWorkout) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay }}
        className={`
          relative rounded-lg border border-gray-800 bg-gray-900 p-4
          ${isToday ? 'ring-2 ring-white/20' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white uppercase tracking-wide">
                {dayOfWeek}
              </span>
              <span className="text-xs text-gray-500">{formatDate(date)}</span>
              {isToday && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                  <div className="h-1 w-1 rounded-full bg-white animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gray-300">Today</span>
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1">Rest Day</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Workout card
  const workoutPayload = workout.payload as WorkoutPayload;
  const workoutType = workoutPayload.focus || workout.title || 'Workout';
  const totalExercises =
    workoutPayload.blocks?.reduce((sum, block) => sum + (block.exercises?.length ?? 0), 0) ?? 0;
  const duration = workout.durationMinutes || 60;

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      className={`
        relative rounded-lg border p-4 transition-all
        ${isToday
          ? 'border-gray-700 bg-gradient-to-br from-gray-900/50 to-gray-800/50 ring-2 ring-white/20'
          : 'border-gray-800 bg-gray-900 hover:border-gray-700'
        }
        ${hasWorkout && !status ? 'cursor-pointer active:scale-[0.99]' : ''}
      `}
    >
      {/* Today pulse indicator */}
      {isToday && (
        <div className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
      )}

      <div className="flex items-center justify-between gap-3">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white uppercase tracking-wide">
              {dayOfWeek}
            </span>
            <span className="text-xs text-gray-500">{formatDate(date)}</span>
            {isToday && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                <div className="h-1 w-1 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-300">Today</span>
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-white truncate">{workoutType}</p>

          <div className="flex items-center gap-3 mt-1.5 text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="text-xs">{duration} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span className="text-xs">{totalExercises} exercises</span>
            </div>
          </div>
        </div>

        {/* Right: Status or Action */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {status === 'completed' ? (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">Done</span>
            </div>
          ) : status === 'skipped' ? (
            <div className="flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1">
              <XCircle className="h-3.5 w-3.5 text-yellow-500" />
              <span className="text-xs font-medium text-yellow-500">Skipped</span>
            </div>
          ) : isToday ? (
            <div className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-1.5 hover:bg-gray-700 transition">
              <Play className="h-3.5 w-3.5 text-white" />
              <span className="text-xs font-semibold text-white">Start</span>
            </div>
          ) : (
            <button
              className="p-1.5 rounded-lg hover:bg-gray-800 transition"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Add actions menu
              }}
            >
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Make workout cards clickable to start/view
  if (hasWorkout && !status) {
    return (
      <Link href={`/workout/${workout.id}${isToday ? '?start=true' : ''}`}>
        {cardContent}
      </Link>
    );
  }

  // Completed/skipped workouts - view only
  if (hasWorkout) {
    return (
      <Link href={`/workout/${workout.id}`}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
