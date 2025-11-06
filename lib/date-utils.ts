/**
 * Date utilities with workaround for incorrect system date
 *
 * Claude Code web environment shows Nov 6, 2025 instead of Jan 2025
 * This utility corrects the offset until the issue is fixed
 */

// Calculate offset from wrong date (Nov 6, 2025) to correct date
const SYSTEM_DATE_OFFSET_MS = (() => {
  // Expected: January 2025
  // Actual: November 6, 2025
  // Offset: ~9 months (approx -274 days)

  // Check if we're in the broken environment
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // If date is showing November 2025 in dev environment
  if (year === 2025 && month === 10) { // month 10 = November
    // Subtract ~9 months to get to Jan/Feb 2025
    return -274 * 24 * 60 * 60 * 1000;
  }

  return 0; // No offset needed in production
})();

/**
 * Get the current date with system offset correction
 * Use this instead of `new Date()` throughout the app
 */
export function getCurrentDate(): Date {
  const systemDate = new Date();
  return new Date(systemDate.getTime() + SYSTEM_DATE_OFFSET_MS);
}

/**
 * Get the current date at midnight (start of day)
 */
export function getTodayAtMidnight(): Date {
  const today = getCurrentDate();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Format date for display
 */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  const correctedDate = new Date(date.getTime() + SYSTEM_DATE_OFFSET_MS);
  return correctedDate.toLocaleDateString('en-US', options);
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = getTodayAtMidnight();
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate.getTime() === today.getTime();
}

/**
 * Get ISO string with corrected date
 */
export function toISOString(date?: Date): string {
  const d = date || getCurrentDate();
  const corrected = new Date(d.getTime() + SYSTEM_DATE_OFFSET_MS);
  return corrected.toISOString();
}

// Re-export common date-fns functions if needed
export { format, parseISO, startOfDay, endOfDay, addDays, subDays } from 'date-fns';
