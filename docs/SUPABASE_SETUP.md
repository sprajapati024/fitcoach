# Supabase Manual Setup Steps

## Phase 1 Migration Complete ✅

The database schema has been successfully updated via Drizzle migrations. However, **RLS (Row Level Security) policies must be applied manually in Supabase**.

---

## Required Manual Steps

### Step 1: Apply RLS Policies

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your FitCoach project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run RLS Policies Script**
   - Open the file: `supabase-rls-policies.sql` (in project root)
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" to execute

4. **Verify Success**
   - The script includes verification queries at the bottom
   - Check that you see:
     - ✅ RLS enabled on both new tables
     - ✅ 6 policies created (3 per table)

---

## What Was Migrated

### New Database Objects:

**Enums:**
- `block_type`: accumulation | intensification | deload | realization
- `week_status`: pending | active | completed

**Tables:**
- `periodization_frameworks` - Stores training periodization structure
- `week_performance_summaries` - Tracks weekly performance metrics

**Updated Tables:**
- `workouts` - Added 4 new columns:
  - `week_number` (smallint, NOT NULL)
  - `week_status` (week_status enum, default 'pending')
  - `generation_context` (jsonb, nullable)
  - `coaching_notes` (text, nullable)

**Indexes:**
- `periodization_frameworks_plan_idx` on plan_id
- `week_performance_summaries_idx` on (plan_id, week_number) - UNIQUE
- `workouts_week_status_idx` on (plan_id, week_number, week_status)

**Foreign Keys:**
- periodization_frameworks.plan_id → plans.id
- week_performance_summaries.plan_id → plans.id

---

## Data Impact

⚠️ **The `workouts` table was truncated** (60 rows deleted) during migration to add the NOT NULL `week_number` column. This was expected for development/test data.

---

## Troubleshooting

### If RLS policies fail to apply:

1. **Check for existing policies:**
   ```sql
   SELECT policyname FROM pg_policies
   WHERE tablename IN ('periodization_frameworks', 'week_performance_summaries');
   ```

2. **Drop existing policies if needed:**
   ```sql
   DROP POLICY IF EXISTS "Periodization frameworks select" ON periodization_frameworks;
   -- Repeat for all 6 policies
   ```

3. **Re-run the RLS script**

### If tables don't exist:

1. **Verify migration was applied:**
   ```sql
   SELECT tablename FROM pg_tables
   WHERE tablename IN ('periodization_frameworks', 'week_performance_summaries');
   ```

2. **If tables are missing, re-run the migration:**
   ```bash
   DATABASE_URL="your_connection_string" npx drizzle-kit push --force
   ```

---

## Next Steps

After applying RLS policies:

1. ✅ Test that authenticated users can access their own data
2. ✅ Test that users cannot access other users' data
3. ✅ Proceed to Phase 2 of the implementation (Business Logic Modules)

---

## Migration Files

- Schema: `drizzle/schema.ts`
- Migration SQL: `drizzle/migrations/0002_milky_peter_parker.sql`
- RLS Policies: `supabase-rls-policies.sql`
- Implementation Plan: `docs/CoachAIplan.md`
