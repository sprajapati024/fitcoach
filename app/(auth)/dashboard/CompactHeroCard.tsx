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
      // No plan exists - show "Ready to Transform?" prompt
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="relative overflow-hidden rounded-lg border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 p-4"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Ready to Transform?</h3>
                <p className="text-xs text-gray-400">Your journey starts here</p>
              </div>
            </div>

            <Link
              href="/plan"
              className="flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 font-semibold text-white shadow-lg shadow-purple-500/20 transition active:scale-95 hover:scale-[1.02]"
            >
              <Sparkles className="h-4 w-4" />
              <span>Create Your Plan</span>
            </Link>
          </div>
        </motion.div>
      );
    }

    // Rest Day (has a plan, but no workout today)
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="relative overflow-hidden rounded-lg border border-gray-800 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 p-4"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
              <Zap className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Rest Day</h3>
              <p className="text-xs text-gray-400">Recovery is progress</p>
            </div>
          </div>

          <Link
            href="/progress"
            className="flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 font-semibold text-white shadow-lg shadow-purple-500/20 transition active:scale-95 hover:scale-[1.02]"
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
      className="relative overflow-hidden rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 p-4"
    >
      <div className="space-y-3">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-cyan-500">Today</span>
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
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 font-semibold text-white shadow-lg shadow-cyan-500/20 transition active:scale-95 hover:scale-[1.02]"
        >
          <Play className="h-4 w-4" />
          <span>Start Workout</span>
        </Link>
      </div>
    </motion.div>
  );
}
