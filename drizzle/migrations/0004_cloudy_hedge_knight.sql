CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack');--> statement-breakpoint
CREATE TYPE "public"."nutrition_coach_context" AS ENUM('meal_analysis', 'daily_summary', 'weekly_review', 'macro_guidance');--> statement-breakpoint
CREATE TABLE "daily_nutrition_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"summary_date" date NOT NULL,
	"total_calories" integer DEFAULT 0 NOT NULL,
	"total_protein" numeric(6, 1) DEFAULT 0 NOT NULL,
	"total_carbs" numeric(6, 1) DEFAULT 0 NOT NULL,
	"total_fat" numeric(6, 1) DEFAULT 0 NOT NULL,
	"total_fiber" numeric(6, 1) DEFAULT 0 NOT NULL,
	"total_water_ml" integer DEFAULT 0 NOT NULL,
	"meals_logged" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"meal_date" date NOT NULL,
	"meal_time" timestamp with time zone NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"description" text,
	"photo_url" text,
	"calories" integer,
	"protein_grams" numeric(5, 1),
	"carbs_grams" numeric(5, 1),
	"fat_grams" numeric(5, 1),
	"fiber_grams" numeric(5, 1),
	"notes" text,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition_coach_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"context" "nutrition_coach_context" NOT NULL,
	"cache_key" text NOT NULL,
	"target_date" date,
	"payload" jsonb NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"target_calories" integer,
	"target_protein_grams" numeric(5, 1),
	"target_carbs_grams" numeric(5, 1),
	"target_fat_grams" numeric(5, 1),
	"target_water_liters" numeric(3, 1),
	"calculation_method" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nutrition_goals_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "water_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"amount_ml" integer NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_nutrition_summaries" ADD CONSTRAINT "daily_nutrition_summaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_coach_cache" ADD CONSTRAINT "nutrition_coach_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD CONSTRAINT "nutrition_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "water_logs" ADD CONSTRAINT "water_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_nutrition_unique" ON "daily_nutrition_summaries" USING btree ("user_id","summary_date");--> statement-breakpoint
CREATE INDEX "meals_user_date_idx" ON "meals" USING btree ("user_id","meal_date");--> statement-breakpoint
CREATE UNIQUE INDEX "nutrition_coach_cache_unique" ON "nutrition_coach_cache" USING btree ("user_id","context","cache_key");--> statement-breakpoint
CREATE INDEX "water_logs_user_date_idx" ON "water_logs" USING btree ("user_id","log_date");