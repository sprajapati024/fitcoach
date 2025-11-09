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
  nutrition: Awaited<ReturnType<typeof import('@/app/actions/nutrition').getTodayNutrition>>;
  hasActivePlan: boolean;
}

export function TodayView({ workout, userId, nutrition, hasActivePlan }: TodayViewProps) {
  return (
    <div className="min-h-screen bg-black -mx-4 -mt-6 -mb-32">
      {/* Main Content - Phone App Style */}
      <main className="mx-auto max-w-md px-3 pt-4 pb-20 space-y-3">
        {/* Coach Brief - Prominent Position */}
        <CompactCoachBrief userId={userId} hasActivePlan={hasActivePlan} />

        {/* Hero Card (Workout or Rest Day) */}
        <CompactHeroCard workout={workout} hasActivePlan={hasActivePlan} />

        {/* Compact Nutrition - Extra margin for better spacing */}
        <div className="mt-5">
          <CompactNutrition nutrition={nutrition} />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Quick Actions</h2>
          <QuickActions />
        </div>
      </main>
    </div>
  );
}
