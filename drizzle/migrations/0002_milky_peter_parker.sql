CREATE TYPE "public"."block_type" AS ENUM('accumulation', 'intensification', 'deload', 'realization');--> statement-breakpoint
CREATE TYPE "public"."week_status" AS ENUM('pending', 'active', 'completed');--> statement-breakpoint
CREATE TABLE "periodization_frameworks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"framework" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "periodization_frameworks_plan_id_unique" UNIQUE("plan_id")
);
--> statement-breakpoint
CREATE TABLE "week_performance_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"week_number" smallint NOT NULL,
	"completion_rate" numeric(5, 2) NOT NULL,
	"avg_rpe" numeric(4, 2),
	"total_volume" integer DEFAULT 0 NOT NULL,
	"total_tonnage" numeric(10, 2) DEFAULT 0 NOT NULL,
	"metrics" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "week_number" smallint NOT NULL;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "week_status" "week_status" DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "generation_context" jsonb;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "coaching_notes" text;--> statement-breakpoint
ALTER TABLE "periodization_frameworks" ADD CONSTRAINT "periodization_frameworks_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "week_performance_summaries" ADD CONSTRAINT "week_performance_summaries_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "periodization_frameworks_plan_idx" ON "periodization_frameworks" USING btree ("plan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "week_performance_summaries_idx" ON "week_performance_summaries" USING btree ("plan_id","week_number");--> statement-breakpoint
CREATE INDEX "workouts_week_status_idx" ON "workouts" USING btree ("plan_id","week_number","week_status");