"use client";

import { Card } from "./Card";
import { cn } from "@/lib/utils";
import type { PlanCalendar } from "@/drizzle/schema";
import { Dumbbell, Zap } from "lucide-react";

interface PlanWeekGridProps {
  calendar: PlanCalendar;
  currentDayIndex?: number;
  onDayClick?: (dayIndex: number, workoutId: string) => void;
}

export function PlanWeekGrid({ calendar, currentDayIndex, onDayClick }: PlanWeekGridProps) {
  const { weeks } = calendar;

  return (
    <div className="space-y-6">
      {weeks.map((week) => {
        const isDeloadWeek = week.days.some((day) => day.isDeload);
        return (
          <div key={week.weekIndex} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>Week {week.weekIndex + 1}</span>
              {isDeloadWeek && (
                <span className="rounded border border-surface-border bg-surface-2 px-2 py-0.5 text-xs text-text-muted">
                  Deload
                </span>
              )}
            </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {week.days.map((day) => {
              const isToday = currentDayIndex === day.dayIndex;
              const isPast = currentDayIndex !== undefined && day.dayIndex < currentDayIndex;

              return (
                <Card
                  key={day.dayIndex}
                  className={cn(
                    "cursor-pointer transition-all hover:border-text-secondary hover:shadow-lg",
                    isToday && "border-text-primary bg-surface-2",
                    isPast && "opacity-60"
                  )}
                  onClick={() => onDayClick?.(day.dayIndex, day.workoutId)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs text-text-muted">Day {day.dayIndex + 1}</span>
                        {isToday && (
                          <span className="rounded bg-text-primary px-1.5 py-0.5 text-xs text-surface-0">
                            Today
                          </span>
                        )}
                      </div>
                      <div className="mb-2 text-sm font-medium">{day.focus}</div>
                      <div className="text-xs text-text-muted">
                        {day.isoDate || "Date set during activation"}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      {day.isDeload ? (
                        <Zap className="h-5 w-5 text-text-muted" />
                      ) : (
                        <Dumbbell className="h-5 w-5 text-text-secondary" />
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
        );
      })}
    </div>
  );
}

/**
 * Compact calendar view - shows all weeks at a glance
 */
export function PlanCalendarCompact({ calendar }: { calendar: PlanCalendar }) {
  const { weeks } = calendar;
  const totalDays = weeks.reduce((sum, week) => sum + week.days.length, 0);

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-fg2">
        {totalDays} training days over {weeks.length} weeks
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div key={i} className="text-fg2">
            {day}
          </div>
        ))}
      </div>

      {weeks.map((week) => {
        // Create 7-day grid for the week
        const weekGrid = Array(7).fill(null);

        week.days.forEach((day) => {
          if (!day.isoDate) {
            return;
          }

          const date = new Date(day.isoDate);
          if (Number.isNaN(date.getTime())) {
            return;
          }

          const dayOfWeek = date.getDay();
          weekGrid[dayOfWeek] = day;
        });

        const isDeloadWeek = week.days.some((day) => day.isDeload);

        return (
          <div key={week.weekIndex} className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-fg2">
              <span>W{week.weekIndex + 1}</span>
              {isDeloadWeek && <span className="text-xs">(Deload)</span>}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekGrid.map((day, i) => {
                if (!day) {
                  return (
                    <div
                      key={i}
                      className="aspect-square rounded border border-line1/30 bg-bg1/30"
                    />
                  );
                }

                return (
                  <div
                    key={day.dayIndex}
                    className={cn(
                      "aspect-square rounded border border-line1 bg-bg2 p-1",
                      day.isDeload && "border-line2 bg-bg1"
                    )}
                    title={`${day.focus} - ${day.isoDate}`}
                  >
                    <div className="flex h-full items-center justify-center">
                      {day.isDeload ? (
                        <Zap className="h-3 w-3 text-fg2" />
                      ) : (
                        <Dumbbell className="h-3 w-3 text-fg1" />
                      )}
                    </div>
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

/**
 * Calendar legend
 */
export function CalendarLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-fg2">
      <div className="flex items-center gap-2">
        <Dumbbell className="h-4 w-4" />
        <span>Training Day</span>
      </div>
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4" />
        <span>Deload Day</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded border border-fg0 bg-bg2" />
        <span>Today</span>
      </div>
    </div>
  );
}
