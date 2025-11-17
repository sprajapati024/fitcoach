-- ============================================================================
-- FitCoach Database Rollback: Restore Workout Tables
-- ============================================================================
--
-- PURPOSE:
--   This script rolls back the archive migration by moving all workout-related
--   tables from the 'archive' schema back to the 'public' schema.
--   Use this if you need to restore the workout functionality.
--
-- WHEN TO USE:
--   - Migration caused unexpected issues
--   - Need to restore workout functionality
--   - Testing the migration process
--
-- HOW TO RUN:
--   1. BACKUP YOUR DATABASE FIRST!
--      pg_dump -U your_user -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql
--
--   2. Run this rollback:
--      psql -U your_user -d your_database -f database-rollback.sql
--
--   3. Verify the rollback using the verification queries at the bottom
--
-- SAFETY MEASURES:
--   - Transaction wrapper ensures atomicity (all-or-nothing)
--   - Preserves all data, indexes, constraints, and foreign keys
--   - Restores coach_cache workout contexts to public schema
--
-- CAUTION:
--   - Only run this if the archive migration has been completed
--   - Ensure no application code changes have been deployed yet
--   - RLS policies will need to be recreated in the public schema
--
-- AUTHOR: FitCoach Team
-- DATE: 2025-11-17
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Verify Archive Schema Exists
-- ============================================================================
-- Ensure the archive schema exists before attempting rollback

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.schemata WHERE schema_name = 'archive'
    ) THEN
        RAISE EXCEPTION 'Archive schema does not exist. Migration may not have been run.';
    END IF;
END
$$;

-- ============================================================================
-- STEP 2: Restore plans table
-- ============================================================================
-- Restore the plans table first as it's referenced by other tables

ALTER TABLE archive.plans SET SCHEMA public;

COMMENT ON TABLE plans IS 'Workout plans and programming';

-- ============================================================================
-- STEP 3: Restore workouts table
-- ============================================================================

ALTER TABLE archive.workouts SET SCHEMA public;

COMMENT ON TABLE workouts IS 'Planned workout sessions';

-- ============================================================================
-- STEP 4: Restore workout_logs table
-- ============================================================================

ALTER TABLE archive.workout_logs SET SCHEMA public;

COMMENT ON TABLE workout_logs IS 'Workout session logs and performance data';

-- ============================================================================
-- STEP 5: Restore workout_log_sets table
-- ============================================================================

ALTER TABLE archive.workout_log_sets SET SCHEMA public;

COMMENT ON TABLE workout_log_sets IS 'Individual set data from workout logs';

-- ============================================================================
-- STEP 6: Restore periodization_frameworks table
-- ============================================================================

ALTER TABLE archive.periodization_frameworks SET SCHEMA public;

COMMENT ON TABLE periodization_frameworks IS 'Periodization frameworks defining workout plan progression strategies';

-- ============================================================================
-- STEP 7: Restore week_performance_summaries table
-- ============================================================================

ALTER TABLE archive.week_performance_summaries SET SCHEMA public;

COMMENT ON TABLE week_performance_summaries IS 'Weekly performance summaries and completion metrics';

-- ============================================================================
-- STEP 8: Restore progression_targets table
-- ============================================================================

ALTER TABLE archive.progression_targets SET SCHEMA public;

COMMENT ON TABLE progression_targets IS 'Weekly progression targets for workout plans';

-- ============================================================================
-- STEP 9: Restore user_exercises table
-- ============================================================================

ALTER TABLE archive.user_exercises SET SCHEMA public;

COMMENT ON TABLE user_exercises IS 'User exercise library and custom exercise definitions';

-- ============================================================================
-- STEP 10: Restore substitution_events table
-- ============================================================================

ALTER TABLE archive.substitution_events SET SCHEMA public;

COMMENT ON TABLE substitution_events IS 'Exercise substitution events from workout sessions';

-- ============================================================================
-- STEP 11: Restore coach_cache workout contexts
-- ============================================================================
-- Restore workout-related coach_cache entries back to public schema

-- First, verify the public coach_cache table exists
CREATE TABLE IF NOT EXISTS coach_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id uuid REFERENCES plans(id) ON DELETE CASCADE,
    context text NOT NULL,
    cache_key text NOT NULL,
    target_date date,
    payload jsonb NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT NOW()
);

-- Recreate unique index if needed
CREATE UNIQUE INDEX IF NOT EXISTS coach_cache_unique
    ON coach_cache(user_id, context, cache_key);

-- Update foreign key in archive.coach_cache to reference public.plans temporarily
ALTER TABLE archive.coach_cache
    DROP CONSTRAINT IF EXISTS coach_cache_plan_id_fkey;

ALTER TABLE archive.coach_cache
    ADD CONSTRAINT coach_cache_plan_id_fkey
    FOREIGN KEY (plan_id)
    REFERENCES public.plans(id)
    ON DELETE CASCADE;

-- Copy workout contexts back to public schema
INSERT INTO coach_cache (
    id, user_id, plan_id, context, cache_key,
    target_date, payload, expires_at, created_at
)
SELECT
    id, user_id, plan_id, context, cache_key,
    target_date, payload, expires_at, created_at
FROM archive.coach_cache
ON CONFLICT (user_id, context, cache_key) DO NOTHING;
-- Using ON CONFLICT to handle any duplicates that might exist

-- Drop the archived coach_cache table
DROP TABLE IF EXISTS archive.coach_cache CASCADE;

-- ============================================================================
-- STEP 12: Clean up archive schema if empty
-- ============================================================================
-- Check if archive schema has any remaining tables

DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'archive';

    IF table_count = 0 THEN
        -- No tables left, safe to drop the schema
        DROP SCHEMA archive;
        RAISE NOTICE 'Archive schema was empty and has been dropped';
    ELSE
        RAISE NOTICE 'Archive schema still contains % table(s) and was not dropped', table_count;
    END IF;
END
$$;

-- ============================================================================
-- Rollback Complete
-- ============================================================================

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries after the rollback to verify success.

-- Check that all workout tables are back in public schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'plans', 'workouts', 'workout_logs', 'workout_log_sets',
    'periodization_frameworks', 'week_performance_summaries',
    'progression_targets', 'user_exercises', 'substitution_events',
    'coach_cache'
  )
ORDER BY table_name;
-- Expected: 10 rows (all workout tables)

-- Check that archive schema is empty or removed
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'archive';
-- Expected: 0 rows (or schema doesn't exist)

-- Check row counts in restored tables
SELECT
    'plans' as table_name, COUNT(*) as row_count FROM plans
UNION ALL
SELECT 'workouts', COUNT(*) FROM workouts
UNION ALL
SELECT 'workout_logs', COUNT(*) FROM workout_logs
UNION ALL
SELECT 'workout_log_sets', COUNT(*) FROM workout_log_sets
UNION ALL
SELECT 'periodization_frameworks', COUNT(*) FROM periodization_frameworks
UNION ALL
SELECT 'week_performance_summaries', COUNT(*) FROM week_performance_summaries
UNION ALL
SELECT 'progression_targets', COUNT(*) FROM progression_targets
UNION ALL
SELECT 'user_exercises', COUNT(*) FROM user_exercises
UNION ALL
SELECT 'substitution_events', COUNT(*) FROM substitution_events
UNION ALL
SELECT 'coach_cache', COUNT(*) FROM coach_cache;
-- Compare these counts with your backup to ensure all data was restored

-- Check coach_cache contexts
SELECT
    context,
    COUNT(*) as count
FROM coach_cache
GROUP BY context
ORDER BY context;
-- Expected: Should include workout contexts (today, debrief, weekly, substitution)

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
    AND tc.table_schema = 'public'
    AND tc.table_name IN (
        'plans', 'workouts', 'workout_logs', 'workout_log_sets',
        'periodization_frameworks', 'week_performance_summaries',
        'progression_targets', 'user_exercises', 'substitution_events',
        'coach_cache'
    )
ORDER BY tc.table_name, kcu.column_name;
-- Expected: All foreign keys should be properly maintained

-- ============================================================================
-- POST-ROLLBACK TASKS
-- ============================================================================
-- After running this rollback and verifying success:
--
-- 1. Restore Application Code:
--    - Redeploy previous version with workout functionality
--    - Restore workout-related API endpoints
--    - Restore workout-related UI components
--
-- 2. Restore RLS Policies (if using Supabase/RLS):
--    - Recreate or verify RLS policies exist for all workout tables
--    - See supabase-rls-policies.sql for reference
--
-- 3. Update Documentation:
--    - Mark workout features as active again
--    - Document the rollback for future reference
--
-- 4. Monitor Application:
--    - Verify workout features work correctly
--    - Check for any data inconsistencies
--    - Test end-to-end workout flows
--
-- 5. Investigate Root Cause:
--    - Document why rollback was necessary
--    - Plan remediation for issues that caused rollback
--
-- ============================================================================
