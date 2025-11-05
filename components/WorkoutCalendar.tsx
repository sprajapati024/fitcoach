"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { WeekCarousel } from './WeekCarousel';
import { cn } from '@/lib/utils';
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

  const today = new Date().toISOString().split("T")[0];

  // Prepare week data for carousel
  const weekData = useMemo(() => {
    const weekIndices = [...new Set(workouts.map(w => w.weekIndex))].sort((a, b) => a - b);

    return weekIndices.map((weekIndex) => {
      const weekWorkouts = workouts.filter((w) => w.weekIndex === weekIndex);
      const weekStartDate = getDateString(startDate, weekIndex * 7);
      const isDeloadWeek = weekWorkouts.some((w) => w.isDeload);

      // Create day data for all 7 days of the week
      const days = Array.from({ length: 7 }).map((_, dayIndex) => {
        const dayDate = getDateString(weekStartDate, dayIndex);

        const workout = weekWorkouts.find((w) => {
          if (w.sessionDate) {
            return w.sessionDate === dayDate;
          } else {
            const expectedDate = getDateString(startDate, w.dayIndex);
            return expectedDate === dayDate;
          }
        });

        const isToday = dayDate === today;
        const status = workout ? statusByWorkout.get(workout.id) : undefined;

        return {
          dayIndex: weekIndex * 7 + dayIndex,
          date: dayDate,
          dayOfWeek: getDayOfWeek(dayDate),
          dateShort: formatDateShort(dayDate),
          workout: workout || null,
          isToday,
          status,
        };
      });

      return {
        weekIndex,
        weekStartDate,
        isDeloadWeek,
        workouts: weekWorkouts,
        days,
      };
    });
  }, [workouts, startDate, statusByWorkout, today]);

  // Find current week index (week containing today)
  const currentWeekIndex = useMemo(() => {
    const index = weekData.findIndex(week =>
      week.days.some(day => day.isToday)
    );
    return index >= 0 ? index : 0;
  }, [weekData]);

  const [selectedWeek, setSelectedWeek] = useState(currentWeekIndex);

  return (
    <div>
      {/* Mobile: Week Carousel */}
      <div className="md:hidden">
        <WeekCarousel
          weeks={weekData}
          currentWeekIndex={currentWeekIndex}
          onWeekChange={setSelectedWeek}
        />
      </div>

      {/* Desktop: Enhanced Horizontal Scroll with All Weeks */}
      <div className="hidden md:block">
        <DesktopWeekView
          weekData={weekData}
          statusByWorkout={statusByWorkout}
          startDate={startDate}
          today={today}
        />
      </div>
    </div>
  );
}

// Desktop Week View Component (Enhanced)
function DesktopWeekView({
  weekData,
  statusByWorkout,
  startDate,
  today,
}: {
  weekData: any[];
  statusByWorkout: Map<string, WorkoutLogStatus["status"]>;
  startDate: string;
  today: string;
}) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([0]));

  const toggleWeek = (weekIndex: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekIndex)) {
      newExpanded.delete(weekIndex);
    } else {
      newExpanded.add(weekIndex);
    }
    setExpandedWeeks(newExpanded);
  };

  const expandAll = () => {
    setExpandedWeeks(new Set(weekData.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedWeeks(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-text-muted">
          {weekData.length} weeks total
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-xs text-accent hover:text-accent-light transition-colors"
          >
            Expand All
          </button>
          <span className="text-text-muted">•</span>
          <button
            onClick={collapseAll}
            className="text-xs text-accent hover:text-accent-light transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Week Accordion */}
      <div className="space-y-3">
        {weekData.map((week) => {
          const isExpanded = expandedWeeks.has(week.weekIndex);
          const hasToday = week.days.some((day: any) => day.isToday);

          return (
            <div
              key={week.weekIndex}
              className={cn(
                "rounded-lg border transition-all",
                hasToday ? "border-accent/30 bg-accent/5" : "border-surface-border bg-surface-1"
              )}
            >
              {/* Week Header - Clickable */}
              <button
                onClick={() => toggleWeek(week.weekIndex)}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "text-2xl transition-transform",
                    isExpanded ? "rotate-90" : ""
                  )}>
                    ▶
                  </div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-text-primary">
                      Week {week.weekIndex + 1}
                    </h3>
                    {week.isDeloadWeek && (
                      <span className="rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-medium text-warning-light">
                        Deload
                      </span>
                    )}
                    {hasToday && (
                      <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                        Current Week
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-sm text-text-muted">
                  {week.workouts.length} workouts
                </div>
              </button>

              {/* Week Content - Collapsible */}
              {isExpanded && (
                <div className="px-4 pb-4 animate-fade-in">
                  <div className="grid grid-cols-7 gap-3">
                    {week.days.map((day: any) => (
                      <DesktopDayCard key={day.dayIndex} day={day} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DesktopDayCard({ day }: { day: any }) {
  const hasWorkout = !!day.workout;

  const cardContent = (
    <div
      className={`
        relative flex min-h-[100px] flex-col rounded-lg border p-3 transition-all
        ${day.isToday ? "border-accent bg-accent/5 shadow-md" : "border-surface-border bg-surface-1"}
        ${hasWorkout ? "hover:border-accent/50 hover:shadow-lg cursor-pointer" : ""}
      `}
    >
      {/* Today Indicator */}
      {day.isToday && (
        <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-accent shadow-[0_0_8px_var(--accent-primary)]" />
      )}

      {/* Day Label */}
      <div className="mb-2">
        <div className="text-xs font-medium text-text-muted">
          {day.dayOfWeek}
        </div>
        <div className={`text-sm font-semibold ${day.isToday ? "text-accent" : "text-text-primary"}`}>
          {day.dateShort}
        </div>
      </div>

      {/* Workout Info */}
      {hasWorkout ? (
        <div className="flex flex-1 flex-col">
          <div className="mb-1 line-clamp-2 text-xs font-medium text-text-primary">
            {day.workout.focus}
          </div>
          <div className="mt-auto text-xs text-text-muted">
            {day.workout.durationMinutes} min
          </div>

          {day.status && (
            <div className="absolute right-2 top-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  day.status === "completed" ? "bg-success-light" : "bg-warning-light"
                }`}
              />
            </div>
          )}

          {day.status && (
            <div
              className={`mt-2 text-xs font-semibold ${
                day.status === "completed" ? "text-success-light" : "text-warning-light"
              }`}
            >
              {day.status === "completed" ? "✓ Done" : "⊘ Skipped"}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-xs text-text-muted">
          Rest
        </div>
      )}
    </div>
  );

  if (hasWorkout) {
    return (
      <Link href={`/workout/${day.workout.id}`}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
