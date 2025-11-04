"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { workouts } from "@/drizzle/schema";

type Workout = typeof workouts.$inferSelect;

interface WorkoutCalendarProps {
  workouts: Workout[];
  weeks: number;
  startDate: string;
  logs?: WorkoutLogStatus[];
}

interface WorkoutLogStatus {
  workoutId: string;
  sessionDate: string | null;
  status: "completed" | "skipped";
}

function getDateString(startDate: string, daysOffset: number): string {
  const date = new Date(startDate);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split("T")[0];
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  return `${month} ${day}`;
}

function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function WorkoutCalendar({
  workouts,
  weeks,
  startDate,
  logs = [],
}: WorkoutCalendarProps) {
  const statusByWorkout = useMemo(() => {
    const map = new Map<string, WorkoutLogStatus["status"]>();
    logs.forEach((log) => {
      if (!map.has(log.workoutId)) {
        map.set(log.workoutId, log.status);
      }
    });
    return map;
  }, [logs]);

  // Group workouts by week - only show weeks that have workouts (adaptive planning)
  const workoutsByWeek: Workout[][] = [];
  const weekIndices = [...new Set(workouts.map(w => w.weekIndex))].sort((a, b) => a - b);

  for (const weekIndex of weekIndices) {
    const weekWorkouts = workouts.filter((w) => w.weekIndex === weekIndex);
    workoutsByWeek[weekIndex] = weekWorkouts;
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {weekIndices.map((weekIndex) => {
        const weekWorkouts = workoutsByWeek[weekIndex] || [];
        const weekStartDate = getDateString(startDate, weekIndex * 7);
        const isDeloadWeek = weekWorkouts.some((w) => w.isDeload);

        return (
          <div key={weekIndex} className="space-y-3">
            {/* Week Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-fg0">
                Week {weekIndex + 1}
              </h3>
              {isDeloadWeek && (
                <span className="text-xs font-medium text-fg2 bg-bg2 px-2 py-1 rounded">
                  Deload Week
                </span>
              )}
            </div>

            {/* Week Grid - Horizontal scroll on mobile, grid on desktop */}
            <div className="relative">
              {/* Scroll container for mobile */}
              <div className="scroll-smooth-mobile -mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
                <div className="grid min-w-max grid-cols-7 gap-2 md:min-w-0">
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const dayDate = getDateString(weekStartDate, dayIndex);

                    // Find workout for this day
                    // If sessionDate is set (plan activated), match by sessionDate
                    // If sessionDate is null (plan not activated), calculate expected date from workout's dayIndex
                    const workout = weekWorkouts.find((w) => {
                      if (w.sessionDate) {
                        // Plan is activated - use actual sessionDate
                        return w.sessionDate === dayDate;
                      } else {
                        // Plan not activated - calculate expected date from dayIndex
                        const expectedDate = getDateString(startDate, w.dayIndex);
                        return expectedDate === dayDate;
                      }
                    });

                    const isToday = dayDate === today;
                    const status = workout ? statusByWorkout.get(workout.id) : undefined;

                    return (
                      <div
                        key={dayIndex}
                        className={`
                          scroll-snap-item relative flex min-h-[100px] w-[120px] flex-col rounded-lg border p-3 transition-all md:min-h-[80px] md:w-auto
                          ${isToday ? "border-accent bg-bg1 shadow-md" : "border-line1 bg-bg0"}
                          ${workout ? "touch-feedback cursor-pointer hover:border-accent hover:shadow-md" : ""}
                        `}
                      >
                        {/* Day Label */}
                        <div className="mb-1 text-xs font-medium text-fg2">
                          {getDayOfWeek(dayDate)}
                        </div>
                        <div className={`text-xs ${isToday ? "font-bold text-accent" : "text-fg2"}`}>
                          {formatDateShort(dayDate)}
                        </div>

                        {/* Workout Info */}
                        {workout ? (
                          <Link
                            href={`/workout/${workout.id}`}
                            className="mt-2 flex flex-1 flex-col"
                          >
                            <div className="mb-1 line-clamp-2 text-xs font-medium text-fg0">
                              {workout.focus}
                            </div>
                            <div className="mt-auto text-xs text-fg2">
                              {workout.durationMinutes} min
                            </div>

                            {status ? (
                              <div className="absolute right-1 top-1">
                                <div
                                  className={`h-2 w-2 rounded-full ${
                                    status === "completed" ? "bg-success-light" : "bg-warning-light"
                                  }`}
                                />
                              </div>
                            ) : null}

                            {status ? (
                              <span
                                className={`mt-1 text-[10px] font-semibold uppercase tracking-wide ${
                                  status === "completed" ? "text-green-300" : "text-amber-300"
                                }`}
                              >
                                {status === "completed" ? "Completed" : "Skipped"}
                              </span>
                            ) : null}
                          </Link>
                        ) : (
                          <div className="mt-2 text-xs text-fg2">Rest</div>
                        )}

                        {/* Today indicator - neon accent */}
                        {isToday && (
                          <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[var(--neon-primary)] shadow-[0_0_6px_var(--neon-glow)]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scroll fade indicators for mobile */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-bg-0 to-transparent md:hidden" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-bg-0 to-transparent md:hidden" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
