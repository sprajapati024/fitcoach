"use client";

import Link from "next/link";
import type { workouts } from "@/drizzle/schema";

type Workout = typeof workouts.$inferSelect;

interface WorkoutCalendarProps {
  workouts: Workout[];
  weeks: number;
  daysPerWeek: number;
  startDate: string;
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
  daysPerWeek,
  startDate,
}: WorkoutCalendarProps) {
  // Group workouts by week
  const workoutsByWeek: Workout[][] = [];
  for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
    const weekWorkouts = workouts.filter((w) => w.weekIndex === weekIndex);
    workoutsByWeek.push(weekWorkouts);
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {workoutsByWeek.map((weekWorkouts, weekIndex) => {
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

            {/* Week Grid */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const dayDate = getDateString(weekStartDate, dayIndex);
                const workout = weekWorkouts.find(
                  (w) => w.sessionDate === dayDate
                );
                const isToday = dayDate === today;
                const isPast = dayDate < today;

                return (
                  <div
                    key={dayIndex}
                    className={`
                      relative rounded-lg border p-2 min-h-[80px] flex flex-col
                      ${isToday ? "border-fg0 bg-bg1 ring-2 ring-fg0" : "border-line1 bg-bg0"}
                      ${workout ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
                    `}
                  >
                    {/* Day Label */}
                    <div className="text-xs text-fg2 font-medium mb-1">
                      {getDayOfWeek(dayDate)}
                    </div>
                    <div className={`text-xs ${isToday ? "text-fg0 font-bold" : "text-fg2"}`}>
                      {formatDateShort(dayDate)}
                    </div>

                    {/* Workout Info */}
                    {workout ? (
                      <Link
                        href={`/workout/${workout.id}`}
                        className="mt-2 flex-1 flex flex-col"
                      >
                        <div className="text-xs font-medium text-fg0 line-clamp-2 mb-1">
                          {workout.focus}
                        </div>
                        <div className="text-xs text-fg2 mt-auto">
                          {workout.durationMinutes} min
                        </div>

                        {/* Completion indicator */}
                        {isPast && (
                          <div className="absolute top-1 right-1">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                          </div>
                        )}
                      </Link>
                    ) : (
                      <div className="text-xs text-fg2 mt-2">Rest</div>
                    )}

                    {/* Today indicator */}
                    {isToday && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-fg0 rounded-full" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
