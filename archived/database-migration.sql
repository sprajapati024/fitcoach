-- ============================================================================
-- FitCoach Database Migration: Archive Workout Tables
-- ============================================================================
--
-- PURPOSE:
--   This script moves all workout-related tables to an 'archive' schema,
--   preserving all data, constraints, indexes, and foreign key relationships.
--   This is part of the project redesign to focus solely on nutrition tracking.
--
-- TABLES TO ARCHIVE:
--   1. plans
--   2. workouts
--   3. workout_logs
--   4. workout_log_sets
--   5. periodization_frameworks
--   6. week_performance_summaries
--   7. progression_targets
--   8. user_exercises
--   9. substitution_events
--   10. coach_cache (workout contexts only)
--
-- HOW TO RUN:
--   1. BACKUP YOUR DATABASE FIRST!
--      pg_dump -U your_user -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql
--
--   2. Run this migration:
--      psql -U your_user -d your_database -f database-migration.sql
--
--   3. Verify the migration using the verification queries at the bottom
--
--   4. If rollback is needed, use database-rollback.sql
--
-- SAFETY MEASURES:
--   - Transaction wrapper ensures atomicity (all-or-nothing)
--   - Creates archive schema if it doesn't exist
--   - Preserves all data, indexes, constraints, and foreign keys
--   - Special handling for coach_cache to preserve non-workout data
--   - Includes verification queries to confirm success
--
-- CAUTION:
--   - This script assumes you're using PostgreSQL
--   - RLS policies will need to be recreated in the archive schema
--   - Application code must be updated before running this migration
--   - Foreign key references from users table will be preserved
--
-- AUTHOR: FitCoach Team
-- DATE: 2025-11-17
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Create Archive Schema
-- ============================================================================
-- Create a separate schema to hold archived workout-related tables
-- This keeps them accessible for historical queries but separates them
-- from active production tables.

CREATE SCHEMA IF NOT EXISTS archive;

COMMENT ON SCHEMA archive IS 'Contains archived workout-related tables from the fitness tracking feature that was redesigned';

-- ============================================================================
-- STEP 2: Archive coach_cache (Partial - Workout Contexts Only)
-- ============================================================================
-- Special handling for coach_cache: we only want to archive workout-related
-- contexts ('today', 'debrief', 'weekly', 'substitution').
-- Nutrition-related contexts remain in the public schema.

-- Create the archived coach_cache table structure
CREATE TABLE IF NOT EXISTS archive.coach_cache (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id uuid, -- Will be updated to reference archive.plans after plans is moved
    context text NOT NULL,
    cache_key text NOT NULL,
    target_date date,
    payload jsonb NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL
);

-- Create index for performance
CREATE UNIQUE INDEX IF NOT EXISTS coach_cache_unique_archived
    ON archive.coach_cache(user_id, context, cache_key);

-- Copy only workout-related contexts to archive
INSERT INTO archive.coach_cache (
    id, user_id, plan_id, context, cache_key,
    target_date, payload, expires_at, created_at
)
SELECT
    id, user_id, plan_id, context, cache_key,
    target_date, payload, expires_at, created_at
FROM coach_cache
WHERE context IN ('today', 'debrief', 'weekly', 'substitution');

-- Delete workout-related contexts from the active table
DELETE FROM coach_cache
WHERE context IN ('today', 'debrief', 'weekly', 'substitution');

COMMENT ON TABLE archive.coach_cache IS 'Archived workout-related coach cache entries (contexts: today, debrief, weekly, substitution)';

-- ============================================================================
-- STEP 3: Archive substitution_events
-- ============================================================================
-- Move the entire substitution_events table to archive schema.
-- This table tracks exercise substitutions made during workouts.

ALTER TABLE substitution_events SET SCHEMA archive;

COMMENT ON TABLE archive.substitution_events IS 'Archived exercise substitution events from workout sessions';

-- ============================================================================
-- STEP 4: Archive user_exercises
-- ============================================================================
-- Move the entire user_exercises table to archive schema.
-- This table contains user-specific exercise definitions and customizations.

ALTER TABLE user_exercises SET SCHEMA archive;

COMMENT ON TABLE archive.user_exercises IS 'Archived user exercise library and custom exercise definitions';

-- ============================================================================
-- STEP 5: Archive progression_targets
-- ============================================================================
-- Move the entire progression_targets table to archive schema.
-- This table contains weekly progression targets for workout plans.

ALTER TABLE progression_targets SET SCHEMA archive;

COMMENT ON TABLE archive.progression_targets IS 'Archived weekly progression targets for workout plans';

-- ============================================================================
-- STEP 6: Archive week_performance_summaries
-- ============================================================================
-- Move the entire week_performance_summaries table to archive schema.
-- This table contains weekly performance metrics and completion statistics.

ALTER TABLE week_performance_summaries SET SCHEMA archive;

COMMENT ON TABLE archive.week_performance_summaries IS 'Archived weekly performance summaries and completion metrics';

-- ============================================================================
-- STEP 7: Archive periodization_frameworks
-- ============================================================================
-- Move the entire periodization_frameworks table to archive schema.
-- This table contains periodization strategies for workout plans.

ALTER TABLE periodization_frameworks SET SCHEMA archive;

COMMENT ON TABLE archive.periodization_frameworks IS 'Archived periodization frameworks defining workout plan progression strategies';

-- ============================================================================
-- STEP 8: Archive workout_log_sets
-- ============================================================================
-- Move the entire workout_log_sets table to archive schema.
-- This table contains individual set data (reps, weight, RPE) for logged workouts.

ALTER TABLE workout_log_sets SET SCHEMA archive;

COMMENT ON TABLE archive.workout_log_sets IS 'Archived individual set data from workout logs';

-- ============================================================================
-- STEP 9: Archive workout_logs
-- ============================================================================
-- Move the entire workout_logs table to archive schema.
-- This table contains workout session logs and overall session metrics.

ALTER TABLE workout_logs SET SCHEMA archive;

COMMENT ON TABLE archive.workout_logs IS 'Archived workout session logs and performance data';

-- ============================================================================
-- STEP 10: Archive workouts
-- ============================================================================
-- Move the entire workouts table to archive schema.
-- This table contains planned workout sessions with exercises and programming.

ALTER TABLE workouts SET SCHEMA archive;

COMMENT ON TABLE archive.workouts IS 'Archived planned workout sessions';

-- ============================================================================
-- STEP 11: Archive plans
-- ============================================================================
-- Move the entire plans table to archive schema.
-- This is the root table for workout plans and must be moved last
-- to preserve foreign key relationships.

ALTER TABLE plans SET SCHEMA archive;

COMMENT ON TABLE archive.plans IS 'Archived workout plans (root table for all workout-related data)';

-- ============================================================================
-- STEP 12: Update Foreign Key Reference in coach_cache
-- ============================================================================
-- Now that plans is in the archive schema, update the foreign key
-- constraint in archive.coach_cache to reference archive.plans

ALTER TABLE archive.coach_cache
    DROP CONSTRAINT IF EXISTS coach_cache_plan_id_fkey;

ALTER TABLE archive.coach_cache
    ADD CONSTRAINT coach_cache_plan_id_fkey
    FOREIGN KEY (plan_id)
    REFERENCES archive.plans(id)
    ON DELETE CASCADE;

-- ============================================================================
-- STEP 13: Update Enum Types
-- ============================================================================
-- Update the coach_context enum to remove workout-related contexts
-- since they're no longer used in the active schema

-- Note: PostgreSQL doesn't allow dropping enum values directly.
-- If strict enum cleanup is needed, you would need to:
-- 1. Create a new enum type without workout contexts
-- 2. Update all tables to use the new enum
-- 3. Drop the old enum
--
-- For safety, we'll leave the enum as-is. The values simply won't be used
-- in the active public.coach_cache table anymore.

COMMENT ON TYPE coach_context IS 'Coach context enum - workout contexts (today, debrief, weekly, substitution) are archived';

-- ============================================================================
-- Migration Complete
-- ============================================================================

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries after the migration to verify success.
-- All counts should match between archive and original.

-- Check that archive schema exists
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name = 'archive';
-- Expected: 1 row with 'archive'

-- Check all archived tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'archive'
ORDER BY table_name;
-- Expected: 10 tables (coach_cache, periodization_frameworks, plans,
--           progression_targets, substitution_events, user_exercises,
--           week_performance_summaries, workout_log_sets, workout_logs, workouts)

-- Check no workout tables remain in public schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'plans', 'workouts', 'workout_logs', 'workout_log_sets',
    'periodization_frameworks', 'week_performance_summaries',
    'progression_targets', 'user_exercises', 'substitution_events'
  );
-- Expected: 0 rows

-- Check coach_cache split correctly
SELECT
    'public' as schema,
    context,
    COUNT(*) as count
FROM coach_cache
GROUP BY context
UNION ALL
SELECT
    'archive' as schema,
    context,
    COUNT(*) as count
FROM archive.coach_cache
GROUP BY context
ORDER BY schema, context;
-- Expected: archive schema should have (today, debrief, weekly, substitution)
--           public schema should have no entries or only non-workout contexts

-- Check row counts in archive tables
SELECT
    'plans' as table_name, COUNT(*) as row_count FROM archive.plans
UNION ALL
SELECT 'workouts', COUNT(*) FROM archive.workouts
UNION ALL
SELECT 'workout_logs', COUNT(*) FROM archive.workout_logs
UNION ALL
SELECT 'workout_log_sets', COUNT(*) FROM archive.workout_log_sets
UNION ALL
SELECT 'periodization_frameworks', COUNT(*) FROM archive.periodization_frameworks
UNION ALL
SELECT 'week_performance_summaries', COUNT(*) FROM archive.week_performance_summaries
UNION ALL
SELECT 'progression_targets', COUNT(*) FROM archive.progression_targets
UNION ALL
SELECT 'user_exercises', COUNT(*) FROM archive.user_exercises
UNION ALL
SELECT 'substitution_events', COUNT(*) FROM archive.substitution_events
UNION ALL
SELECT 'coach_cache', COUNT(*) FROM archive.coach_cache;
-- Compare these counts with your backup to ensure all data was migrated

-- Check foreign key constraints are intact
SELECT
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'archive'
ORDER BY tc.table_name, kcu.column_name;
-- Expected: All foreign keys should be properly maintained

-- ============================================================================
-- POST-MIGRATION TASKS
-- ============================================================================
-- After running this migration and verifying success:
--
-- 1. Update Application Code:
--    - Remove all workout-related API endpoints
--    - Remove workout-related UI components
--    - Update any queries that referenced workout tables
--
-- 2. Update RLS Policies (if using Supabase/RLS):
--    - Recreate RLS policies in archive schema if historical access is needed
--    - Or rely on application-level access control
--
-- 3. Update Documentation:
--    - Mark workout features as archived
--    - Document how to access historical workout data
--
-- 4. Monitor Application:
--    - Watch for any errors related to missing tables
--    - Check logs for failed queries
--
-- 5. Backup Archive:
--    - Create a separate backup of the archive schema
--    - pg_dump -U user -d database -n archive > archive_backup.sql
--
-- ============================================================================
