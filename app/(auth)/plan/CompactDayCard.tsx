'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { workouts } from '@/drizzle/schema';

type Workout = typeof workouts.$inferSelect;

interface CompactDayCardProps {
  date: string;
  dayOfWeek: string;
  dayNumber: number;
  workout: Workout | null;
  isToday: boolean;
  status?: 'completed' | 'skipped';
  delay?: number;
}

function getWorkoutLabel(focus: string): string {
  const lower = focus.toLowerCase();
  if (lower.includes('push') || lower.includes('chest') || lower.includes('shoulder')) return 'PUSH';
  if (lower.includes('pull') || lower.includes('back')) return 'PULL';
  if (lower.includes('leg') || lower.includes('squat')) return 'LEGS';
  if (lower.includes('cardio') || lower.includes('run')) return 'CARDIO';
  if (lower.includes('upper')) return 'UPPER';
  if (lower.includes('full') || lower.includes('total')) return 'FULL';
  return 'WORKOUT';
}

export function CompactDayCard({
  date,
  dayOfWeek,
  dayNumber,
  workout,
  isToday,
  status,
  delay = 0,
}: CompactDayCardProps) {
  const hasWorkout = !!workout;

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay }}
      className={`
        relative flex flex-col items-center justify-center
        min-h-[64px] rounded-lg border p-2
        transition-all
        ${isToday
          ? 'border-transparent bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 shadow-lg'
          : 'border-gray-800 bg-gray-900'
        }
        ${hasWorkout ? 'hover:border-cyan-500/30 active:scale-95 cursor-pointer' : ''}
      `}
    >
      {/* Today pulse indicator */}
      {isToday && (
        <div className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-cyan-500 shadow-[0_0_6px_theme(colors.cyan.500)]" />
      )}

      {/* Day label */}
      <div className={`text-[10px] font-semibold uppercase tracking-wide ${isToday ? 'text-cyan-400' : 'text-gray-500'}`}>
        {dayOfWeek.charAt(0)}
      </div>

      {/* Date number */}
      <div className={`text-xs font-bold ${isToday ? 'text-white' : 'text-gray-400'}`}>
        {dayNumber}
      </div>

      {/* Workout indicator */}
      {hasWorkout ? (
        <>
          <div className={`text-[9px] font-bold mt-0.5 tracking-tight ${isToday ? 'text-white' : 'text-gray-400'}`}>
            {getWorkoutLabel(workout.focus)}
          </div>

          {/* Status dot */}
          {status && (
            <div className="absolute bottom-1 right-1">
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  status === 'completed' ? 'bg-emerald-500' : 'bg-yellow-500'
                }`}
              />
            </div>
          )}
        </>
      ) : (
        <div className={`text-[9px] font-bold mt-0.5 tracking-tight ${isToday ? 'text-white' : 'text-gray-500'}`}>
          REST
        </div>
      )}
    </motion.div>
  );

  if (hasWorkout) {
    return <Link href={`/workout/${workout.id}`}>{cardContent}</Link>;
  }

  return cardContent;
}
