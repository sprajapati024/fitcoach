import { Sunrise, Sun, Sunset, Moon } from 'lucide-react';

export interface GreetingData {
  message: string;
  icon: typeof Sunrise | typeof Sun | typeof Sunset | typeof Moon;
}

/**
 * Get time-based greeting message and icon
 * Returns the appropriate greeting and Lucide icon based on current time
 */
export function getTimeBasedGreeting(): GreetingData {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return {
      message: 'Good Morning',
      icon: Sunrise,
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      message: 'Good Afternoon',
      icon: Sun,
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      message: 'Good Evening',
      icon: Sunset,
    };
  } else {
    return {
      message: 'Good Night',
      icon: Moon,
    };
  }
}

/**
 * Extract first name from full name
 */
export function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return 'there';
  return fullName.split(' ')[0];
}
