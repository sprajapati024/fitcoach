ALTER TABLE "profiles" ALTER COLUMN "coach_tone" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "coach_tone" SET DEFAULT 'analyst'::text;--> statement-breakpoint
UPDATE "profiles" SET "coach_tone" = 'analyst' WHERE "coach_tone" = 'concise';--> statement-breakpoint
UPDATE "profiles" SET "coach_tone" = 'flirty' WHERE "coach_tone" = 'friendly';--> statement-breakpoint
DROP TYPE "public"."coach_tone";--> statement-breakpoint
CREATE TYPE "public"."coach_tone" AS ENUM('analyst', 'flirty');--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "coach_tone" SET DEFAULT 'analyst'::"public"."coach_tone";--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "coach_tone" SET DATA TYPE "public"."coach_tone" USING "coach_tone"::"public"."coach_tone";