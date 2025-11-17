import { listExercises } from "@/lib/exerciseLibrary";
import type { profiles } from "@/drizzle/schema";

type Profile = typeof profiles.$inferSelect;

interface PlannerPayload {
  user: {
    sex: string;
    age: number;
    height_cm: number;
    weight_kg: number;
  };
  flags: {
    pcos: boolean;
    injuries: string[];
  };
  experience: string;
  schedule: {
    days_per_week: number;
    minutes_per_session: number;
    weeks: number;
    preferred_days: string[];
  };
  equipment: {
    gym: boolean;
    available: string[];
  };
  goal_bias: string;
  constraints: {
    avoid: string[];
    no_high_impact: boolean;
  };
  cardio: {
    zone2: boolean;
    target_minutes_per_week: number;
  };
  coach_notes?: string;
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: string | null): number {
  if (!dateOfBirth) return 30; // Default fallback
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Build planner user prompt from profile data
 */
export function buildPlannerPrompt(profile: Profile): string {
  // Calculate age from dateOfBirth
  const age = calculateAge(profile.dateOfBirth);

  // Build compact payload
  const payload: PlannerPayload = {
    user: {
      sex: profile.sex || "unspecified",
      age,
      height_cm: profile.heightCm ? Number(profile.heightCm) : 170,
      weight_kg: profile.weightKg ? Number(profile.weightKg) : 70,
    },
    flags: {
      pcos: profile.hasPcos,
      injuries: [], // Can be extended later
    },
    experience: profile.experienceLevel,
    schedule: {
      days_per_week: profile.scheduleDaysPerWeek || 3,
      minutes_per_session: profile.scheduleMinutesPerSession || 60,
      weeks: profile.scheduleWeeks || 8,
      preferred_days: profile.preferredDays || [],
    },
    equipment: {
      gym: true, // Always true for now (can add home workouts later)
      available: profile.equipment || [
        "barbell",
        "dumbbells",
        "machines",
        "cables",
        "treadmill",
        "bike",
        "rower",
      ],
    },
    goal_bias: profile.goalBias,
    constraints: {
      avoid: profile.avoidList || [],
      no_high_impact: profile.noHighImpact,
    },
    cardio: {
      zone2: profile.hasPcos, // Zone 2 emphasized for PCOS
      target_minutes_per_week: profile.hasPcos ? 90 : 60,
    },
  };

  // Add coach notes if provided
  if (profile.coachNotes && profile.coachNotes.trim()) {
    payload.coach_notes = profile.coachNotes.trim();
  }

  // Get exercise library for context
  const exercises = listExercises();
  const exerciseContext = exercises
    .map((ex) => `${ex.id}: ${ex.movement} (${ex.impact}${ex.isPcosFriendly ? ", PCOS-safe" : ""})`)
    .join(", ");

  // Build user prompt
  const userPrompt = `Generate a training plan for the following profile:

${JSON.stringify(payload, null, 2)}

Available exercises (use IDs in your response):
${exerciseContext}

IMPORTANT REQUIREMENTS:
- Create ${payload.schedule.weeks}-week plan with ${payload.schedule.days_per_week} sessions/week
- Each session must fit within ${payload.schedule.minutes_per_session} minutes
- Use 2-3 microcycles (A, B, and optional Deload for plans ≥10 weeks)
${payload.flags.pcos ? "- PCOS considerations: Include 2-3x Zone-2 cardio/week (15-20 min each), NO HIIT >60s, add recovery notes daily" : ""}
${payload.constraints.no_high_impact ? "- Avoid high-impact exercises" : ""}
${payload.constraints.avoid.length > 0 ? `- Avoid these exercises/patterns: ${payload.constraints.avoid.join(", ")}` : ""}
- Include per-lift progression policy (rep range, step sizes, cap %, deload weeks)
- Preferred training days: ${payload.schedule.preferred_days.length > 0 ? payload.schedule.preferred_days.join(", ") : "flexible"}
${payload.coach_notes ? `- User notes: "${payload.coach_notes}"` : ""}

Goal bias: ${payload.goal_bias}
Experience level: ${payload.experience}

Return ONLY valid JSON matching the PlannerResponse schema. No prose, no explanations.`;

  return userPrompt;
}

/**
 * Get exercise library as compact context string
 */
export function getExerciseLibraryContext(): string {
  const exercises = listExercises();
  return exercises
    .map((ex) => {
      const tags: string[] = [ex.movement, ex.impact];
      if (ex.isPcosFriendly) tags.push("PCOS-OK");
      return `${ex.id}[${tags.join(",")}]`;
    })
    .join("; ");
}

/**
 * Build coach context for Today brief, debrief, etc.
 */
export function buildCoachContext({
  userProfile,
  todayWorkout,
  recentLogs,
}: {
  userProfile: Partial<Profile>;
  todayWorkout?: unknown;
  recentLogs?: unknown[];
}): string {
  const context = {
    user: {
      experience: userProfile.experienceLevel || "beginner",
      tone: userProfile.coachTone || "concise",
      pcos: userProfile.hasPcos || false,
    },
    workout: todayWorkout,
    recent_logs: recentLogs?.slice(0, 3) || [],
  };

  return JSON.stringify(context, null, 2);
}
