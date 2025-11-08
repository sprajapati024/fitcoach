'use client';

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
  hasActivePlan: boolean;
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

export function TodayView({ workout, userId, userName, nutrition, hasActivePlan }: TodayViewProps) {
  const greeting = getTimeBasedGreeting();
  const displayName = userName || 'there';

  return (
    <div className="min-h-screen bg-black -mx-4 -mt-6 -mb-32">
      {/* Main Content - Phone App Style */}
      <main className="mx-auto max-w-md px-3 pt-4 pb-20 space-y-3">
        {/* Greeting */}
        <div className="space-y-1.5">
          <h1 className="text-sm font-medium text-gray-400">
            {greeting}, {displayName}
          </h1>
        </div>

        {/* Coach Brief - Prominent Position */}
        <CompactCoachBrief userId={userId} hasActivePlan={hasActivePlan} />

        {/* Hero Card (Workout or Rest Day) */}
        <CompactHeroCard workout={workout} hasActivePlan={hasActivePlan} />

        {/* Compact Nutrition */}
        <CompactNutrition nutrition={nutrition} />

        {/* Quick Actions */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Quick Actions</h2>
          <QuickActions />
        </div>
      </main>
    </div>
  );
}
