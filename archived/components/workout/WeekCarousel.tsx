'use client';

import { useState, useRef, useEffect, TouchEvent } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { workouts } from '@/drizzle/schema';

type Workout = typeof workouts.$inferSelect;

interface WorkoutLogStatus {
  workoutId: string;
  sessionDate: string | null;
  status: 'completed' | 'skipped';
}

interface WeekData {
  weekIndex: number;
  weekStartDate: string;
  isDeloadWeek: boolean;
  workouts: Workout[];
  days: DayData[];
}

interface DayData {
  dayIndex: number;
  date: string;
  dayOfWeek: string;
  dateShort: string;
  workout: Workout | null;
  isToday: boolean;
  status?: 'completed' | 'skipped';
}

interface WeekCarouselProps {
  weeks: WeekData[];
  currentWeekIndex: number;
  onWeekChange?: (weekIndex: number) => void;
}

export function WeekCarousel({ weeks, currentWeekIndex, onWeekChange }: WeekCarouselProps) {
  const [activeWeek, setActiveWeek] = useState(currentWeekIndex);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveWeek(currentWeekIndex);
  }, [currentWeekIndex]);

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && activeWeek < weeks.length - 1) {
      goToWeek(activeWeek + 1);
    }
    if (isRightSwipe && activeWeek > 0) {
      goToWeek(activeWeek - 1);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const goToWeek = (weekIndex: number) => {
    setActiveWeek(weekIndex);
    onWeekChange?.(weekIndex);
  };

  const currentWeek = weeks[activeWeek];

  if (!currentWeek) return null;

  return (
    <div className="relative">
      {/* Week Header with Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-text-primary">
            Week {currentWeek.weekIndex + 1}
          </h3>
          {currentWeek.isDeloadWeek && (
            <span className="rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-medium text-warning-light">
              Deload Week
            </span>
          )}
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToWeek(activeWeek - 1)}
            disabled={activeWeek === 0}
            className={cn(
              'touch-feedback flex h-8 w-8 items-center justify-center rounded-full transition-all',
              activeWeek === 0
                ? 'cursor-not-allowed opacity-30'
                : 'bg-surface-2 hover:bg-surface-border active:scale-95'
            )}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4 text-text-primary" />
          </button>

          <div className="text-xs text-text-muted">
            {activeWeek + 1} / {weeks.length}
          </div>

          <button
            onClick={() => goToWeek(activeWeek + 1)}
            disabled={activeWeek === weeks.length - 1}
            className={cn(
              'touch-feedback flex h-8 w-8 items-center justify-center rounded-full transition-all',
              activeWeek === weeks.length - 1
                ? 'cursor-not-allowed opacity-30'
                : 'bg-surface-2 hover:bg-surface-border active:scale-95'
            )}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4 text-text-primary" />
          </button>
        </div>
      </div>

      {/* Swipeable Week Container */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="overflow-hidden rounded-xl"
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeWeek * 100}%)` }}
        >
          {weeks.map((week, weekIdx) => (
            <div
              key={week.weekIndex}
              className="w-full flex-shrink-0"
              aria-hidden={weekIdx !== activeWeek}
            >
              <WeekView week={week} isActive={weekIdx === activeWeek} />
            </div>
          ))}
        </div>
      </div>

      {/* Week Indicator Dots */}
      {weeks.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {weeks.map((week, idx) => (
            <button
              key={week.weekIndex}
              onClick={() => goToWeek(idx)}
              className={cn(
                'h-2 rounded-full transition-all',
                idx === activeWeek
                  ? 'w-8 bg-accent'
                  : 'w-2 bg-surface-border hover:bg-text-muted'
              )}
              aria-label={`Go to week ${week.weekIndex + 1}`}
            />
          ))}
        </div>
      )}

      {/* Swipe Hint (only show for first few interactions) */}
      {activeWeek === 0 && weeks.length > 1 && (
        <div className="mt-3 text-center text-xs text-text-muted animate-fade-in">
          👆 Swipe or tap arrows to navigate weeks
        </div>
      )}
    </div>
  );
}

function WeekView({ week, isActive }: { week: WeekData; isActive: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-1 sm:grid-cols-3 md:grid-cols-4">
      {week.days.map((day) => (
        <DayCard key={day.dayIndex} day={day} isActive={isActive} />
      ))}
    </div>
  );
}

function DayCard({ day, isActive }: { day: DayData; isActive: boolean }) {
  const hasWorkout = !!day.workout;

  const cardContent = (
    <div
      className={cn(
        'relative flex min-h-[120px] flex-col rounded-lg border p-3 transition-all',
        day.isToday
          ? 'border-accent bg-accent/5 shadow-md shadow-accent/10'
          : 'border-surface-border bg-surface-1',
        hasWorkout && 'hover:border-accent/50 hover:shadow-lg cursor-pointer',
        !isActive && 'opacity-50'
      )}
    >
      {/* Today Indicator */}
      {day.isToday && (
        <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-accent shadow-[0_0_8px_var(--accent-primary)]" />
      )}

      {/* Day Label */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-text-muted">
            {day.dayOfWeek}
          </div>
          <div
            className={cn(
              'text-sm font-semibold',
              day.isToday ? 'text-accent' : 'text-text-primary'
            )}
          >
            {day.dateShort}
          </div>
        </div>

        {/* Status Badge */}
        {day.status && (
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              day.status === 'completed' ? 'bg-success-light' : 'bg-warning-light'
            )}
          />
        )}
      </div>

      {/* Workout Info */}
      {hasWorkout ? (
        <div className="flex flex-1 flex-col">
          <div className="mb-2 line-clamp-2 text-sm font-medium text-text-primary">
            {day.workout!.focus}
          </div>
          <div className="mt-auto text-xs text-text-muted">
            {day.workout!.durationMinutes} min
          </div>

          {day.status && (
            <div
              className={cn(
                'mt-2 text-xs font-semibold',
                day.status === 'completed' ? 'text-success-light' : 'text-warning-light'
              )}
            >
              {day.status === 'completed' ? '✓ Completed' : '⊘ Skipped'}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-xs text-text-muted">
          Rest Day
        </div>
      )}
    </div>
  );

  if (hasWorkout) {
    return (
      <Link href={`/workout/${day.workout!.id}`} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
