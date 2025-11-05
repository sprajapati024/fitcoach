CREATE TABLE "user_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"exercise_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"instructions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image_url" text,
	"video_url" text,
	"gif_url" text,
	"equipment" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"body_parts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"target_muscles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"secondary_muscles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"exercise_type" text,
	"source" text NOT NULL,
	"is_pcos_safe" boolean DEFAULT true NOT NULL,
	"impact_level" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_exercises" ADD CONSTRAINT "user_exercises_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_exercises_user_idx" ON "user_exercises" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_exercises_unique" ON "user_exercises" USING btree ("user_id","exercise_id");