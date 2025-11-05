-- =====================================================
-- FitCoach: User Exercises Table Migration
-- =====================================================
-- This script creates the user_exercises table and applies RLS policies
-- Run this in your Supabase SQL Editor to fix the 500 error on /api/exercises
--
-- Date: 2025-11-05
-- Migration: 0003_great_sauron (user_exercises table)
-- =====================================================

-- Step 1: Create the user_exercises table
-- =====================================================

CREATE TABLE IF NOT EXISTS "user_exercises" (
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

-- Step 2: Add foreign key constraint
-- =====================================================

ALTER TABLE "user_exercises"
ADD CONSTRAINT "user_exercises_user_id_users_id_fk"
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
ON DELETE cascade
ON UPDATE no action;

-- Step 3: Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS "user_exercises_user_idx"
ON "user_exercises" USING btree ("user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "user_exercises_unique"
ON "user_exercises" USING btree ("user_id","exercise_id");

-- Step 4: Enable Row Level Security
-- =====================================================

ALTER TABLE "user_exercises" ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies
-- =====================================================

-- Allow users to view their own exercises
CREATE POLICY "User exercises select"
ON "user_exercises"
FOR SELECT
USING ( auth.uid() = user_id );

-- Allow users to add exercises to their library
CREATE POLICY "User exercises insert"
ON "user_exercises"
FOR INSERT
WITH CHECK ( auth.uid() = user_id );

-- Allow users to remove exercises from their library
CREATE POLICY "User exercises delete"
ON "user_exercises"
FOR DELETE
USING ( auth.uid() = user_id );

-- Step 6: Verification Queries
-- =====================================================

-- Check if table was created
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'user_exercises'
  ) THEN '✅ Table user_exercises created successfully'
  ELSE '❌ Table user_exercises not found'
  END AS table_status;

-- Check if RLS is enabled
SELECT
  CASE WHEN relrowsecurity THEN '✅ RLS enabled on user_exercises'
  ELSE '❌ RLS not enabled on user_exercises'
  END AS rls_status
FROM pg_class
WHERE relname = 'user_exercises';

-- Check policies
SELECT
  COUNT(*) as policy_count,
  CASE WHEN COUNT(*) = 3 THEN '✅ All 3 RLS policies created'
  ELSE '❌ Expected 3 policies, found ' || COUNT(*)
  END AS policy_status
FROM pg_policies
WHERE tablename = 'user_exercises';

-- List all policies
SELECT
  policyname,
  cmd,
  qual IS NOT NULL AS has_using,
  with_check IS NOT NULL AS has_check
FROM pg_policies
WHERE tablename = 'user_exercises'
ORDER BY policyname;
