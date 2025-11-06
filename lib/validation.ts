import { z } from "zod";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const isoDateString = z.string().regex(isoDateRegex);
const optionalIsoDateString = z.union([isoDateString, z.literal("")]);

export const preferredDaySchema = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

export const onboardingSchema = z.object({
  fullName: z.string().max(80), // Allow empty string for skipped onboarding
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
  coachTone: z.enum(["analyst", "flirty"]),
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
  isoDate: optionalIsoDateString,
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
        startDate: optionalIsoDateString,
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

export const logRequestSchema = z
  .object({
    workoutId: z.string().min(6).max(64),
    entries: z.array(logEntrySchema).max(60),
    rpeLastSet: z.number().min(5).max(10).optional(),
    performedAt: z.string().datetime().optional(),
    skipReason: z.string().min(3).max(160).optional(),
  })
  .superRefine((data, ctx) => {
    const hasEntries = data.entries.length > 0;
    const hasSkip = !!data.skipReason;

    if (!hasEntries && !hasSkip) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one logged set or a skip reason.",
        path: ["entries"],
      });
    }

    if (hasEntries && typeof data.rpeLastSet !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Overall workout RPE is required when logging sets.",
        path: ["rpeLastSet"],
      });
    }

    if (hasSkip && data.entries.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Skipped workouts should not include logged sets.",
        path: ["entries"],
      });
    }
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

export type SubstitutionRequest = z.infer<typeof substitutionRequestSchema>;

export const substitutionResponseSchema = z.object({
  alternatives: z.array(z.object({
    exerciseId: z.string().min(2).max(60),
    rationale: z.string().min(3).max(200),
  })).min(2).max(3),
});

export type SubstitutionResponse = z.infer<typeof substitutionResponseSchema>;

// ============================================================================
// Phase 3: Adaptive Planning Schemas
// ============================================================================

/**
 * Periodization block types for training phases
 * Used to guide weekly plan generation based on training phase
 */
export const periodizationPhaseSchema = z.enum([
  "accumulation",    // Build volume, moderate intensity (weeks 1-3)
  "intensification", // Increase intensity, maintain/reduce volume (weeks 4-6)
  "deload",         // Recovery week, reduced volume and intensity
  "realization",    // Peak performance, test strength gains (weeks 7-8)
]);

export type PeriodizationPhase = z.infer<typeof periodizationPhaseSchema>;

/**
 * Periodization block configuration
 * Defines which phase applies to which weeks of the program
 */
export const periodizationBlockSchema = z.object({
  phase: periodizationPhaseSchema,
  weekStart: z.number().int().min(1).max(16), // 1-indexed week number
  weekEnd: z.number().int().min(1).max(16),
  volumeModifier: z.number().min(0.5).max(1.5), // Multiplier for sets (0.7 = deload, 1.2 = volume block)
  intensityModifier: z.number().min(0.7).max(1.1), // Multiplier for RPE targets
  notes: z.string().max(200).optional(),
});

export type PeriodizationBlock = z.infer<typeof periodizationBlockSchema>;

/**
 * Exercise with RPE/RIR targets for adaptive progression
 * Extends base exercise schema with progression guidance
 */
export const exerciseWithRPESchema = z.object({
  id: z.string().min(2).max(60),
  name: z.string().min(2).max(80),
  equipment: z.string().min(2).max(40),
  sets: z.number().int().min(1).max(6),
  reps: z.string().min(1).max(40),
  targetRPE: z.number().min(6).max(10).optional(), // Target RPE for this exercise
  targetRIR: z.number().int().min(0).max(4).optional(), // Target RIR (Reps In Reserve)
  tempo: z.union([z.string().max(20), z.null()]).optional(),
  cues: z.union([z.array(z.string().min(2).max(80)).max(4), z.null()]).optional(),
  notes: z.union([z.string().max(140), z.null()]).optional(),
  progressionNotes: z.string().max(200).optional(), // How to progress this exercise week-to-week
});

export type ExerciseWithRPE = z.infer<typeof exerciseWithRPESchema>;

/**
 * Weekly workout schema with coaching notes
 * Used for generating week-by-week plans with performance-based adaptations
 */
export const weeklyWorkoutBlockSchema = z.object({
  type: z.enum(["warmup", "strength", "accessory", "conditioning", "recovery"]),
  title: z.string().min(2).max(80),
  durationMinutes: z.number().int().min(5).max(90),
  exercises: z.array(exerciseWithRPESchema).min(1).max(6),
});

export const weeklyWorkoutSchema = z.object({
  weekNumber: z.number().int().min(1).max(16), // 1-indexed week number
  phase: periodizationPhaseSchema,
  dayIndex: z.number().int().min(0).max(6),
  focus: z.string().min(3).max(80),
  blocks: z.array(weeklyWorkoutBlockSchema).min(1).max(5),
  coachingNotes: z.string().max(300).optional(), // Weekly guidance based on previous week performance
  volumeLoad: z.number().int().min(0).max(200).optional(), // Total estimated volume (sets × avg reps)
  intensityScore: z.number().min(0).max(10).optional(), // Avg RPE across primary lifts
});

export type WeeklyWorkout = z.infer<typeof weeklyWorkoutSchema>;

/**
 * Adaptive planner response for single week generation
 * Used when generating Week 2+ based on Week 1 performance
 */
export const adaptiveWeekResponseSchema = z.object({
  weekNumber: z.number().int().min(1).max(16),
  phase: periodizationPhaseSchema,
  workouts: z.array(weeklyWorkoutSchema).min(3).max(6), // One workout per training day
  summary: z.string().min(10).max(240), // Summary of this week's plan
  progressionRationale: z.string().min(10).max(400), // Why exercises/volumes changed from previous week
  cues: z.array(z.string().min(3).max(120)).max(5),
});

export type AdaptiveWeekResponse = z.infer<typeof adaptiveWeekResponseSchema>;
