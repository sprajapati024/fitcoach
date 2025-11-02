-- ============================================================================
-- FitCoach: RLS Policies for Adaptive Planning (Phase 1)
-- ============================================================================
--
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard > SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to apply all policies
--
-- This script creates Row Level Security policies for the new tables:
-- - periodization_frameworks
-- - week_performance_summaries
--
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE periodization_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_performance_summaries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PERIODIZATION FRAMEWORKS POLICIES
-- ============================================================================

-- Allow users to SELECT their own periodization frameworks
CREATE POLICY "Periodization frameworks select"
  ON periodization_frameworks
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id
      FROM plans
      WHERE plans.id = plan_id
    )
  );

-- Allow users to INSERT periodization frameworks for their own plans
CREATE POLICY "Periodization frameworks insert"
  ON periodization_frameworks
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id
      FROM plans
      WHERE plans.id = plan_id
    )
  );

-- Allow users to UPDATE their own periodization frameworks
CREATE POLICY "Periodization frameworks update"
  ON periodization_frameworks
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id
      FROM plans
      WHERE plans.id = plan_id
    )
  );

-- ============================================================================
-- WEEK PERFORMANCE SUMMARIES POLICIES
-- ============================================================================

-- Allow users to SELECT their own week performance summaries
CREATE POLICY "Week performance summaries select"
  ON week_performance_summaries
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id
      FROM plans
      WHERE plans.id = plan_id
    )
  );

-- Allow users to INSERT week performance summaries for their own plans
CREATE POLICY "Week performance summaries insert"
  ON week_performance_summaries
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id
      FROM plans
      WHERE plans.id = plan_id
    )
  );

-- Allow users to UPDATE their own week performance summaries
CREATE POLICY "Week performance summaries update"
  ON week_performance_summaries
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id
      FROM plans
      WHERE plans.id = plan_id
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the policies were created successfully:

-- Check RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('periodization_frameworks', 'week_performance_summaries');

-- Check policies exist
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('periodization_frameworks', 'week_performance_summaries')
ORDER BY tablename, policyname;

-- ============================================================================
-- EXPECTED OUTPUT:
-- ============================================================================
-- RLS enabled check should show:
--   periodization_frameworks    | true
--   week_performance_summaries  | true
--
-- Policies check should show 6 policies (3 per table):
--   - Periodization frameworks select
--   - Periodization frameworks insert
--   - Periodization frameworks update
--   - Week performance summaries select
--   - Week performance summaries insert
--   - Week performance summaries update
-- ============================================================================
