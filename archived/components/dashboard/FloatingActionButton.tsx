'use client';

import { Play, Plus } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface FloatingActionButtonProps {
  workoutId?: string | null;
  hasWorkout: boolean;
}

export function FloatingActionButton({ workoutId, hasWorkout }: FloatingActionButtonProps) {
  const href = hasWorkout && workoutId ? `/workout/${workoutId}` : '/nutrition';
  const Icon = hasWorkout ? Play : Plus;
  const label = hasWorkout ? 'Start' : 'Log';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.6, type: 'spring' }}
      className="fixed bottom-6 right-6 z-40"
    >
      <Link
        href={href}
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/30 transition hover:scale-110 active:scale-95"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Icon className="h-6 w-6 text-white" />
        </motion.div>

        {/* Tooltip */}
        <div className="absolute bottom-full mb-2 hidden whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg group-hover:block">
          {label}
          <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      </Link>
    </motion.div>
  );
}
