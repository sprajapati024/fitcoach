'use client';

import Link from 'next/link';
import { CoachBrief } from './CoachBrief';
import type { workouts, WorkoutPayload } from '@/drizzle/schema';
import { Dumbbell, Clock, Zap, ChevronRight } from 'lucide-react';

type Workout = typeof workouts.$inferSelect;

interface TodayViewProps {
  workout: Workout | null;
  userId: string;
  userName?: string | null;
  nutrition: Awaited<ReturnType<typeof import('@/app/actions/nutrition').getTodayNutrition>>;
}

export function TodayView({ workout, userId, userName, nutrition }: TodayViewProps) {

  if (!workout) {
    return (
      <div className="mx-auto w-full max-w-4xl p-4 pb-24">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Coach Brief - 3 columns on desktop */}
          <div className="md:col-span-3">
            <CoachBrief userId={userId} userName={userName} />
          </div>

          {/* Nutrition Card with Horizontal Bars - 1 column on desktop */}
          {nutrition && (
            <Link
              href="/nutrition"
              className="group rounded-xl border border-surface-border bg-gradient-to-br from-indigo-500/5 to-surface-1 p-4 transition-all hover:border-indigo-500/50 hover:shadow-lg active:scale-[0.98]"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-primary">Today&apos;s Nutrition</h3>
                  <ChevronRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1" />
                </div>

                {/* Calories */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text-secondary">Calories</span>
                    <span className="font-semibold text-text-primary">
                      {nutrition.summary?.totalCalories || 0} / {nutrition.goals?.targetCalories || 2000}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-0">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
                      style={{ width: `${Math.min(((nutrition.summary?.totalCalories || 0) / (nutrition.goals?.targetCalories || 2000)) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="text-right text-[10px] font-semibold text-indigo-500">
                    {Math.round(Math.min(((nutrition.summary?.totalCalories || 0) / (nutrition.goals?.targetCalories || 2000)) * 100, 100))}%
                  </div>
                </div>

                {/* Protein */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text-secondary">Protein</span>
                    <span className="font-semibold text-text-primary">
                      {parseFloat(nutrition.summary?.totalProtein || '0')}g / {parseFloat(nutrition.goals?.targetProteinGrams || '150')}g
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-0">
                      <div
                        className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                        style={{ width: `${Math.min((parseFloat(nutrition.summary?.totalProtein || '0') / parseFloat(nutrition.goals?.targetProteinGrams || '150')) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-cyan-500">
                      {Math.round(Math.min((parseFloat(nutrition.summary?.totalProtein || '0') / parseFloat(nutrition.goals?.targetProteinGrams || '150')) * 100, 100))}%
                    </span>
                  </div>
                </div>

                {/* Carbs */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text-secondary">Carbs</span>
                    <span className="font-semibold text-text-primary">
                      {parseFloat(nutrition.summary?.totalCarbs || '0')}g / {parseFloat(nutrition.goals?.targetCarbsGrams || '200')}g
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-0">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.min((parseFloat(nutrition.summary?.totalCarbs || '0') / parseFloat(nutrition.goals?.targetCarbsGrams || '200')) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-indigo-500">
                      {Math.round(Math.min((parseFloat(nutrition.summary?.totalCarbs || '0') / parseFloat(nutrition.goals?.targetCarbsGrams || '200')) * 100, 100))}%
                    </span>
                  </div>
                </div>

                {/* Fat */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text-secondary">Fat</span>
                    <span className="font-semibold text-text-primary">
                      {parseFloat(nutrition.summary?.totalFat || '0')}g / {parseFloat(nutrition.goals?.targetFatGrams || '65')}g
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-0">
                      <div
                        className="h-full rounded-full bg-purple-500 transition-all duration-500"
                        style={{ width: `${Math.min((parseFloat(nutrition.summary?.totalFat || '0') / parseFloat(nutrition.goals?.targetFatGrams || '65')) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-purple-500">
                      {Math.round(Math.min((parseFloat(nutrition.summary?.totalFat || '0') / parseFloat(nutrition.goals?.targetFatGrams || '65')) * 100, 100))}%
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Rest Day Card - Full width */}
          <div className="rounded-xl border border-surface-border bg-surface-1 p-4 text-center md:col-span-4">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20">
              <Zap className="h-8 w-8 text-cyan-500" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-text-primary">Rest Day</h3>
            <p className="text-xs text-text-muted">Recovery is progress</p>
          </div>
        </div>
      </div>
    );
  }

  const workoutPayload = workout.payload as WorkoutPayload;
  const workoutType = workoutPayload.focus || workout.title || 'Workout';
  const totalExercises = workoutPayload.blocks?.reduce(
    (sum, block) => sum + (block.exercises?.length ?? 0),
    0
  ) ?? 0;

  return (
    <div className="mx-auto w-full max-w-4xl p-4 pb-24">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Coach Brief - 3 columns on desktop */}
        <div className="md:col-span-3">
          <CoachBrief userId={userId} userName={userName} />
        </div>

        {/* Nutrition Card with Horizontal Bars - 1 column on desktop */}
        {nutrition && (
          <Link
            href="/nutrition"
            className="group rounded-xl border border-surface-border bg-gradient-to-br from-indigo-500/5 to-surface-1 p-4 transition-all hover:border-indigo-500/50 hover:shadow-lg active:scale-[0.98]"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">Today&apos;s Nutrition</h3>
                <ChevronRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1" />
              </div>

              {/* Calories */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-text-secondary">Calories</span>
                  <span className="font-semibold text-text-primary">
                    {nutrition.summary?.totalCalories || 0} / {nutrition.goals?.targetCalories || 2000}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-0">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
                    style={{ width: `${Math.min(((nutrition.summary?.totalCalories || 0) / (nutrition.goals?.targetCalories || 2000)) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-right text-[10px] font-semibold text-indigo-500">
                  {Math.round(Math.min(((nutrition.summary?.totalCalories || 0) / (nutrition.goals?.targetCalories || 2000)) * 100, 100))}%
                </div>
              </div>

              {/* Protein */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-text-secondary">Protein</span>
                  <span className="font-semibold text-text-primary">
                    {parseFloat(nutrition.summary?.totalProtein || '0')}g / {parseFloat(nutrition.goals?.targetProteinGrams || '150')}g
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-0">
                    <div
                      className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                      style={{ width: `${Math.min((parseFloat(nutrition.summary?.totalProtein || '0') / parseFloat(nutrition.goals?.targetProteinGrams || '150')) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-cyan-500">
                    {Math.round(Math.min((parseFloat(nutrition.summary?.totalProtein || '0') / parseFloat(nutrition.goals?.targetProteinGrams || '150')) * 100, 100))}%
                  </span>
                </div>
              </div>

              {/* Carbs */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-text-secondary">Carbs</span>
                  <span className="font-semibold text-text-primary">
                    {parseFloat(nutrition.summary?.totalCarbs || '0')}g / {parseFloat(nutrition.goals?.targetCarbsGrams || '200')}g
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-0">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${Math.min((parseFloat(nutrition.summary?.totalCarbs || '0') / parseFloat(nutrition.goals?.targetCarbsGrams || '200')) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-500">
                    {Math.round(Math.min((parseFloat(nutrition.summary?.totalCarbs || '0') / parseFloat(nutrition.goals?.targetCarbsGrams || '200')) * 100, 100))}%
                  </span>
                </div>
              </div>

              {/* Fat */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-text-secondary">Fat</span>
                  <span className="font-semibold text-text-primary">
                    {parseFloat(nutrition.summary?.totalFat || '0')}g / {parseFloat(nutrition.goals?.targetFatGrams || '65')}g
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-0">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all duration-500"
                      style={{ width: `${Math.min((parseFloat(nutrition.summary?.totalFat || '0') / parseFloat(nutrition.goals?.targetFatGrams || '65')) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-purple-500">
                    {Math.round(Math.min((parseFloat(nutrition.summary?.totalFat || '0') / parseFloat(nutrition.goals?.targetFatGrams || '65')) * 100, 100))}%
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Workout Card - Full width */}
        <Link
          href={`/workout/${workout.id}`}
          className="group relative block overflow-hidden rounded-xl border border-surface-border bg-gradient-to-br from-cyan-500/5 to-indigo-600/5 p-5 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-lg active:scale-[0.98] md:col-span-4"
        >
          <div className="relative">
            {/* Workout type badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5">
              <Dumbbell className="h-4 w-4 text-cyan-500" />
              <span className="text-xs font-semibold text-cyan-500">Today&apos;s Workout</span>
            </div>

            {/* Workout title */}
            <h2 className="mb-3 text-2xl font-bold text-text-primary">
              {workoutType}
            </h2>

            {/* Workout stats */}
            <div className="mb-3 flex flex-wrap items-center gap-4 text-text-muted">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">{workout.durationMinutes || 60} min</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">{totalExercises} exercises</span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-2 text-cyan-500 transition-transform group-hover:translate-x-2">
              <span className="text-sm font-semibold">View Details</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
