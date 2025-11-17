'use client';

import { CompactNutrition } from './CompactNutrition';
import { WeeklyReviewBanner } from '@/components/nutrition/WeeklyReviewBanner';
import { motion } from 'framer-motion';

interface TodayViewProps {
  userId: string;
  nutrition: Awaited<ReturnType<typeof import('@/app/actions/nutrition').getTodayNutrition>>;
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

export function TodayView({ userId, nutrition }: TodayViewProps) {
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

        {/* Weekly Review Banner - Shows on Monday/Tuesday */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <WeeklyReviewBanner userId={userId} />
        </motion.div>

        {/* Daily Macro Progress - Hero Position */}
        <CompactNutrition nutrition={nutrition} />
      </main>
    </div>
  );
}
