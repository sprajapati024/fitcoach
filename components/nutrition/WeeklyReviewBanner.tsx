"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, X, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface WeeklyReviewBannerProps {
  userId: string;
}

/**
 * Get Monday of the current week (ISO week starting Monday)
 */
function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0]!;
}

/**
 * Get Sunday of the current week
 */
function getSunday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() + (7 - day);
  const sunday = new Date(d.setDate(diff));
  return sunday.toISOString().split("T")[0]!;
}

/**
 * Get the previous week's Monday (for Monday/Tuesday banner)
 */
function getLastWeekMonday(date: Date): string {
  const monday = new Date(getMonday(date));
  monday.setDate(monday.getDate() - 7);
  return monday.toISOString().split("T")[0]!;
}

/**
 * Get the previous week's Sunday
 */
function getLastWeekSunday(date: Date): string {
  const sunday = new Date(getSunday(date));
  sunday.setDate(sunday.getDate() - 7);
  return sunday.toISOString().split("T")[0]!;
}

/**
 * Get week number (ISO week)
 */
function getWeekNumber(dateStr: string): number {
  const date = new Date(dateStr);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Check if user has logged meals in a given week
 */
async function hasWeeklyData(userId: string, startDate: string, endDate: string): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/nutrition/weekly-trends?startDate=${startDate}&endDate=${endDate}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.daysWithMeals > 0;
  } catch {
    return false;
  }
}

export function WeeklyReviewBanner({ userId }: WeeklyReviewBannerProps) {
  const router = useRouter();
  const [shouldShow, setShouldShow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [weekInfo, setWeekInfo] = useState({ weekNumber: 0, startDate: "", endDate: "" });

  useEffect(() => {
    const checkShouldShowBanner = async () => {
      const today = new Date();
      const dayOfWeek = today.getDay();

      // Only show on Monday (1) or Tuesday (2)
      if (dayOfWeek !== 1 && dayOfWeek !== 2) {
        setShouldShow(false);
        return;
      }

      // Get previous week's date range
      const lastWeekStart = getLastWeekMonday(today);
      const lastWeekEnd = getLastWeekSunday(today);
      const weekNum = getWeekNumber(lastWeekStart);

      setWeekInfo({
        weekNumber: weekNum,
        startDate: lastWeekStart,
        endDate: lastWeekEnd,
      });

      // Check if already dismissed this week
      const dismissKey = `dismissed_weekly_review_${lastWeekStart}`;
      const isDismissed = localStorage.getItem(dismissKey);

      if (isDismissed) {
        setShouldShow(false);
        return;
      }

      // Check if user has data from previous week
      const hasData = await hasWeeklyData(userId, lastWeekStart, lastWeekEnd);

      if (!hasData) {
        setShouldShow(false);
        return;
      }

      // All conditions met - show banner
      setShouldShow(true);
      // Delay visibility for animation
      setTimeout(() => setIsVisible(true), 100);
    };

    void checkShouldShowBanner();
  }, [userId]);

  const handleView = () => {
    // Mark as viewed before navigating
    const dismissKey = `dismissed_weekly_review_${weekInfo.startDate}`;
    localStorage.setItem(dismissKey, "true");

    // Navigate to weekly review page
    router.push(`/nutrition/weekly?startDate=${weekInfo.startDate}&endDate=${weekInfo.endDate}`);
  };

  const handleDismiss = () => {
    // Store dismissal in localStorage
    const dismissKey = `dismissed_weekly_review_${weekInfo.startDate}`;
    localStorage.setItem(dismissKey, "true");

    // Hide banner with animation
    setIsVisible(false);
    setTimeout(() => setShouldShow(false), 300);
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="relative p-4 rounded-lg border border-cyan-500/30 bg-gradient-to-r from-cyan-900/30 to-indigo-900/30 overflow-hidden">
            {/* Gradient overlay for visual interest */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-indigo-500/5 pointer-events-none" />

            {/* Content */}
            <div className="relative flex items-center gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-cyan-500/20">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  Your Week {weekInfo.weekNumber} Nutrition Review is ready!
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Tap to see how you did last week
                </p>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex items-center gap-2">
                <button
                  onClick={handleView}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-sm font-medium transition active:scale-95"
                >
                  View
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleDismiss}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition"
                  title="Dismiss"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
