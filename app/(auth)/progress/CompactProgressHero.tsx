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

  // Color coding based on compliance
  const isHighCompliance = compliancePercent >= 80;
  const isMediumCompliance = compliancePercent >= 50 && compliancePercent < 80;
  const isLowCompliance = compliancePercent < 50 && compliancePercent > 0;

  const getBorderColor = () => {
    if (isHighCompliance) return 'border-cyan-500/30';
    if (isMediumCompliance) return 'border-orange-500/30';
    return 'border-red-500/30';
  };

  const getBgGradient = () => {
    if (isHighCompliance) return 'bg-gradient-to-br from-cyan-500/10 to-indigo-500/10';
    if (isMediumCompliance) return 'bg-gradient-to-br from-orange-500/10 to-yellow-500/10';
    return 'bg-gradient-to-br from-red-500/10 to-pink-500/10';
  };

  const getProgressGradient = () => {
    if (isHighCompliance) return 'bg-gradient-to-r from-cyan-500 to-indigo-600';
    if (isMediumCompliance) return 'bg-gradient-to-r from-orange-500 to-yellow-500';
    return 'bg-gradient-to-r from-red-500 to-pink-500';
  };

  const getButtonGradient = () => {
    if (isHighCompliance) return 'bg-gradient-to-r from-cyan-500 to-indigo-600 shadow-cyan-500/20';
    return 'bg-gradient-to-r from-purple-500 to-indigo-600 shadow-purple-500/20';
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
          className="mt-3 inline-block text-sm text-cyan-400 hover:text-cyan-300 transition"
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
      className={`relative overflow-hidden rounded-lg border p-4 ${getBorderColor()} ${getBgGradient()}`}
    >
      <div className="space-y-3">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-cyan-500">
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
              className={`h-full transition-all duration-500 ${getProgressGradient()}`}
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
          className={`w-full flex items-center justify-center gap-2 h-12 rounded-lg ${getButtonGradient()} font-semibold text-white shadow-lg transition active:scale-95 hover:scale-[1.02]`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Keep Going</span>
        </Link>
      </div>
    </motion.div>
  );
}
