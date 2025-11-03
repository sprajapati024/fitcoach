import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const unitSystemEnum = pgEnum("unit_system", ["metric", "imperial"]);
export const sexEnum = pgEnum("sex", ["female", "male", "non_binary", "unspecified"]);
export const experienceLevelEnum = pgEnum("experience_level", ["beginner", "intermediate"]);
export const goalBiasEnum = pgEnum("goal_bias", ["strength", "balanced", "hypertrophy", "fat_loss"]);
export const coachToneEnum = pgEnum("coach_tone", ["concise", "friendly"]);
export const planStatusEnum = pgEnum("plan_status", ["draft", "active", "completed", "archived"]);
export const workoutKindEnum = pgEnum("workout_kind", ["strength", "conditioning", "mobility", "mixed"]);
export const coachContextEnum = pgEnum("coach_context", ["today", "debrief", "weekly", "substitution"]);
export const weekStatusEnum = pgEnum("week_status", ["pending", "active", "completed"]);
export const blockTypeEnum = pgEnum("block_type", ["accumulation", "intensification", "deload", "realization"]);

export type PreferredDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type PlanMicrocycle = {
  id: string;
  weeks: number;
  daysPerWeek: number;
  pattern: Array<{
    dayIndex: number;
    focus: string;
    blocks: Array<{
      type: "warmup" | "strength" | "accessory" | "conditioning" | "recovery";
      title: string;
      durationMinutes: number;
      exercises: Array<{
        id: string;
        name: string;
        equipment: string;
        sets: number;
        reps: string;
        tempo?: string;
        cues?: string[];
        notes?: string;
      }>;
    }>;
  }>;
};

export type PlanCalendarDay = {
  dayIndex: number;
  isoDate: string;
  workoutId: string;
  isDeload: boolean;
  focus: string;
};

export type PlanCalendar = {
  planId: string;
  weeks: Array<{
    weekIndex: number;
    startDate: string;
    days: PlanCalendarDay[];
  }>;
};

export type WorkoutPayload = {
  workoutId: string;
  focus: string;
  blocks: Array<{
    type: "warmup" | "primary" | "accessory" | "conditioning" | "finisher";
    title: string;
    exercises: Array<{
      id: string;
      name: string;
      equipment: string;
      sets: number;
      reps: string;
      tempo?: string;
      cues?: string[];
      restSeconds?: number;
    }>;
  }>;
};

export type ProgressionTarget = {
  weekIndex: number;
  totalLoadKg: number;
  zone2Minutes: number;
  focusNotes?: string;
};

export type PeriodizationBlock = {
  blockNumber: number;
  blockType: "accumulation" | "intensification" | "deload" | "realization";
  startWeek: number;
  endWeek: number;
  volumeTarget: "high" | "moderate" | "low";
  intensityTarget: "low" | "moderate" | "high";
  repRanges: {
    strength: string;
    accessory: string;
  };
  rpeTargets: {
    strength: number;
    accessory: number;
  };
};

export type PeriodizationFramework = {
  totalWeeks: number;
  blocks: PeriodizationBlock[];
};

export type WeekPerformanceMetrics = {
  completionRate: number;
  avgRPE: number;
  totalVolume: number;
  totalTonnage: number;
  exerciseBreakdown?: Record<string, { sets: number; reps: number; avgWeight: number }>;
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  }),
);

export const profiles = pgTable(
  "profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    fullName: text("full_name"),
    sex: sexEnum("sex").default("unspecified").notNull(),
    dateOfBirth: date("date_of_birth"),
    heightCm: numeric("height_cm", { precision: 5, scale: 2 }),
    weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
    unitSystem: unitSystemEnum("unit_system").default("metric").notNull(),
    hasPcos: boolean("has_pcos").default(false).notNull(),
    experienceLevel: experienceLevelEnum("experience_level").default("beginner").notNull(),
    scheduleDaysPerWeek: smallint("schedule_days_per_week"),
    scheduleMinutesPerSession: smallint("schedule_minutes_per_session"),
    scheduleWeeks: smallint("schedule_weeks"),
    preferredDays: jsonb("preferred_days").$type<PreferredDay[]>().default(sql`'[]'::jsonb`).notNull(),
    equipment: jsonb("equipment").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
    avoidList: jsonb("avoid_list").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
    noHighImpact: boolean("no_high_impact").default(false).notNull(),
    goalBias: goalBiasEnum("goal_bias").default("balanced").notNull(),
    coachTone: coachToneEnum("coach_tone").default("concise").notNull(),
    coachTodayEnabled: boolean("coach_today_enabled").default(true).notNull(),
    coachDebriefEnabled: boolean("coach_debrief_enabled").default(true).notNull(),
  coachWeeklyEnabled: boolean("coach_weekly_enabled").default(true).notNull(),
  coachNotes: text("coach_notes"),
  timezone: text("timezone").default("UTC").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
);

export const plans = pgTable(
  "plans",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").default("FitCoach Plan").notNull(),
    summary: text("summary"),
    status: planStatusEnum("status").default("draft").notNull(),
    active: boolean("active").default(false).notNull(),
    startDate: date("start_date"),
    durationWeeks: smallint("duration_weeks").notNull(),
    daysPerWeek: smallint("days_per_week").notNull(),
    minutesPerSession: smallint("minutes_per_session").notNull(),
    preferredDays: jsonb("preferred_days").$type<PreferredDay[]>().default(sql`'[]'::jsonb`).notNull(),
    microcycle: jsonb("microcycle").$type<PlanMicrocycle>().notNull(),
    calendar: jsonb("calendar").$type<PlanCalendar>().notNull(),
    plannerVersion: text("planner_version"),
    generatedBy: text("generated_by").default("planner").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("plans_user_idx").on(table.userId),
    activeIdx: index("plans_active_idx").on(table.userId, table.active),
  }),
);

export const periodizationFrameworks = pgTable(
  "periodization_frameworks",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    planId: uuid("plan_id")
      .references(() => plans.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    framework: jsonb("framework").$type<PeriodizationFramework>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    planIdx: index("periodization_frameworks_plan_idx").on(table.planId),
  }),
);

export const workouts = pgTable(
  "workouts",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    planId: uuid("plan_id")
      .references(() => plans.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    microcycleDayId: text("microcycle_day_id").notNull(),
    dayIndex: integer("day_index").notNull(),
    weekIndex: smallint("week_index").notNull(),
    weekNumber: smallint("week_number").notNull(),
    weekStatus: weekStatusEnum("week_status").default("pending"),
    sessionDate: date("session_date"),
    title: text("title").notNull(),
    focus: text("focus").notNull(),
    kind: workoutKindEnum("kind").default("strength").notNull(),
    isDeload: boolean("is_deload").default(false).notNull(),
    durationMinutes: smallint("duration_minutes").notNull(),
    payload: jsonb("payload").$type<WorkoutPayload>().notNull(),
    generationContext: jsonb("generation_context").$type<Record<string, unknown>>(),
    coachingNotes: text("coaching_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    planIdx: index("workouts_plan_idx").on(table.planId, table.weekIndex, table.dayIndex),
    weekStatusIdx: index("workouts_week_status_idx").on(table.planId, table.weekNumber, table.weekStatus),
  }),
);

export const workoutLogs = pgTable(
  "workout_logs",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    planId: uuid("plan_id")
      .references(() => plans.id, { onDelete: "cascade" })
      .notNull(),
    workoutId: uuid("workout_id")
      .references(() => workouts.id, { onDelete: "cascade" })
      .notNull(),
    sessionDate: date("session_date").notNull(),
    performedAt: timestamp("performed_at", { withTimezone: true }).defaultNow().notNull(),
    rpeLastSet: numeric("rpe_last_set", { precision: 4, scale: 2 }),
    totalDurationMinutes: smallint("total_duration_minutes"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("workout_logs_user_idx").on(table.userId, table.sessionDate),
  }),
);

export const workoutLogSets = pgTable(
  "workout_log_sets",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    logId: uuid("log_id")
      .references(() => workoutLogs.id, { onDelete: "cascade" })
      .notNull(),
    exerciseId: text("exercise_id").notNull(),
    setIndex: smallint("set_index").notNull(),
    reps: smallint("reps").notNull(),
    weightKg: numeric("weight_kg", { precision: 6, scale: 2 }).notNull(),
    rpe: numeric("rpe", { precision: 4, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    logIdx: index("workout_log_sets_idx").on(table.logId, table.exerciseId),
  }),
);

export const weekPerformanceSummaries = pgTable(
  "week_performance_summaries",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    planId: uuid("plan_id")
      .references(() => plans.id, { onDelete: "cascade" })
      .notNull(),
    weekNumber: smallint("week_number").notNull(),
    completionRate: numeric("completion_rate", { precision: 5, scale: 2 }).notNull(),
    avgRPE: numeric("avg_rpe", { precision: 4, scale: 2 }),
    totalVolume: integer("total_volume").default(0).notNull(),
    totalTonnage: numeric("total_tonnage", { precision: 10, scale: 2 }).default(sql`0`).notNull(),
    metrics: jsonb("metrics").$type<WeekPerformanceMetrics>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueWeek: uniqueIndex("week_performance_summaries_idx").on(table.planId, table.weekNumber),
  }),
);

export const progressionTargets = pgTable(
  "progression_targets",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    planId: uuid("plan_id")
      .references(() => plans.id, { onDelete: "cascade" })
      .notNull(),
    weekIndex: smallint("week_index").notNull(),
    payload: jsonb("payload").$type<ProgressionTarget>().notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueWeek: uniqueIndex("progression_targets_idx").on(table.planId, table.weekIndex),
  }),
);

export const coachCache = pgTable(
  "coach_cache",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    planId: uuid("plan_id")
      .references(() => plans.id, { onDelete: "cascade" }),
    context: coachContextEnum("context").notNull(),
    cacheKey: text("cache_key").notNull(),
    targetDate: date("target_date"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniquePerKey: uniqueIndex("coach_cache_unique").on(table.userId, table.context, table.cacheKey),
  }),
);

export const substitutionEvents = pgTable(
  "substitution_events",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    planId: uuid("plan_id")
      .references(() => plans.id, { onDelete: "cascade" })
      .notNull(),
    workoutId: uuid("workout_id")
      .references(() => workouts.id, { onDelete: "cascade" })
      .notNull(),
    exerciseId: text("exercise_id").notNull(),
    replacementIds: jsonb("replacement_ids").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("substitution_events_user_idx").on(table.userId, table.createdAt),
  }),
);

export const rlsPolicies = {
  users: {
    select: "CREATE POLICY \"Users select\" ON users FOR SELECT USING ( auth.uid() = id );",
  },
  profiles: {
    select: "CREATE POLICY \"Profiles select\" ON profiles FOR SELECT USING ( auth.uid() = user_id );",
    update: "CREATE POLICY \"Profiles update\" ON profiles FOR UPDATE USING ( auth.uid() = user_id );",
  },
  plans: {
    select: "CREATE POLICY \"Plans select\" ON plans FOR SELECT USING ( auth.uid() = user_id );",
    insert: "CREATE POLICY \"Plans insert\" ON plans FOR INSERT WITH CHECK ( auth.uid() = user_id );",
    update: "CREATE POLICY \"Plans update\" ON plans FOR UPDATE USING ( auth.uid() = user_id );",
  },
  workouts: {
    select: "CREATE POLICY \"Workouts select\" ON workouts FOR SELECT USING ( auth.uid() = user_id );",
  },
  workoutLogs: {
    select: "CREATE POLICY \"Workout logs select\" ON workout_logs FOR SELECT USING ( auth.uid() = user_id );",
    insert: "CREATE POLICY \"Workout logs insert\" ON workout_logs FOR INSERT WITH CHECK ( auth.uid() = user_id );",
  },
  workoutLogSets: {
    select: "CREATE POLICY \"Workout log sets select\" ON workout_log_sets FOR SELECT USING ( auth.uid() IN (SELECT user_id FROM workout_logs WHERE workout_logs.id = log_id) );",
    insert:
      "CREATE POLICY \"Workout log sets insert\" ON workout_log_sets FOR INSERT WITH CHECK ( auth.uid() IN (SELECT user_id FROM workout_logs WHERE workout_logs.id = log_id) );",
  },
  coachCache: {
    select: "CREATE POLICY \"Coach cache select\" ON coach_cache FOR SELECT USING ( auth.uid() = user_id );",
    insert: "CREATE POLICY \"Coach cache insert\" ON coach_cache FOR INSERT WITH CHECK ( auth.uid() = user_id );",
    update: "CREATE POLICY \"Coach cache update\" ON coach_cache FOR UPDATE USING ( auth.uid() = user_id );",
  },
  substitutionEvents: {
    select: "CREATE POLICY \"Substitution events select\" ON substitution_events FOR SELECT USING ( auth.uid() = user_id );",
  },
  periodizationFrameworks: {
    select: "CREATE POLICY \"Periodization frameworks select\" ON periodization_frameworks FOR SELECT USING ( auth.uid() IN (SELECT user_id FROM plans WHERE plans.id = plan_id) );",
    insert: "CREATE POLICY \"Periodization frameworks insert\" ON periodization_frameworks FOR INSERT WITH CHECK ( auth.uid() IN (SELECT user_id FROM plans WHERE plans.id = plan_id) );",
    update: "CREATE POLICY \"Periodization frameworks update\" ON periodization_frameworks FOR UPDATE USING ( auth.uid() IN (SELECT user_id FROM plans WHERE plans.id = plan_id) );",
  },
  weekPerformanceSummaries: {
    select: "CREATE POLICY \"Week performance summaries select\" ON week_performance_summaries FOR SELECT USING ( auth.uid() IN (SELECT user_id FROM plans WHERE plans.id = plan_id) );",
    insert: "CREATE POLICY \"Week performance summaries insert\" ON week_performance_summaries FOR INSERT WITH CHECK ( auth.uid() IN (SELECT user_id FROM plans WHERE plans.id = plan_id) );",
    update: "CREATE POLICY \"Week performance summaries update\" ON week_performance_summaries FOR UPDATE USING ( auth.uid() IN (SELECT user_id FROM plans WHERE plans.id = plan_id) );",
  },
};

export type Profile = typeof profiles.$inferSelect;
export type ProfileInsert = typeof profiles.$inferInsert;
export type Plan = typeof plans.$inferSelect;
export type PlanInsert = typeof plans.$inferInsert;
export type PeriodizationFrameworkRow = typeof periodizationFrameworks.$inferSelect;
export type PeriodizationFrameworkInsert = typeof periodizationFrameworks.$inferInsert;
export type Workout = typeof workouts.$inferSelect;
export type WorkoutInsert = typeof workouts.$inferInsert;
export type WeekPerformanceSummary = typeof weekPerformanceSummaries.$inferSelect;
export type WeekPerformanceSummaryInsert = typeof weekPerformanceSummaries.$inferInsert;
