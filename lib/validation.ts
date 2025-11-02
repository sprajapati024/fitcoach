import { z } from "zod";

export const preferredDaySchema = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

export const onboardingSchema = z.object({
  fullName: z.string().min(1).max(80),
  sex: z.enum(["female", "male", "non_binary", "unspecified"]),
  age: z.number().int().min(18).max(80),
  height: z.object({
    value: z.number().min(120).max(220),
    unit: z.enum(["cm", "in"]),
  }),
  weight: z.object({
    value: z.number().min(40).max(200),
    unit: z.enum(["kg", "lb"]),
  }),
  unitSystem: z.enum(["metric", "imperial"]),
  hasPcos: z.boolean(),
  experienceLevel: z.enum(["beginner", "intermediate"]),
  schedule: z.object({
    daysPerWeek: z.number().int().min(3).max(6),
    minutesPerSession: z.number().int().min(40).max(90),
    programWeeks: z.number().int().min(6).max(16),
    preferredDays: z.array(preferredDaySchema).min(3).max(6),
  }),
  equipment: z.array(z.string().min(1).max(40)).min(1).max(16),
  avoidList: z.array(z.string().min(1).max(50)).max(12),
  noHighImpact: z.boolean(),
  goalBias: z.enum(["strength", "balanced", "hypertrophy", "fat_loss"]),
  coachTone: z.enum(["concise", "friendly"]),
  coachTodayEnabled: z.boolean(),
  coachDebriefEnabled: z.boolean(),
  coachWeeklyEnabled: z.boolean(),
  coachNotes: z.string().max(500).optional(),
  timezone: z.string().default("UTC"),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const plannerPayloadSchema = z.object({
  planId: z.string().min(6).max(64),
  profile: onboardingSchema,
});

export type PlannerPayload = z.infer<typeof plannerPayloadSchema>;

export const planBlockSchema = z.object({
  type: z.enum(["warmup", "strength", "accessory", "conditioning", "recovery"]),
  title: z.string().min(2).max(80),
  durationMinutes: z.number().int().min(5).max(90),
  exercises: z
    .array(
      z.object({
        id: z.string().min(2).max(60),
        name: z.string().min(2).max(80),
        equipment: z.string().min(2).max(40),
        sets: z.number().int().min(1).max(6),
        reps: z.string().min(1).max(40),
        tempo: z.union([z.string().max(20), z.null()]).optional(),
        cues: z.union([z.array(z.string().min(2).max(80)).max(4), z.null()]).optional(),
        notes: z.union([z.string().max(140), z.null()]).optional(),
      }),
    )
    .min(1)
    .max(6),
});

// Simplified schema for what the AI agent generates (no weeks, no id)
export const plannerMicrocycleSchema = z.object({
  daysPerWeek: z.number().int().min(3).max(6),
  pattern: z
    .array(
      z.object({
        dayIndex: z.number().int().min(0).max(6),
        focus: z.string().min(3).max(80),
        blocks: z.array(planBlockSchema).min(1).max(5),
      }),
    )
    .min(3)
    .max(6),
});

// Full schema for storage (includes weeks and id)
export const planMicrocycleSchema = z.object({
  id: z.string().min(4).max(64),
  weeks: z.number().int().min(6).max(16),
  daysPerWeek: z.number().int().min(3).max(6),
  pattern: z
    .array(
      z.object({
        dayIndex: z.number().int().min(0).max(6),
        focus: z.string().min(3).max(80),
        blocks: z.array(planBlockSchema).min(1).max(5),
      }),
    )
    .min(3)
    .max(6),
});

export type PlanMicrocycleInput = z.infer<typeof planMicrocycleSchema>;

export const planCalendarDaySchema = z.object({
  dayIndex: z.number().int().min(0).max(95),
  isoDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  workoutId: z.string().min(6).max(64),
  isDeload: z.boolean(),
  focus: z.string().min(3).max(80),
});

export const planCalendarSchema = z.object({
  planId: z.string().min(6).max(64),
  weeks: z
    .array(
      z.object({
        weekIndex: z.number().int().min(0).max(15),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        days: z.array(planCalendarDaySchema).min(1).max(7),
      }),
    )
    .min(6)
    .max(16),
});

export type PlanCalendarInput = z.infer<typeof planCalendarSchema>;

// Simplified schema for what the AI agent generates
// App will add: planId (via nanoid), microcycle.id, microcycle.weeks (from profile), review.weeklyFocus (derived from pattern)
export const plannerResponseSchema = z.object({
  microcycle: plannerMicrocycleSchema,
  summary: z.string().min(10).max(240),
  cues: z.array(z.string().min(3).max(120)).max(5),
  review: z.object({
    safety: z.array(z.string().min(3).max(120)).max(4),
  }),
});

export type PlannerResponse = z.infer<typeof plannerResponseSchema>;

export const planActivateSchema = z.object({
  planId: z.string().min(6).max(64),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const logEntrySchema = z.object({
  exerciseId: z.string().min(2).max(60),
  set: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(30),
  weight: z.number().min(0).max(500),
  rpe: z.number().min(5).max(10).optional(),
  notes: z.string().max(160).optional(),
});

export const logRequestSchema = z.object({
  workoutId: z.string().min(6).max(64),
  entries: z.array(logEntrySchema).min(1).max(60),
  rpeLastSet: z.number().min(5).max(10).optional(),
  performedAt: z.string().datetime().optional(),
});

export type WorkoutLogRequest = z.infer<typeof logRequestSchema>;

export const progressionComputeSchema = z.object({
  planId: z.string().min(6).max(64),
  weekIndex: z.number().int().min(0).max(15).optional(),
});

export const coachContextSchema = z.object({
  type: z.enum(["today", "debrief", "weekly", "substitution"]),
  key: z.string().min(2).max(80),
});

export const coachResponseSchema = z.object({
  headline: z.string().min(3).max(80),
  bullets: z.array(z.string().min(3).max(120)).max(5),
  prompts: z.union([z.array(z.string().min(3).max(80)).max(3), z.null()]).optional(),
  tweaks: z
    .union([
      z.array(
        z.object({
          exerciseId: z.string().min(2).max(60),
          replacementId: z.string().min(2).max(60),
          rationale: z.string().min(3).max(160),
        }),
      ).max(3),
      z.null(),
    ])
    .optional(),
});

export type CoachResponse = z.infer<typeof coachResponseSchema>;

export const substitutionRequestSchema = z.object({
  planId: z.string().min(6).max(64),
  workoutId: z.string().min(6).max(64),
  exerciseId: z.string().min(2).max(60),
  reason: z.string().max(120).optional(),
});
