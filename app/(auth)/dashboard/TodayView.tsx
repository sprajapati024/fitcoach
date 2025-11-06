'use client';

import Link from 'next/link';
import { CoachBrief } from './CoachBrief';
import { MacroRings } from './MacroRings';
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

          {/* Rest Day Card - 1 column on desktop */}
          <div className="rounded-xl border border-surface-border bg-surface-1 p-4 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20">
              <Zap className="h-8 w-8 text-cyan-500" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-text-primary">Rest Day</h3>
            <p className="text-xs text-text-muted">Recovery is progress</p>
          </div>

          {/* Macro Rings - Full width */}
          {nutrition && (
            <div className="md:col-span-4">
              <MacroRings
                protein={parseFloat(nutrition.summary?.totalProtein || '0')}
                carbs={parseFloat(nutrition.summary?.totalCarbs || '0')}
                fat={parseFloat(nutrition.summary?.totalFat || '0')}
                totalCalories={nutrition.summary?.totalCalories || 0}
                proteinGoal={parseFloat(nutrition.goals?.targetProteinGrams || '150')}
                carbsGoal={parseFloat(nutrition.goals?.targetCarbsGrams || '200')}
                fatGoal={parseFloat(nutrition.goals?.targetFatGrams || '65')}
                caloriesGoal={nutrition.goals?.targetCalories || 2000}
              />
            </div>
          )}
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

        {/* Calories Quick Stat - 1 column on desktop */}
        {nutrition && (
          <Link
            href="/nutrition"
            className="group rounded-xl border border-surface-border bg-gradient-to-br from-indigo-500/5 to-surface-1 p-4 transition-all hover:border-indigo-500/50 hover:shadow-lg active:scale-[0.98]"
          >
            <div className="text-center">
              <div className="relative mx-auto mb-3 h-16 w-16">
                <svg className="h-full w-full -rotate-90 transform">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="5"
                    fill="none"
                    className="text-surface-0"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="5"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - Math.min((nutrition.summary?.totalCalories || 0) / (nutrition.goals?.targetCalories || 2000), 1))}`}
                    className="text-indigo-500 transition-all duration-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-text-primary">
                    {Math.round(Math.min(((nutrition.summary?.totalCalories || 0) / (nutrition.goals?.targetCalories || 2000)) * 100, 100))}%
                  </span>
                </div>
              </div>
              <p className="mb-1 text-sm font-semibold text-text-primary">
                {nutrition.summary?.totalCalories || 0}
              </p>
              <p className="mb-1 text-xs text-text-muted">of {nutrition.goals?.targetCalories || 2000} cal</p>
              <p className="text-xs text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100">View →</p>
            </div>
          </Link>
        )}

        {/* Macro Cards - 3 small cards */}
        {nutrition && (
          <>
            {/* Protein */}
            <Link
              href="/nutrition"
              className="group rounded-xl border border-surface-border bg-surface-1 p-4 transition-all hover:border-cyan-500/50 hover:shadow-lg active:scale-[0.98]"
            >
              <div className="text-center">
                <div className="relative mx-auto mb-2 h-12 w-12">
                  <svg className="h-full w-full -rotate-90 transform">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-surface-0" />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - Math.min((parseFloat(nutrition.summary?.totalProtein || '0') / parseFloat(nutrition.goals?.targetProteinGrams || '150')), 1))}`}
                      className="text-cyan-500 transition-all duration-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-text-primary">
                      {Math.round(Math.min((parseFloat(nutrition.summary?.totalProtein || '0') / parseFloat(nutrition.goals?.targetProteinGrams || '150')) * 100, 100))}%
                    </span>
                  </div>
                </div>
                <p className="mb-1 text-sm font-semibold text-text-primary">{parseFloat(nutrition.summary?.totalProtein || '0')}g</p>
                <p className="text-xs text-text-muted">Protein</p>
              </div>
            </Link>

            {/* Carbs */}
            <Link
              href="/nutrition"
              className="group rounded-xl border border-surface-border bg-surface-1 p-4 transition-all hover:border-indigo-500/50 hover:shadow-lg active:scale-[0.98]"
            >
              <div className="text-center">
                <div className="relative mx-auto mb-2 h-12 w-12">
                  <svg className="h-full w-full -rotate-90 transform">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-surface-0" />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - Math.min((parseFloat(nutrition.summary?.totalCarbs || '0') / parseFloat(nutrition.goals?.targetCarbsGrams || '200')), 1))}`}
                      className="text-indigo-500 transition-all duration-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-text-primary">
                      {Math.round(Math.min((parseFloat(nutrition.summary?.totalCarbs || '0') / parseFloat(nutrition.goals?.targetCarbsGrams || '200')) * 100, 100))}%
                    </span>
                  </div>
                </div>
                <p className="mb-1 text-sm font-semibold text-text-primary">{parseFloat(nutrition.summary?.totalCarbs || '0')}g</p>
                <p className="text-xs text-text-muted">Carbs</p>
              </div>
            </Link>

            {/* Fat */}
            <Link
              href="/nutrition"
              className="group rounded-xl border border-surface-border bg-surface-1 p-4 transition-all hover:border-purple-500/50 hover:shadow-lg active:scale-[0.98]"
            >
              <div className="text-center">
                <div className="relative mx-auto mb-2 h-12 w-12">
                  <svg className="h-full w-full -rotate-90 transform">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-surface-0" />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - Math.min((parseFloat(nutrition.summary?.totalFat || '0') / parseFloat(nutrition.goals?.targetFatGrams || '65')), 1))}`}
                      className="text-purple-500 transition-all duration-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-text-primary">
                      {Math.round(Math.min((parseFloat(nutrition.summary?.totalFat || '0') / parseFloat(nutrition.goals?.targetFatGrams || '65')) * 100, 100))}%
                    </span>
                  </div>
                </div>
                <p className="mb-1 text-sm font-semibold text-text-primary">{parseFloat(nutrition.summary?.totalFat || '0')}g</p>
                <p className="text-xs text-text-muted">Fat</p>
              </div>
            </Link>
          </>
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
