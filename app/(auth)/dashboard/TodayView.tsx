'use client';

import { CompactHeader } from './CompactHeader';
import { StreakBadge } from './StreakBadge';
import { CompactHeroCard } from './CompactHeroCard';
import { CompactNutrition } from './CompactNutrition';
import { QuickActions } from './QuickActions';
import { CompactCoachBrief } from './CompactCoachBrief';
import type { workouts } from '@/drizzle/schema';

type Workout = typeof workouts.$inferSelect;

interface TodayViewProps {
  workout: Workout | null;
  userId: string;
  userName?: string | null;
  nutrition: Awaited<ReturnType<typeof import('@/app/actions/nutrition').getTodayNutrition>>;
}

function getTimeBasedGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'Good Morning';
  } else if (hour >= 12 && hour < 18) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
}

export function TodayView({ workout, userId, userName, nutrition }: TodayViewProps) {
  const greeting = getTimeBasedGreeting();
  const displayName = userName || 'there';

  // Mock streak - in production, fetch from database
  const streakDays = 12;

  return (
    <div className="min-h-screen bg-gray-950 -mx-4 -mt-6 -mb-32">
      {/* Compact Header */}
      <CompactHeader userName={userName} />

      {/* Main Content - Phone App Style */}
      <main className="mx-auto max-w-md px-3 pt-4 pb-20 space-y-3">
        {/* Streak Badge + Greeting */}
        <div className="space-y-1.5">
          <StreakBadge days={streakDays} />
          <h1 className="text-sm font-medium text-gray-400">
            {greeting}, {displayName}
          </h1>
        </div>

        {/* Hero Card (Workout or Rest Day) */}
        <CompactHeroCard workout={workout} />

        {/* Compact Nutrition */}
        <CompactNutrition nutrition={nutrition} />

        {/* Quick Actions */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Quick Actions</h2>
          <QuickActions />
        </div>

        {/* Coach Brief (Collapsible) */}
        <CompactCoachBrief userId={userId} />
      </main>
    </div>
  );
}
