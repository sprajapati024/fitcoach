'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface CompactProgressHeroProps {
  totalCompleted: number;
  totalSkipped: number;
  totalSets: number;
  windowCompliance: number | null;
  completedWindow: number;
  windowTotal: number;
  lastWorkoutDate: string | null;
  hasActivePlan: boolean;
}

export function CompactProgressHero({
  totalCompleted,
  totalSkipped,
  totalSets,
  windowCompliance,
  completedWindow,
  windowTotal,
  lastWorkoutDate,
  hasActivePlan,
}: CompactProgressHeroProps) {
  const compliancePercent = windowCompliance ?? 0;

  // Color coding based on compliance - only for progress bar
  const isHighCompliance = compliancePercent >= 80;
  const isMediumCompliance = compliancePercent >= 50 && compliancePercent < 80;

  const getProgressColor = () => {
    if (isHighCompliance) return 'bg-emerald-500';
    if (isMediumCompliance) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (totalCompleted === 0 && !hasActivePlan) {
    // No plan exists - show simple message to create plan
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="relative overflow-hidden rounded-lg border border-gray-800 bg-gray-900 p-6 text-center"
      >
        <p className="text-gray-400 text-sm">
          Your progress will appear here once you complete your first workout.
        </p>
        <Link
          href="/dashboard"
          className="mt-3 inline-block text-sm text-gray-300 hover:text-white transition"
        >
          Go to Dashboard →
        </Link>
      </motion.div>
    );
  }

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
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-300">
            7-Day Snapshot
          </span>
        </div>

        {/* Main Metric - Adherence */}
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-white">
              {compliancePercent}%
            </span>
            <span className="text-sm text-gray-400">adherence</span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${Math.min(compliancePercent, 100)}%` }}
            />
          </div>

          <p className="text-xs text-gray-400 mt-1">
            {completedWindow} of {windowTotal} workouts completed this week
          </p>
        </div>

        {/* Stats One-Liner */}
        <div className="flex items-center gap-4 text-gray-400 text-sm">
          <div className="flex items-center gap-1.5">
            <span>🏋️</span>
            <span className="font-medium text-white">{totalCompleted}</span>
            <span className="text-xs text-gray-600">workouts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>💪</span>
            <span className="font-medium text-white">{totalSets}</span>
            <span className="text-xs text-gray-600">sets</span>
          </div>
        </div>

        {/* Last Workout Info */}
        {lastWorkoutDate && (
          <div className="text-xs text-gray-500">
            Last workout: <span className="text-gray-400">{lastWorkoutDate}</span>
          </div>
        )}

        {/* CTA Button */}
        <Link
          href="/dashboard"
          className="w-full flex items-center justify-center gap-2 h-12 rounded-lg bg-gray-800 font-semibold text-white transition active:scale-95 hover:bg-gray-700"
        >
          <TrendingUp className="h-4 w-4" />
          <span>Keep Going</span>
        </Link>
      </div>
    </motion.div>
  );
}
