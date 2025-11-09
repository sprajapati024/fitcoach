'use client';

import { useMemo, useState } from 'react';
import { CompactWeekDayCard } from './CompactWeekDayCard';
import { CompactWeekNav } from './CompactWeekNav';
import type { workouts } from '@/drizzle/schema';
import { motion, AnimatePresence } from 'framer-motion';

type Workout = typeof workouts.$inferSelect;

interface CompactWeekViewProps {
  workouts: Workout[];
  weeks: number;
  startDate: string;
  logs?: WorkoutLogStatus[];
}

interface WorkoutLogStatus {
  workoutId: string;
  sessionDate: string | null;
  status: 'completed' | 'skipped';
}

interface DayData {
  date: string;
  dayOfWeek: string;
  dayNumber: number;
  workout: Workout | null;
  isToday: boolean;
  status?: 'completed' | 'skipped';
}

function getDateString(startDate: string, daysOffset: number): string {
  const date = new Date(startDate);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function CompactWeekView({ workouts, weeks, startDate, logs = [] }: CompactWeekViewProps) {
  const statusByWorkout = useMemo(() => {
    const map = new Map<string, WorkoutLogStatus['status']>();
    logs.forEach((log) => {
      if (!map.has(log.workoutId)) {
        map.set(log.workoutId, log.status);
      }
    });
    return map;
  }, [logs]);

  const today = new Date().toISOString().split('T')[0];

  // Prepare week data
  const weekData = useMemo(() => {
    const weekIndices = [...new Set(workouts.map((w) => w.weekIndex))].sort((a, b) => a - b);

    return weekIndices.map((weekIndex) => {
      const weekWorkouts = workouts.filter((w) => w.weekIndex === weekIndex);
      const weekStartDate = getDateString(startDate, weekIndex * 7);
      const isDeloadWeek = weekWorkouts.some((w) => w.isDeload);

      // Create day data for all 7 days of the week
      const days: DayData[] = Array.from({ length: 7 }).map((_, dayIndex) => {
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
          date: dayDate,
          dayOfWeek: getDayOfWeek(dayDate),
          dayNumber: new Date(dayDate).getDate(),
          workout: workout || null,
          isToday,
          status,
        };
      });

      return {
        weekIndex,
        weekNumber: weekIndex + 1,
        weekStartDate,
        isDeloadWeek,
        workouts: weekWorkouts,
        days,
      };
    });
  }, [workouts, startDate, statusByWorkout, today]);

  // Find current week index (week containing today)
  const currentWeekIndex = useMemo(() => {
    const index = weekData.findIndex((week) => week.days.some((day) => day.isToday));
    return index >= 0 ? index : 0;
  }, [weekData]);

  const [selectedWeek, setSelectedWeek] = useState(currentWeekIndex);

  const handlePrevious = () => {
    setSelectedWeek((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setSelectedWeek((prev) => Math.min(weekData.length - 1, prev + 1));
  };

  const currentWeek = weekData[selectedWeek];

  if (!currentWeek) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
        No weeks to display
      </div>
    );
  }

  const completedCount = currentWeek.days.filter((d) => d.status === 'completed').length;
  const workoutCount = currentWeek.workouts.length;

  return (
    <div className="space-y-3">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <CompactWeekNav
          currentWeek={selectedWeek}
          totalWeeks={weekData.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onWeekSelect={setSelectedWeek}
        />

        {/* Week Stats */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">{completedCount}/{workoutCount} completed</span>
        </div>
      </div>

      {/* Deload badge if applicable */}
      {currentWeek.isDeloadWeek && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1"
        >
          <span className="text-xs font-semibold text-yellow-500">Deload Week</span>
        </motion.div>
      )}

      {/* Vertical Day List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedWeek}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {currentWeek.days.map((day, index) => (
            <CompactWeekDayCard
              key={day.date}
              date={day.date}
              dayOfWeek={day.dayOfWeek}
              dayNumber={day.dayNumber}
              workout={day.workout}
              isToday={day.isToday}
              status={day.status}
              delay={index * 0.03}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
