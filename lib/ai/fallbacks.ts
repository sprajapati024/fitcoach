/**
 * AI Offline Fallback Responses
 *
 * Provides rule-based responses when AI is unavailable (offline or API error).
 * These are deterministic, context-aware fallbacks based on user data.
 */

import type { CoachResponse } from '@/lib/validation';

type CoachTone = 'analyst' | 'flirty';

interface FallbackContext {
  hasWorkoutToday?: boolean;
  recentStreak?: number;
  lastWorkoutDaysAgo?: number;
  isDeloadWeek?: boolean;
  userCoachTone?: CoachTone;
}

/**
 * Generate a fallback coach brief when AI is unavailable
 */
export function generateFallbackBrief(context: FallbackContext = {}): CoachResponse {
  const {
    hasWorkoutToday = false,
    recentStreak = 0,
    lastWorkoutDaysAgo = null,
    isDeloadWeek = false,
    userCoachTone = 'analyst',
  } = context;

  // Determine state
  const hasRecentActivity = lastWorkoutDaysAgo !== null && lastWorkoutDaysAgo <= 3;
  const needsMotivation = lastWorkoutDaysAgo !== null && lastWorkoutDaysAgo > 5;
  const onStreak = recentStreak >= 3;

  // Generate headline
  let headline: string;
  if (isDeloadWeek) {
    headline = userCoachTone === 'flirty'
      ? "Recovery week vibes 💆"
      : "Deload week: Strategic recovery";
  } else if (needsMotivation) {
    headline = userCoachTone === 'flirty'
      ? "Time to make a comeback 💪"
      : "Let's rebuild momentum";
  } else if (onStreak) {
    headline = userCoachTone === 'flirty'
      ? "You're on fire lately 🔥"
      : "Strong consistency maintained";
  } else if (hasWorkoutToday) {
    headline = userCoachTone === 'flirty'
      ? "Ready to own today? 😉"
      : "Training session scheduled";
  } else {
    headline = userCoachTone === 'flirty'
      ? "Rest day? Perfect timing ✨"
      : "Active recovery recommended";
  }

  // Generate bullets
  const bullets: string[] = [];

  if (isDeloadWeek) {
    bullets.push("Lower intensity, prioritize technique");
    bullets.push("Allow full recovery between sets");
    if (userCoachTone === 'flirty') {
      bullets.push("Your body will thank you later 😌");
    } else {
      bullets.push("Maintain movement quality over load");
    }
  } else if (hasWorkoutToday) {
    bullets.push("Review exercise cues before starting");
    bullets.push("Track RPE to gauge effort accurately");
    if (userCoachTone === 'flirty') {
      bullets.push("Make every rep count today 💯");
    } else {
      bullets.push("Focus on progressive overload");
    }
  } else if (needsMotivation) {
    bullets.push("Small steps rebuild momentum");
    bullets.push("Schedule your next session now");
    if (userCoachTone === 'flirty') {
      bullets.push("I know you've got this in you 💪");
    } else {
      bullets.push("Consistency beats intensity");
    }
  } else if (hasRecentActivity) {
    bullets.push("Recovery enables adaptation");
    bullets.push("Light movement aids circulation");
    if (userCoachTone === 'flirty') {
      bullets.push("Treat yourself—you earned it ✨");
    } else {
      bullets.push("Optimize nutrition and hydration");
    }
  } else {
    bullets.push("Maintain training readiness");
    bullets.push("Review upcoming workout plan");
    bullets.push("Ensure equipment is accessible");
  }

  // Generate prompts
  const prompts: string[] = [];
  if (hasWorkoutToday) {
    prompts.push("How are you feeling today?");
    if (!isDeloadWeek) {
      prompts.push("Ready to push for a PR?");
    }
  } else if (needsMotivation) {
    prompts.push("What's holding you back?");
    prompts.push("Can I help adjust your plan?");
  } else {
    prompts.push("How did your last session go?");
  }

  return {
    headline,
    bullets: bullets.slice(0, 3), // Max 3 bullets
    prompts: prompts.slice(0, 2), // Max 2 prompts
  };
}

/**
 * Generate a fallback error message with recovery guidance
 */
export function generateErrorFallback(error: string, isOffline: boolean): CoachResponse {
  if (isOffline) {
    return {
      headline: "Offline mode active",
      bullets: [
        "Your progress is being tracked locally",
        "Data will sync when connection returns",
        "All core features remain available",
      ],
      prompts: ["Log a workout?", "Review your plan?"],
    };
  }

  // Generic error fallback
  return {
    headline: "Coach temporarily unavailable",
    bullets: [
      "Using cached guidance for now",
      "Full features will return shortly",
      "Your training can continue as planned",
    ],
    prompts: ["View today's workout?", "Check recent progress?"],
  };
}

/**
 * Generate a fallback weekly review when AI is unavailable
 */
export function generateFallbackWeeklyReview(context: {
  workoutCount?: number;
  avgRpe?: number;
  userCoachTone?: CoachTone;
} = {}): CoachResponse {
  const {
    workoutCount = 0,
    avgRpe = null,
    userCoachTone = 'analyst',
  } = context;

  const hitTarget = workoutCount >= 3;
  const highEffort = avgRpe !== null && avgRpe >= 8;

  let headline: string;
  if (hitTarget && highEffort) {
    headline = userCoachTone === 'flirty'
      ? "Crushing it this week! 🏆"
      : "Strong week: High volume + effort";
  } else if (hitTarget) {
    headline = userCoachTone === 'flirty'
      ? "Consistency on point! 🎯"
      : "Volume target achieved";
  } else if (workoutCount > 0) {
    headline = userCoachTone === 'flirty'
      ? "Some is better than none 💪"
      : "Partial week completed";
  } else {
    headline = userCoachTone === 'flirty'
      ? "Let's bounce back next week 🚀"
      : "Recovery week: Prepare for return";
  }

  const bullets: string[] = [];
  if (workoutCount > 0) {
    bullets.push(`${workoutCount} session${workoutCount !== 1 ? 's' : ''} logged`);
    if (avgRpe !== null) {
      bullets.push(`Average effort: ${avgRpe.toFixed(1)}/10 RPE`);
    }
    bullets.push("Progress trends available in dashboard");
  } else {
    bullets.push("No sessions logged this week");
    bullets.push("Consider scheduling next session");
    bullets.push("Adjust plan if needed for adherence");
  }

  const prompts = workoutCount > 0
    ? ["Review detailed stats?", "Plan next week?"]
    : ["Schedule a session?", "Adjust your plan?"];

  return {
    headline,
    bullets: bullets.slice(0, 3),
    prompts: prompts.slice(0, 2),
  };
}

/**
 * Generate a fallback substitution suggestion
 */
export function generateFallbackSubstitution(exerciseName: string): CoachResponse {
  // Extract exercise category for better suggestions
  const name = exerciseName.toLowerCase();
  const isSquat = name.includes('squat');
  const isDeadlift = name.includes('deadlift') || name.includes('hinge');
  const isPress = name.includes('press') || name.includes('push');
  const isPull = name.includes('pull') || name.includes('row');

  let suggestions: string[];
  if (isSquat) {
    suggestions = ["Goblet squat", "Bulgarian split squat", "Leg press"];
  } else if (isDeadlift) {
    suggestions = ["Romanian deadlift", "Trap bar deadlift", "Good mornings"];
  } else if (isPress) {
    suggestions = ["Dumbbell press", "Floor press", "Landmine press"];
  } else if (isPull) {
    suggestions = ["Seated row", "Chest-supported row", "Lat pulldown"];
  } else {
    suggestions = ["Check equipment alternatives", "Consult exercise database", "Ask your coach"];
  }

  return {
    headline: `Substitute for ${exerciseName}`,
    bullets: suggestions.slice(0, 3),
    prompts: ["Need more options?", "Adjust workout?"],
  };
}
