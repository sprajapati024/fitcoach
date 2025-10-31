CREATE TYPE "public"."coach_context" AS ENUM('today', 'debrief', 'weekly', 'substitution');--> statement-breakpoint
CREATE TYPE "public"."coach_tone" AS ENUM('concise', 'friendly');--> statement-breakpoint
CREATE TYPE "public"."experience_level" AS ENUM('beginner', 'intermediate');--> statement-breakpoint
CREATE TYPE "public"."goal_bias" AS ENUM('strength', 'balanced', 'hypertrophy', 'fat_loss');--> statement-breakpoint
CREATE TYPE "public"."plan_status" AS ENUM('draft', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('female', 'male', 'non_binary', 'unspecified');--> statement-breakpoint
CREATE TYPE "public"."unit_system" AS ENUM('metric', 'imperial');--> statement-breakpoint
CREATE TYPE "public"."workout_kind" AS ENUM('strength', 'conditioning', 'mobility', 'mixed');--> statement-breakpoint
CREATE TABLE "coach_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid,
	"context" "coach_context" NOT NULL,
	"cache_key" text NOT NULL,
	"target_date" date,
	"payload" jsonb NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text DEFAULT 'FitCoach Plan' NOT NULL,
	"summary" text,
	"status" "plan_status" DEFAULT 'draft' NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"start_date" date,
	"duration_weeks" smallint NOT NULL,
	"days_per_week" smallint NOT NULL,
	"minutes_per_session" smallint NOT NULL,
	"preferred_days" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"microcycle" jsonb NOT NULL,
	"calendar" jsonb NOT NULL,
	"planner_version" text,
	"generated_by" text DEFAULT 'planner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"sex" "sex" DEFAULT 'unspecified' NOT NULL,
	"date_of_birth" date,
	"height_cm" numeric(5, 2),
	"weight_kg" numeric(5, 2),
	"unit_system" "unit_system" DEFAULT 'metric' NOT NULL,
	"has_pcos" boolean DEFAULT false NOT NULL,
	"experience_level" "experience_level" DEFAULT 'beginner' NOT NULL,
	"schedule_days_per_week" smallint,
	"schedule_minutes_per_session" smallint,
	"schedule_weeks" smallint,
	"preferred_days" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"equipment" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"avoid_list" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"no_high_impact" boolean DEFAULT false NOT NULL,
	"goal_bias" "goal_bias" DEFAULT 'balanced' NOT NULL,
	"coach_tone" "coach_tone" DEFAULT 'concise' NOT NULL,
	"coach_today_enabled" boolean DEFAULT true NOT NULL,
	"coach_debrief_enabled" boolean DEFAULT true NOT NULL,
	"coach_weekly_enabled" boolean DEFAULT true NOT NULL,
	"coach_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progression_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"week_index" smallint NOT NULL,
	"payload" jsonb NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "substitution_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"workout_id" uuid NOT NULL,
	"exercise_id" text NOT NULL,
	"replacement_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_log_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"log_id" uuid NOT NULL,
	"exercise_id" text NOT NULL,
	"set_index" smallint NOT NULL,
	"reps" smallint NOT NULL,
	"weight_kg" numeric(6, 2) NOT NULL,
	"rpe" numeric(4, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"workout_id" uuid NOT NULL,
	"session_date" date NOT NULL,
	"performed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rpe_last_set" numeric(4, 2),
	"total_duration_minutes" smallint,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"microcycle_day_id" text NOT NULL,
	"day_index" integer NOT NULL,
	"week_index" smallint NOT NULL,
	"session_date" date,
	"title" text NOT NULL,
	"focus" text NOT NULL,
	"kind" "workout_kind" DEFAULT 'strength' NOT NULL,
	"is_deload" boolean DEFAULT false NOT NULL,
	"duration_minutes" smallint NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coach_cache" ADD CONSTRAINT "coach_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_cache" ADD CONSTRAINT "coach_cache_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progression_targets" ADD CONSTRAINT "progression_targets_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "substitution_events" ADD CONSTRAINT "substitution_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "substitution_events" ADD CONSTRAINT "substitution_events_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "substitution_events" ADD CONSTRAINT "substitution_events_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_log_sets" ADD CONSTRAINT "workout_log_sets_log_id_workout_logs_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."workout_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coach_cache_unique" ON "coach_cache" USING btree ("user_id","context","cache_key");--> statement-breakpoint
CREATE INDEX "plans_user_idx" ON "plans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "plans_active_idx" ON "plans" USING btree ("user_id","active");--> statement-breakpoint
CREATE UNIQUE INDEX "progression_targets_idx" ON "progression_targets" USING btree ("plan_id","week_index");--> statement-breakpoint
CREATE INDEX "substitution_events_user_idx" ON "substitution_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "workout_log_sets_idx" ON "workout_log_sets" USING btree ("log_id","exercise_id");--> statement-breakpoint
CREATE INDEX "workout_logs_user_idx" ON "workout_logs" USING btree ("user_id","session_date");--> statement-breakpoint
CREATE INDEX "workouts_plan_idx" ON "workouts" USING btree ("plan_id","week_index","day_index");