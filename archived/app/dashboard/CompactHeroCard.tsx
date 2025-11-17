'use client';

import { Clock, Zap, Play, TrendingUp, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { workouts, WorkoutPayload } from '@/drizzle/schema';

type Workout = typeof workouts.$inferSelect;

interface CompactHeroCardProps {
  workout: Workout | null;
  hasActivePlan: boolean;
}

export function CompactHeroCard({ workout, hasActivePlan }: CompactHeroCardProps) {
  if (!workout) {
    // No workout today
    if (!hasActivePlan) {
      // No plan exists - coach will handle onboarding, so don't show anything
      return null;
    }

    // Rest Day (has a plan, but no workout today)
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="relative overflow-hidden rounded-lg border border-gray-700 bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-4"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700/50">
              <Zap className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Rest Day</h3>
              <p className="text-xs text-gray-400">Recovery is progress</p>
            </div>
          </div>

          <Link
            href="/progress"
            className="flex h-12 items-center justify-center gap-2 rounded-lg bg-gray-800 font-semibold text-white transition active:scale-95 hover:bg-gray-700"
          >
            <TrendingUp className="h-4 w-4" />
            <span>View Progress</span>
          </Link>
        </div>
      </motion.div>
    );
  }

  const workoutPayload = workout.payload as WorkoutPayload;
  const workoutType = workoutPayload.focus || workout.title || 'Workout';
  const totalExercises =
    workoutPayload.blocks?.reduce((sum, block) => sum + (block.exercises?.length ?? 0), 0) ?? 0;
  const duration = workout.durationMinutes || 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="relative overflow-hidden rounded-lg border border-gray-700 bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-4"
    >
      <div className="space-y-3">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-300">Today</span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white leading-tight">{workoutType}</h2>

        {/* Stats */}
        <div className="flex items-center gap-4 text-gray-400">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{duration} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{totalExercises} exercises</span>
          </div>
        </div>

        {/* CTA Button - Direct to Logger */}
        <Link
          href={`/workout/${workout.id}?start=true`}
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-gray-800 font-semibold text-white transition active:scale-95 hover:bg-gray-700"
        >
          <Play className="h-4 w-4" />
          <span>Start Workout</span>
        </Link>
      </div>
    </motion.div>
  );
}
