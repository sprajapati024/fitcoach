'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CompactWeekNavProps {
  currentWeek: number;
  totalWeeks: number;
  onPrevious: () => void;
  onNext: () => void;
  onWeekSelect: (week: number) => void;
}

export function CompactWeekNav({
  currentWeek,
  totalWeeks,
  onPrevious,
  onNext,
  onWeekSelect,
}: CompactWeekNavProps) {
  return (
    <div className="flex items-center justify-between">
      {/* Previous button */}
      <button
        onClick={onPrevious}
        disabled={currentWeek === 0}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-gray-400 transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800 hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Week indicator */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-white mr-2">
          Week {currentWeek + 1}
        </span>
        {totalWeeks <= 12 ? (
          // Show dots for plans with <= 12 weeks
          Array.from({ length: totalWeeks }).map((_, i) => (
            <button
              key={i}
              onClick={() => onWeekSelect(i)}
              className={`h-1.5 w-1.5 rounded-full transition-all ${
                i === currentWeek
                  ? 'bg-cyan-500 w-4'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            />
          ))
        ) : (
          // Show text for longer plans
          <span className="text-xs text-gray-400">of {totalWeeks}</span>
        )}
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={currentWeek === totalWeeks - 1}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-gray-400 transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800 hover:text-white"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
