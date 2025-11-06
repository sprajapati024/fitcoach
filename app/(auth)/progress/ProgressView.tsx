'use client';

import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import { CompactProgressHero } from './CompactProgressHero';
import { CompactStatsGrid } from './CompactStatsGrid';

interface ProgressViewProps {
  totalCompleted: number;
  totalSkipped: number;
  totalSets: number;
  windowCompliance: number | null;
  completedWindow: number;
  windowTotal: number;
  averageRpe: number | null;
  recentRpeCount: number;
  lastWorkoutDate: string | null;
}

export function ProgressView({
  totalCompleted,
  totalSkipped,
  totalSets,
  windowCompliance,
  completedWindow,
  windowTotal,
  averageRpe,
  recentRpeCount,
  lastWorkoutDate,
}: ProgressViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white">
      {/* Compact max-w-md layout */}
      <div className="mx-auto max-w-md">
        {/* Header - Sticky */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-black/80 p-4 backdrop-blur-sm"
        >
          <div>
            <h1 className="text-xl font-bold text-white">Progress</h1>
            <p className="text-xs text-gray-500">Your training momentum</p>
          </div>
          <Link
            href="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-800 bg-gray-900 transition hover:bg-gray-800"
          >
            <Settings className="h-4 w-4 text-gray-400" />
          </Link>
        </motion.header>

        {/* Main Content */}
        <div className="space-y-6 p-4">
          {/* Hero Card */}
          <CompactProgressHero
            totalCompleted={totalCompleted}
            totalSkipped={totalSkipped}
            totalSets={totalSets}
            windowCompliance={windowCompliance}
            completedWindow={completedWindow}
            windowTotal={windowTotal}
            lastWorkoutDate={lastWorkoutDate}
          />

          {/* Stats Grid */}
          <CompactStatsGrid
            totalCompleted={totalCompleted}
            totalSkipped={totalSkipped}
            totalSets={totalSets}
            averageRpe={averageRpe}
            recentRpeCount={recentRpeCount}
          />

          {/* Motivational Footer */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="rounded-lg border border-gray-800 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 p-4 text-center"
          >
            <p className="text-sm text-gray-400">
              {totalCompleted === 0 && "Start your fitness journey today! 🚀"}
              {totalCompleted > 0 && totalCompleted < 5 && "Great start! Keep the momentum going 💪"}
              {totalCompleted >= 5 && totalCompleted < 20 && "You're building solid habits! 🔥"}
              {totalCompleted >= 20 && totalCompleted < 50 && "Impressive consistency! 🌟"}
              {totalCompleted >= 50 && "You're a training machine! 💯"}
            </p>
          </motion.div>

          {/* Spacer for bottom navigation */}
          <div className="h-20" />
        </div>
      </div>
    </div>
  );
}
