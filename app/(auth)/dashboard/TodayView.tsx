'use client';

import { CompactNutrition } from './CompactNutrition';
import { QuickActions } from './QuickActions';
import { CompactCoachBrief } from './CompactCoachBrief';
import { motion } from 'framer-motion';

interface TodayViewProps {
  userId: string;
  nutrition: Awaited<ReturnType<typeof import('@/app/actions/nutrition').getTodayNutrition>>;
  hasActivePlan: boolean;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  };
  return today.toLocaleDateString('en-US', options);
}

export function TodayView({ userId, nutrition, hasActivePlan }: TodayViewProps) {
  const greeting = getGreeting();
  const date = getFormattedDate();

  return (
    <div className="min-h-screen bg-black -mx-4 -mt-6">
      {/* Main Content - Phone App Style */}
      <main className="mx-auto max-w-md px-3 pt-4 pb-24 space-y-3">
        {/* Greeting Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pt-2 pb-1"
        >
          <h1 className="text-2xl font-bold text-white">{greeting}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{date}</p>
        </motion.div>

        {/* Daily Macro Progress - Hero Position */}
        <CompactNutrition nutrition={nutrition} />

        {/* AI Nutrition Coach Brief */}
        <CompactCoachBrief userId={userId} hasActivePlan={hasActivePlan} />

        {/* Quick Actions */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Quick Actions</h2>
          <QuickActions />
        </div>
      </main>
    </div>
  );
}
