'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, Dumbbell } from 'lucide-react';
import type { plans } from '@/drizzle/schema';

type Plan = typeof plans.$inferSelect;

interface CompactPlanCardProps {
  plan: Plan;
  delay?: number;
}

export function CompactPlanCard({ plan, delay = 0 }: CompactPlanCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="rounded-lg border border-gray-800 bg-gray-900 p-3"
    >
      {/* Plan title and summary */}
      <div className="mb-3">
        <h3 className="font-semibold text-white text-sm mb-1">{plan.title}</h3>
        <p className="text-xs text-gray-400 line-clamp-2">{plan.summary}</p>
      </div>

      {/* Plan stats */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{plan.durationWeeks}w</span>
        </div>
        <div className="flex items-center gap-1">
          <Dumbbell className="h-3 w-3" />
          <span>{plan.daysPerWeek}d/wk</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{plan.minutesPerSession}m</span>
        </div>
      </div>

      {/* Start date if active */}
      {plan.active && plan.startDate && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="text-xs text-gray-500">
            Started: <span className="text-gray-400">{plan.startDate}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
