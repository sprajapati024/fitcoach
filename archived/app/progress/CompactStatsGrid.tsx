'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Activity, XCircle, Target, Zap } from 'lucide-react';
import { useState } from 'react';

interface CompactStatsGridProps {
  totalCompleted: number;
  totalSkipped: number;
  totalSets: number;
  averageRpe: number | null;
  recentRpeCount: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  color: 'cyan' | 'red' | 'indigo' | 'orange' | 'purple';
  details?: string;
  delay: number;
}

function StatCard({ icon, label, value, subtitle, color, details, delay }: StatCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const colorStyles = {
    cyan: {
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-500/10',
      icon: 'text-cyan-500',
      gradient: 'from-cyan-500/5 to-cyan-500/10',
    },
    red: {
      border: 'border-red-500/30',
      bg: 'bg-red-500/10',
      icon: 'text-red-500',
      gradient: 'from-red-500/5 to-red-500/10',
    },
    indigo: {
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-500/10',
      icon: 'text-indigo-500',
      gradient: 'from-indigo-500/5 to-indigo-500/10',
    },
    orange: {
      border: 'border-orange-500/30',
      bg: 'bg-orange-500/10',
      icon: 'text-orange-500',
      gradient: 'from-orange-500/5 to-orange-500/10',
    },
    purple: {
      border: 'border-purple-500/30',
      bg: 'bg-purple-500/10',
      icon: 'text-purple-500',
      gradient: 'from-purple-500/5 to-purple-500/10',
    },
  };

  const style = colorStyles[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`rounded-lg border ${style.border} bg-gradient-to-br ${style.gradient} overflow-hidden`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${style.bg} flex-shrink-0`}>
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            </div>
          </div>
          {details && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
            </motion.div>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && details && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-gray-800">
              <p className="text-sm text-gray-400">{details}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function CompactStatsGrid({
  totalCompleted,
  totalSkipped,
  totalSets,
  averageRpe,
  recentRpeCount,
}: CompactStatsGridProps) {
  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="px-1">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Detailed Stats
        </h3>
        <p className="text-xs text-gray-600 mt-0.5">
          All-time metrics from your training history
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3">
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Completed"
          value={totalCompleted.toString()}
          subtitle="Total workouts logged"
          color="cyan"
          details="This includes all completed workout sessions in your training history. Keep building your momentum!"
          delay={0.3}
        />

        <StatCard
          icon={<XCircle className="h-5 w-5" />}
          label="Skipped"
          value={totalSkipped.toString()}
          subtitle="Missed or rest days"
          color="red"
          details="Includes logged rest days or missed sessions. Remember, consistency is key to progress!"
          delay={0.35}
        />

        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="Sets Logged"
          value={totalSets.toString()}
          subtitle="All-time recorded sets"
          color="indigo"
          details="Total number of sets you've tracked across all exercises. Every rep counts towards your goals!"
          delay={0.4}
        />

        {averageRpe !== null && (
          <StatCard
            icon={<Zap className="h-5 w-5" />}
            label="Avg RPE"
            value={averageRpe.toFixed(1)}
            subtitle={`Based on last ${recentRpeCount} workouts`}
            color={averageRpe >= 8 ? 'orange' : averageRpe >= 6 ? 'purple' : 'cyan'}
            details={
              averageRpe >= 8
                ? 'High intensity! You\'re pushing hard. Make sure to balance with adequate recovery.'
                : averageRpe >= 6
                ? 'Moderate intensity. Good balance between challenge and sustainability.'
                : 'Lower intensity. Consider increasing effort if you want to see faster progress.'
            }
            delay={0.45}
          />
        )}
      </div>

      {/* Empty State for RPE */}
      {averageRpe === null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.45 }}
          className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 text-center"
        >
          <Zap className="h-8 w-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No RPE data yet</p>
          <p className="text-xs text-gray-600 mt-1">
            Rate your workouts to track intensity over time
          </p>
        </motion.div>
      )}
    </div>
  );
}
