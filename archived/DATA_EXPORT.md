# FitCoach Workout Data - Export Guide

**Purpose:** Step-by-step guide for exporting your workout data from FitCoach
**Last Updated:** November 17, 2025
**Status:** Fully functional and tested

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Export Options](#export-options)
3. [Self-Service SQL Queries](#self-service-sql-queries)
4. [CSV Export Scripts](#csv-export-scripts)
5. [API-Based Export](#api-based-export)
6. [Data Schema Reference](#data-schema-reference)
7. [Troubleshooting](#troubleshooting)
8. [Privacy & Data Deletion](#privacy--data-deletion)

---

## Quick Start

**I just want my workout data as a CSV file!**

Follow these steps:

1. **Get your User ID:**
   - Log into FitCoach
   - Open browser console (F12)
   - Type: `localStorage.getItem('supabase.auth.token')`
   - Copy the `sub` field (your user ID)

2. **Contact support:**
   - Email: support@fitcoach.app
   - Subject: "Workout Data Export Request"
   - Include your User ID
   - Response time: Within 48 hours

3. **Receive your data:**
   - You'll receive a ZIP file containing:
     - `plans.csv` - Your workout plans
     - `workouts.csv` - All workouts
     - `workout_logs.csv` - Your logged sessions
     - `workout_sets.csv` - Every set you logged
     - `summary.txt` - Overview of your data

**OR** use the self-service SQL queries below if you have database access.

---

## Export Options

### Option 1: Self-Service SQL (Recommended)

**Best for:** Users comfortable with SQL, database administrators

**Requirements:**
- PostgreSQL access (via Supabase dashboard or direct connection)
- Your User ID (see Quick Start)

**Pros:**
- Immediate access
- Full control over queries
- Can export specific date ranges
- No waiting for support

**Cons:**
- Requires SQL knowledge
- Database access needed

**See:** [Self-Service SQL Queries](#self-service-sql-queries)

---

### Option 2: CSV Export Scripts

**Best for:** Developers, technical users

**Requirements:**
- Node.js installed
- Database connection string
- Basic command-line knowledge

**Pros:**
- Automated export
- Multiple format options (CSV, JSON, Excel)
- Can schedule regular exports

**Cons:**
- Requires setup
- Technical knowledge

**See:** [CSV Export Scripts](#csv-export-scripts)

---

### Option 3: Support Request

**Best for:** Non-technical users

**Requirements:**
- Valid FitCoach account
- Your User ID (or email address)

**Pros:**
- No technical knowledge required
- Guaranteed accurate export
- Includes explanatory documentation

**Cons:**
- 24-48 hour wait time
- Less flexibility in customization

**Contact:** support@fitcoach.app

---

### Option 4: API-Based Export

**Best for:** Developers building integrations

**Requirements:**
- Active FitCoach session token
- API knowledge (REST, authentication)

**Pros:**
- Programmatic access
- Real-time data
- Can build custom tools

**Cons:**
- Requires coding
- Rate limited

**See:** [API-Based Export](#api-based-export)

---

## Self-Service SQL Queries

### Prerequisites

1. **Access Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
   - Or connect directly via `psql` or PostgreSQL client

2. **Get Your User ID:**
   ```sql
   -- Find your user ID by email
   SELECT id FROM users WHERE email = 'your-email@example.com';
   ```

3. **Copy your user ID** (UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

---

### Query 1: Export All Workout Plans

```sql
-- Export all your workout plans
SELECT
  p.id AS plan_id,
  p.title,
  p.summary,
  p.status,
  p.active,
  p.start_date,
  p.duration_weeks,
  p.days_per_week,
  p.minutes_per_session,
  p.generated_by,
  p.created_at,
  p.updated_at
FROM plans p
WHERE p.user_id = 'YOUR_USER_ID_HERE'
ORDER BY p.created_at DESC;
```

**CSV Export:**
```sql
-- Same query but formatted for CSV export
COPY (
  SELECT
    p.id AS plan_id,
    p.title,
    p.summary,
    p.status,
    p.active,
    p.start_date,
    p.duration_weeks,
    p.days_per_week,
    p.minutes_per_session,
    p.generated_by,
    p.created_at,
    p.updated_at
  FROM plans p
  WHERE p.user_id = 'YOUR_USER_ID_HERE'
  ORDER BY p.created_at DESC
) TO '/tmp/fitcoach_plans.csv' WITH CSV HEADER;
```

**Expected Output:**
```
plan_id,title,summary,status,active,start_date,duration_weeks,days_per_week,minutes_per_session,generated_by,created_at,updated_at
abc-123,12-Week Strength,4 days/week...,completed,false,2025-01-06,12,4,60,planner,2025-01-05 10:30:00,2025-04-01 18:45:00
```

---

### Query 2: Export All Workouts from a Plan

```sql
-- Export all workouts from a specific plan
SELECT
  w.id AS workout_id,
  w.week_number,
  w.day_index,
  w.session_date,
  w.title,
  w.focus,
  w.kind,
  w.is_deload,
  w.duration_minutes,
  w.week_status,
  w.coaching_notes
FROM workouts w
WHERE w.plan_id = 'YOUR_PLAN_ID_HERE'
ORDER BY w.week_index, w.day_index;
```

**Export with Exercise Details:**
```sql
-- Export workouts with full exercise breakdown
SELECT
  w.id AS workout_id,
  w.week_number,
  w.session_date,
  w.title,
  w.focus,
  -- Extract exercise data from JSON payload
  jsonb_array_elements(w.payload->'blocks') AS block,
  jsonb_array_elements(jsonb_array_elements(w.payload->'blocks')->'exercises') AS exercise
FROM workouts w
WHERE w.plan_id = 'YOUR_PLAN_ID_HERE'
ORDER BY w.week_index, w.day_index;
```

---

### Query 3: Export All Logged Workouts

```sql
-- Export all your logged workout sessions
SELECT
  wl.id AS log_id,
  wl.session_date,
  wl.performed_at,
  w.title AS workout_title,
  w.focus,
  p.title AS plan_title,
  wl.rpe_last_set AS overall_rpe,
  wl.total_duration_minutes,
  wl.notes,
  -- Count total sets logged
  COUNT(wls.id) AS total_sets
FROM workout_logs wl
JOIN workouts w ON w.id = wl.workout_id
JOIN plans p ON p.id = wl.plan_id
LEFT JOIN workout_log_sets wls ON wls.log_id = wl.id
WHERE wl.user_id = 'YOUR_USER_ID_HERE'
GROUP BY wl.id, w.title, w.focus, p.title
ORDER BY wl.session_date DESC;
```

**CSV Export:**
```sql
COPY (
  SELECT
    wl.id AS log_id,
    wl.session_date,
    wl.performed_at,
    w.title AS workout_title,
    w.focus,
    p.title AS plan_title,
    wl.rpe_last_set AS overall_rpe,
    wl.total_duration_minutes,
    wl.notes,
    COUNT(wls.id) AS total_sets
  FROM workout_logs wl
  JOIN workouts w ON w.id = wl.workout_id
  JOIN plans p ON p.id = wl.plan_id
  LEFT JOIN workout_log_sets wls ON wls.log_id = wl.id
  WHERE wl.user_id = 'YOUR_USER_ID_HERE'
  GROUP BY wl.id, w.title, w.focus, p.title
  ORDER BY wl.session_date DESC
) TO '/tmp/fitcoach_workout_logs.csv' WITH CSV HEADER;
```

**Expected Output:**
```
log_id,session_date,performed_at,workout_title,focus,plan_title,overall_rpe,total_duration_minutes,notes,total_sets
xyz-789,2025-04-01,2025-04-01 18:30:00,Upper Body - Push,Horizontal pressing,12-Week Strength,8.5,87,Felt strong,20
```

---

### Query 4: Export All Logged Sets (Detailed)

```sql
-- Export every single set you've logged
SELECT
  wl.session_date,
  w.title AS workout_title,
  wls.exercise_id,
  wls.set_index + 1 AS set_number,  -- Convert 0-based to 1-based
  wls.reps,
  wls.weight_kg,
  wls.rpe,
  wl.notes AS workout_notes
FROM workout_log_sets wls
JOIN workout_logs wl ON wl.id = wls.log_id
JOIN workouts w ON w.id = wl.workout_id
WHERE wl.user_id = 'YOUR_USER_ID_HERE'
ORDER BY wl.session_date DESC, wls.exercise_id, wls.set_index;
```

**CSV Export:**
```sql
COPY (
  SELECT
    wl.session_date,
    w.title AS workout_title,
    wls.exercise_id,
    wls.set_index + 1 AS set_number,
    wls.reps,
    wls.weight_kg,
    wls.rpe,
    wl.notes AS workout_notes
  FROM workout_log_sets wls
  JOIN workout_logs wl ON wl.id = wls.log_id
  JOIN workouts w ON w.id = wl.workout_id
  WHERE wl.user_id = 'YOUR_USER_ID_HERE'
  ORDER BY wl.session_date DESC, wls.exercise_id, wls.set_index
) TO '/tmp/fitcoach_workout_sets.csv' WITH CSV HEADER;
```

**Expected Output:**
```
session_date,workout_title,exercise_id,set_number,reps,weight_kg,rpe,workout_notes
2025-04-01,Upper Body - Push,barbell_bench_press,1,8,80.0,7.5,Felt strong
2025-04-01,Upper Body - Push,barbell_bench_press,2,8,80.0,8.0,Felt strong
2025-04-01,Upper Body - Push,barbell_bench_press,3,7,80.0,8.5,Felt strong
```

---

### Query 5: Export Exercise Personal Records (PRs)

```sql
-- Find your personal records for each exercise
WITH exercise_maxes AS (
  SELECT
    wls.exercise_id,
    MAX(wls.weight_kg) AS max_weight,
    MAX(wls.reps) AS max_reps,
    MAX(wls.weight_kg * wls.reps) AS max_volume
  FROM workout_log_sets wls
  JOIN workout_logs wl ON wl.id = wls.log_id
  WHERE wl.user_id = 'YOUR_USER_ID_HERE'
  GROUP BY wls.exercise_id
)
SELECT
  em.exercise_id,
  em.max_weight AS pr_weight_kg,
  em.max_reps AS pr_reps,
  em.max_volume AS pr_volume,
  -- Find the date of max weight
  (
    SELECT wl.session_date
    FROM workout_log_sets wls
    JOIN workout_logs wl ON wl.id = wls.log_id
    WHERE wls.exercise_id = em.exercise_id
      AND wls.weight_kg = em.max_weight
      AND wl.user_id = 'YOUR_USER_ID_HERE'
    ORDER BY wl.session_date DESC
    LIMIT 1
  ) AS pr_date
FROM exercise_maxes em
ORDER BY em.max_volume DESC;
```

**Expected Output:**
```
exercise_id,pr_weight_kg,pr_reps,pr_volume,pr_date
barbell_squat,120.0,10,1200,2025-03-25
barbell_bench_press,85.0,8,680,2025-04-01
barbell_deadlift,140.0,5,700,2025-03-20
```

---

### Query 6: Export Weekly Performance Summary

```sql
-- Export weekly performance metrics
SELECT
  wps.plan_id,
  p.title AS plan_title,
  wps.week_number,
  wps.completion_rate,
  wps.avg_rpe,
  wps.total_volume,
  wps.total_tonnage,
  wps.created_at
FROM week_performance_summaries wps
JOIN plans p ON p.id = wps.plan_id
WHERE p.user_id = 'YOUR_USER_ID_HERE'
ORDER BY wps.plan_id, wps.week_number;
```

---

### Query 7: Export Exercise Substitution History

```sql
-- Export all exercise substitutions you've made
SELECT
  se.created_at AS substitution_date,
  w.title AS workout_title,
  se.exercise_id AS original_exercise,
  se.replacement_ids AS replacement_exercises
FROM substitution_events se
JOIN workouts w ON w.id = se.workout_id
WHERE se.user_id = 'YOUR_USER_ID_HERE'
ORDER BY se.created_at DESC;
```

---

### Query 8: Export Custom Exercises

```sql
-- Export your custom exercises
SELECT
  ue.exercise_id,
  ue.name,
  ue.description,
  ue.equipment,
  ue.body_parts,
  ue.target_muscles,
  ue.exercise_type,
  ue.source,
  ue.is_pcos_safe,
  ue.impact_level,
  ue.created_at
FROM user_exercises ue
WHERE ue.user_id = 'YOUR_USER_ID_HERE'
ORDER BY ue.created_at DESC;
```

---

### Query 9: Complete Data Dump (All Tables)

```sql
-- Export everything in one query (may be large!)
-- PART 1: Plans
SELECT 'PLAN' AS data_type, p.* FROM plans p WHERE p.user_id = 'YOUR_USER_ID_HERE'
UNION ALL
-- PART 2: Workouts
SELECT 'WORKOUT' AS data_type, w.* FROM workouts w WHERE w.user_id = 'YOUR_USER_ID_HERE'
UNION ALL
-- PART 3: Workout Logs
SELECT 'LOG' AS data_type, wl.* FROM workout_logs wl WHERE wl.user_id = 'YOUR_USER_ID_HERE'
-- Note: Continue with other tables as needed
```

**Warning:** This query may be very large. Consider exporting tables separately.

---

## CSV Export Scripts

### Node.js Export Script

**Prerequisites:**
- Node.js 18+ installed
- Database connection string
- `pg` package installed

**Installation:**
```bash
# Create new directory
mkdir fitcoach-export
cd fitcoach-export

# Initialize npm project
npm init -y

# Install dependencies
npm install pg csv-writer dotenv
```

**Create `.env` file:**
```env
DATABASE_URL=postgresql://user:password@host:5432/fitcoach
USER_ID=your-user-id-here
```

**Create `export.js`:**
```javascript
require('dotenv').config();
const { Pool } = require('pg');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const userId = process.env.USER_ID;

async function exportPlans() {
  console.log('Exporting plans...');

  const result = await pool.query(`
    SELECT
      id AS plan_id,
      title,
      summary,
      status,
      active,
      start_date,
      duration_weeks,
      days_per_week,
      minutes_per_session,
      generated_by,
      created_at,
      updated_at
    FROM plans
    WHERE user_id = $1
    ORDER BY created_at DESC
  `, [userId]);

  const csvWriter = createCsvWriter({
    path: 'plans.csv',
    header: [
      { id: 'plan_id', title: 'Plan ID' },
      { id: 'title', title: 'Title' },
      { id: 'summary', title: 'Summary' },
      { id: 'status', title: 'Status' },
      { id: 'active', title: 'Active' },
      { id: 'start_date', title: 'Start Date' },
      { id: 'duration_weeks', title: 'Duration (weeks)' },
      { id: 'days_per_week', title: 'Days/Week' },
      { id: 'minutes_per_session', title: 'Minutes/Session' },
      { id: 'generated_by', title: 'Generated By' },
      { id: 'created_at', title: 'Created At' },
      { id: 'updated_at', title: 'Updated At' }
    ]
  });

  await csvWriter.writeRecords(result.rows);
  console.log(`✓ Exported ${result.rows.length} plans to plans.csv`);
}

async function exportWorkoutLogs() {
  console.log('Exporting workout logs...');

  const result = await pool.query(`
    SELECT
      wl.id AS log_id,
      wl.session_date,
      wl.performed_at,
      w.title AS workout_title,
      w.focus,
      p.title AS plan_title,
      wl.rpe_last_set AS overall_rpe,
      wl.total_duration_minutes,
      wl.notes
    FROM workout_logs wl
    JOIN workouts w ON w.id = wl.workout_id
    JOIN plans p ON p.id = wl.plan_id
    WHERE wl.user_id = $1
    ORDER BY wl.session_date DESC
  `, [userId]);

  const csvWriter = createCsvWriter({
    path: 'workout_logs.csv',
    header: [
      { id: 'log_id', title: 'Log ID' },
      { id: 'session_date', title: 'Session Date' },
      { id: 'performed_at', title: 'Performed At' },
      { id: 'workout_title', title: 'Workout Title' },
      { id: 'focus', title: 'Focus' },
      { id: 'plan_title', title: 'Plan Title' },
      { id: 'overall_rpe', title: 'Overall RPE' },
      { id: 'total_duration_minutes', title: 'Duration (min)' },
      { id: 'notes', title: 'Notes' }
    ]
  });

  await csvWriter.writeRecords(result.rows);
  console.log(`✓ Exported ${result.rows.length} workout logs to workout_logs.csv`);
}

async function exportWorkoutSets() {
  console.log('Exporting workout sets...');

  const result = await pool.query(`
    SELECT
      wl.session_date,
      w.title AS workout_title,
      wls.exercise_id,
      wls.set_index + 1 AS set_number,
      wls.reps,
      wls.weight_kg,
      wls.rpe
    FROM workout_log_sets wls
    JOIN workout_logs wl ON wl.id = wls.log_id
    JOIN workouts w ON w.id = wl.workout_id
    WHERE wl.user_id = $1
    ORDER BY wl.session_date DESC, wls.exercise_id, wls.set_index
  `, [userId]);

  const csvWriter = createCsvWriter({
    path: 'workout_sets.csv',
    header: [
      { id: 'session_date', title: 'Session Date' },
      { id: 'workout_title', title: 'Workout Title' },
      { id: 'exercise_id', title: 'Exercise ID' },
      { id: 'set_number', title: 'Set Number' },
      { id: 'reps', title: 'Reps' },
      { id: 'weight_kg', title: 'Weight (kg)' },
      { id: 'rpe', title: 'RPE' }
    ]
  });

  await csvWriter.writeRecords(result.rows);
  console.log(`✓ Exported ${result.rows.length} sets to workout_sets.csv`);
}

async function exportAll() {
  try {
    console.log('Starting FitCoach workout data export...\n');

    await exportPlans();
    await exportWorkoutLogs();
    await exportWorkoutSets();

    console.log('\n✅ Export complete! Files created:');
    console.log('  - plans.csv');
    console.log('  - workout_logs.csv');
    console.log('  - workout_sets.csv');

    await pool.end();
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

exportAll();
```

**Run the export:**
```bash
node export.js
```

**Output:**
```
Starting FitCoach workout data export...

Exporting plans...
✓ Exported 3 plans to plans.csv
Exporting workout logs...
✓ Exported 42 workout logs to workout_logs.csv
Exporting workout sets...
✓ Exported 840 sets to workout_sets.csv

✅ Export complete! Files created:
  - plans.csv
  - workout_logs.csv
  - workout_sets.csv
```

---

### Python Export Script

**Prerequisites:**
- Python 3.8+ installed
- `psycopg2` and `pandas` packages

**Installation:**
```bash
pip install psycopg2-binary pandas python-dotenv
```

**Create `export.py`:**
```python
import os
import pandas as pd
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
USER_ID = os.getenv('USER_ID')

def export_to_csv(query, filename, user_id):
    """Execute query and export to CSV"""
    conn = psycopg2.connect(DATABASE_URL)

    try:
        df = pd.read_sql_query(query, conn, params=(user_id,))
        df.to_csv(filename, index=False)
        print(f"✓ Exported {len(df)} rows to {filename}")
    finally:
        conn.close()

def main():
    print("Starting FitCoach workout data export...\n")

    # Export plans
    export_to_csv("""
        SELECT
            id AS plan_id,
            title,
            summary,
            status,
            active,
            start_date,
            duration_weeks,
            days_per_week,
            minutes_per_session,
            generated_by,
            created_at,
            updated_at
        FROM plans
        WHERE user_id = %s
        ORDER BY created_at DESC
    """, 'plans.csv', USER_ID)

    # Export workout logs
    export_to_csv("""
        SELECT
            wl.id AS log_id,
            wl.session_date,
            wl.performed_at,
            w.title AS workout_title,
            w.focus,
            p.title AS plan_title,
            wl.rpe_last_set AS overall_rpe,
            wl.total_duration_minutes,
            wl.notes
        FROM workout_logs wl
        JOIN workouts w ON w.id = wl.workout_id
        JOIN plans p ON p.id = wl.plan_id
        WHERE wl.user_id = %s
        ORDER BY wl.session_date DESC
    """, 'workout_logs.csv', USER_ID)

    # Export workout sets
    export_to_csv("""
        SELECT
            wl.session_date,
            w.title AS workout_title,
            wls.exercise_id,
            wls.set_index + 1 AS set_number,
            wls.reps,
            wls.weight_kg,
            wls.rpe
        FROM workout_log_sets wls
        JOIN workout_logs wl ON wl.id = wls.log_id
        JOIN workouts w ON w.id = wl.workout_id
        WHERE wl.user_id = %s
        ORDER BY wl.session_date DESC, wls.exercise_id, wls.set_index
    """, 'workout_sets.csv', USER_ID)

    print("\n✅ Export complete!")

if __name__ == '__main__':
    main()
```

**Run:**
```bash
python export.py
```

---

## API-Based Export

### Using the Archived API Endpoints

**Note:** API endpoints are archived but still functional if you have a valid session token.

### Get Session Token

```javascript
// In browser console on FitCoach app
const token = localStorage.getItem('supabase.auth.token');
const parsed = JSON.parse(token);
console.log('Access Token:', parsed.access_token);
```

### Fetch Workout Logs via API

```bash
# Using curl
curl -X GET \
  'https://fitcoach.app/api/workouts/YOUR_WORKOUT_ID/history?exerciseId=barbell_bench_press' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

```javascript
// Using JavaScript
async function fetchWorkoutHistory(workoutId, exerciseId) {
  const token = localStorage.getItem('supabase.auth.token');
  const { access_token } = JSON.parse(token);

  const response = await fetch(
    `/api/workouts/${workoutId}/history?exerciseId=${exerciseId}`,
    {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    }
  );

  const data = await response.json();
  return data;
}

// Usage
const history = await fetchWorkoutHistory('workout-uuid', 'barbell_bench_press');
console.log(history);
```

### Download All Workout Logs

```javascript
async function exportAllWorkoutLogs() {
  const token = localStorage.getItem('supabase.auth.token');
  const { access_token } = JSON.parse(token);

  // This endpoint is archived but functional
  const response = await fetch('/api/log/export', {
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  });

  const logs = await response.json();

  // Convert to CSV
  const csv = convertToCSV(logs);

  // Download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'workout_logs.csv';
  a.click();
}

function convertToCSV(data) {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(','));
  return [headers, ...rows].join('\n');
}
```

---

## Data Schema Reference

### Table Relationships

```
users
└── plans (1:many)
    ├── periodization_frameworks (1:1)
    ├── progression_targets (1:many, by week)
    ├── week_performance_summaries (1:many, by week)
    └── workouts (1:many)
        └── workout_logs (1:many)
            └── workout_log_sets (1:many)
```

### Field Descriptions

#### `plans` Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique plan identifier |
| `user_id` | UUID | Owner of the plan |
| `title` | TEXT | Plan name (e.g., "12-Week Strength") |
| `summary` | TEXT | AI-generated description |
| `status` | ENUM | draft \| active \| completed \| archived |
| `active` | BOOLEAN | Only one plan can be active |
| `start_date` | DATE | When plan started |
| `duration_weeks` | INTEGER | Total weeks (4-16) |
| `days_per_week` | INTEGER | Training frequency (3-6) |
| `minutes_per_session` | INTEGER | Target duration (30-120) |
| `microcycle` | JSONB | Template pattern (see ARCHITECTURE.md) |
| `calendar` | JSONB | Full workout schedule |
| `generated_by` | TEXT | planner \| adaptive \| custom |

#### `workouts` Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique workout identifier |
| `plan_id` | UUID | Parent plan |
| `user_id` | UUID | Owner |
| `week_number` | INTEGER | Week in plan (1-16) |
| `day_index` | INTEGER | Day of week (0-6, Mon-Sun) |
| `session_date` | DATE | Scheduled date |
| `title` | TEXT | Workout name |
| `focus` | TEXT | Focus area (e.g., "Upper Push") |
| `kind` | ENUM | strength \| conditioning \| mobility |
| `is_deload` | BOOLEAN | True if deload week |
| `duration_minutes` | INTEGER | Target duration |
| `payload` | JSONB | Full workout structure |

#### `workout_logs` Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique log identifier |
| `user_id` | UUID | Logger |
| `plan_id` | UUID | Associated plan |
| `workout_id` | UUID | Workout that was logged |
| `session_date` | DATE | When performed |
| `performed_at` | TIMESTAMP | Exact completion time |
| `rpe_last_set` | NUMERIC | Overall RPE (1-10) |
| `total_duration_minutes` | INTEGER | Actual duration |
| `notes` | TEXT | User notes |

#### `workout_log_sets` Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique set identifier |
| `log_id` | UUID | Parent workout log |
| `exercise_id` | TEXT | Exercise performed |
| `set_index` | INTEGER | Set number (0-based) |
| `reps` | INTEGER | Reps completed |
| `weight_kg` | NUMERIC | Weight used (kg) |
| `rpe` | NUMERIC | Set RPE (1-10) |

---

## Troubleshooting

### Error: "Permission denied for table plans"

**Cause:** Your database user lacks SELECT permissions.

**Solution:**
```sql
-- Grant read permissions (run as admin)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO your_username;
```

---

### Error: "Cannot export to /tmp/ - permission denied"

**Cause:** PostgreSQL user lacks write permissions to `/tmp/`.

**Solution:**
```sql
-- Option 1: Export to different directory
COPY (...) TO '/home/yourusername/fitcoach_export.csv' WITH CSV HEADER;

-- Option 2: Use \COPY in psql client (runs on client side)
\copy (...) to 'local_file.csv' with csv header;
```

---

### Error: "User ID not found"

**Cause:** Incorrect user ID or typo.

**Solution:**
```sql
-- Verify user exists
SELECT id, email FROM users WHERE email = 'your-email@example.com';

-- Double-check the UUID has no extra spaces
SELECT id FROM users WHERE id = TRIM('your-user-id-here');
```

---

### Empty Results (No Data Returned)

**Cause:** No workout data for that user.

**Solution:**
```sql
-- Check if you have any plans
SELECT COUNT(*) FROM plans WHERE user_id = 'YOUR_USER_ID';

-- Check if you have any logs
SELECT COUNT(*) FROM workout_logs WHERE user_id = 'YOUR_USER_ID';

-- If counts are 0, you have no workout data to export
```

---

### Export File Too Large

**Cause:** Too much data for single export.

**Solution:**
```sql
-- Export by date range
SELECT * FROM workout_logs
WHERE user_id = 'YOUR_USER_ID'
  AND session_date BETWEEN '2025-01-01' AND '2025-03-31';

-- Export by plan
SELECT * FROM workout_logs
WHERE plan_id = 'SPECIFIC_PLAN_ID';
```

---

## Privacy & Data Deletion

### Request Data Deletion

**Under GDPR, you have the right to request deletion of your workout data.**

**To request deletion:**
1. Email: support@fitcoach.app
2. Subject: "Workout Data Deletion Request (GDPR)"
3. Include your User ID or email address
4. Specify what to delete:
   - All workout data (plans, logs, sets)
   - Specific plans only
   - Data older than certain date

**Deletion timeline:**
- Acknowledged within 24 hours
- Deleted within 30 days
- Confirmation email sent when complete

**What gets deleted:**
- Your plans
- Your workouts
- Your workout logs
- Your workout sets
- Your custom exercises
- Your exercise substitution history

**What is NOT deleted (retention for legal/security):**
- User account (use separate account deletion request)
- Audit logs (anonymized after 90 days)
- Aggregated analytics (no personal identifiers)

---

### Export Before Deletion

**We recommend exporting your data before requesting deletion.**

1. **Export data** using any method above
2. **Verify exports** are complete
3. **Request deletion**
4. **Download exports** within 30 days (link expires)

---

### Data Retention Policy

- **Active users:** Data retained indefinitely
- **Inactive users (>2 years):** Data retained, account may be deactivated
- **Deleted accounts:** Data deleted within 30 days, backups purged after 90 days
- **Export requests:** Export files stored for 30 days, then deleted

---

## Contact & Support

### Questions About Your Data?

**Email:** support@fitcoach.app
**Response Time:** Within 48 hours (business days)

### Technical Issues with Export?

**GitHub Issues:** https://github.com/fitcoach/app/issues
**Tag:** `@archived-features` `data-export`

### Need Custom Export?

If you need a custom export format or specific data not covered in this guide:
- Email support with your requirements
- We'll provide a custom SQL query or script
- No additional cost

---

## Summary

**Three Ways to Export Your Workout Data:**

1. **SQL Queries** (Immediate, requires database access)
   - Use queries in [Self-Service SQL](#self-service-sql-queries)
   - Export to CSV with `COPY` command

2. **Export Scripts** (Automated, requires technical setup)
   - Use Node.js or Python scripts in [CSV Export Scripts](#csv-export-scripts)
   - Run on your machine, outputs CSV files

3. **Support Request** (Easiest, 24-48 hour wait)
   - Email: support@fitcoach.app
   - Receive ZIP file with all your data

**All workout data is preserved and accessible.**
**You own your data and can export it at any time.**

---

_For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md)_
_For archive overview, see [README.md](./README.md)_
