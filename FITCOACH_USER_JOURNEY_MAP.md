# FitCoach - Complete User Journey Map

## Application Overview
**FitCoach** is an AI-powered strength training application built with Next.js, React 19, Supabase, and OpenAI. It provides personalized workout plans, real-time logging, AI coaching, and progress tracking with offline-first capabilities. The app targets both general fitness enthusiasts and users with PCOS considerations.

**Tech Stack:**
- Frontend: Next.js 16, React 19, Tailwind CSS
- Backend: Node.js, Server Components
- Database: PostgreSQL (Drizzle ORM)
- Auth: Supabase (Google OAuth)
- AI: OpenAI Agents SDK
- Offline: IndexedDB + Service Worker
- External APIs: ExerciseDB

---

## 1. ONBOARDING FLOW

### Entry Point: Landing Page (`/`)
**Route:** `app/(public)/page.tsx`
**Access:** Unauthenticated users

#### Visual Design:
- Dark gradient background (gray-950 → black → gray-900)
- Animated hero section with cycling taglines
- Neural shimmer gradient CTA button
- Taglines rotate every 3 seconds:
  - "Learns your habits. Evolves your plan."
  - "Tracks every rep. Adapts every week."
  - "Offline-first. Train anywhere."
  - "Built for lifters. Backed by AI."

#### User Actions:
- **Click "Start Training"** → Google OAuth sign-in via Supabase
- Redirect to `api/auth/callback` → Redirects to `/onboarding` or `/dashboard`

---

### Onboarding Form (`/onboarding`)
**Route:** `app/(auth)/onboarding/page.tsx` + `OnboardingForm.tsx`
**Access:** Authenticated users without profile
**Middleware Guard:** Redirects unauthenticated users to `/`

#### Multi-Step Stepper (7 Steps)
1. **Basics** - Name, age, sex
2. **Body** - Height, weight, unit system (metric/imperial)
3. **Health** - PCOS flag, high-impact preferences
4. **Experience** - Training level (beginner/intermediate)
5. **Schedule** - Days/week, minutes/session, program duration (6-16 weeks)
6. **Equipment** - Available gear (barbell, dumbbells, cables, etc.)
7. **Goals** - Goal bias (strength/balanced/hypertrophy/fat_loss), coach tone

#### Key UI Elements:
- **Stepper component** showing progress
- **Card-based layout** for each step
- **Form validation** per step before advancing
- **Unit conversion** between metric/imperial
- **Toggle buttons** for multi-select options (days, equipment)
- **Back/Next navigation** with disabled states
- **Final: "Save & Continue"** button

#### Data Validation Rules:
| Field | Rules |
|-------|-------|
| Name | Required, non-empty |
| Age | 18-80 years |
| Height/Weight | Must be > 0 |
| Days/Week | 3-6 days |
| Preferred Days | Must match days/week count |
| Equipment | Minimum 1 selection |
| PCOS + No High Impact | Auto-enabled together if female + PCOS |

#### Data Flow:
```
User Input → Validation (per step) → State Management (React useState)
→ Final submission → saveProfileAction() → Server Action
→ INSERT INTO profiles (Supabase/Drizzle) → Redirect to /dashboard
```

#### Stored in Database:
```sql
profiles table:
- fullName, sex, dateOfBirth
- heightCm, weightKg, unitSystem
- hasPcos, noHighImpact
- experienceLevel
- scheduleDaysPerWeek, scheduleMinutesPerSession, scheduleWeeks
- preferredDays (JSONB array)
- equipment (JSONB array)
- avoidList (JSONB array)
- goalBias, coachTone
- coachTodayEnabled, coachDebriefEnabled, coachWeeklyEnabled
- coachNotes (custom instructions)
- timezone (auto-detected from browser)
```

#### Special Features:
- **PCOS Awareness:** If female + PCOS selected → disables high-impact work automatically
- **Zone 2 Focus:** PCOS users get biased toward steady-state cardio
- **Coach Customization:** Users can add custom notes for the AI coach
- **Timezone Detection:** Auto-detects user timezone from browser

---

## 2. DASHBOARD / TODAY VIEW

### Navigation Entry Point
**Route:** `app/(auth)/dashboard/page.tsx`
**Access:** Authenticated users with completed profile
**Layout:** Wrapped in `(auth)/layout.tsx` with DesktopNav + BottomNav

### Main Navigation Menu
```
Bottom Navigation (Mobile) / Desktop Sidebar:
- Today (home icon) → /dashboard
- Plan (calendar icon) → /plan
- Exercises (dumbbell icon) → /exercises
- Progress (chart icon) → /progress
- Settings (gear icon) → /settings
```

### Today View Component (`TodayView.tsx`)

#### No Workout Scheduled State:
```
┌─────────────────────────────────────┐
│         Today                        │
├─────────────────────────────────────┤
│    [Coach Brief Section]            │
├─────────────────────────────────────┤
│  No workout scheduled for today.    │
│  Enjoy the recovery—your body       │
│  adapts while you rest.             │
└─────────────────────────────────────┘
```

#### Workout Scheduled State:
```
┌──────────────────────────────────────┐
│  Today's Workout    Scheduled: Oct 15 │
├──────────────────────────────────────┤
│  [Feedback Alert - if any]           │
├──────────────────────────────────────┤
│  [Coach Brief Section]               │
├──────────────────────────────────────┤
│  Upper Body Hypertrophy              │
│  3 blocks · 60 min                   │
├──────────────────────────────────────┤
│ Block 1: Warmup                      │
│ • Dumbbell Bench Press: 3x10         │
│ • Tempo: 2-1-1                       │
│                                      │
│ Block 2: Primary Strength            │
│ • Barbell Bench Press: 4x6           │
│ • Incline Dumbbell Press: 3x8        │
│                                      │
│ Block 3: Accessories                 │
│ • Machine Fly: 3x12                  │
│ • Cable Curl: 3x10                   │
├──────────────────────────────────────┤
│ [Start Workout] (Primary Button)     │
├──────────────────────────────────────┤
│ Skip Today (Secondary)               │
└──────────────────────────────────────┘
```

### Coach Brief Component (`CoachBrief.tsx`)

**Fetches from:** `/api/coach/today?u={userId}`

#### Structure:
```
Coach Note
[Refresh Button] ↻

[Headline - bold, encouraging]
• Bullet point 1
• Bullet point 2
• Bullet point 3

Try this
• Prompt suggestion 1
• Prompt suggestion 2
```

#### Data Flow:
```
Component Mount
→ fetchBrief() calls /api/coach/today
→ Server checks coachCache table
→ If cached + valid: Return cached payload
→ If not cached or expired:
    - Get user profile + today's workout + recent logs
    - Build context with buildCoachContext()
    - Call OpenAI with coachSystemPrompt
    - Parse JSON response (headline, bullets, prompts)
    - Cache in coachCache table until 23:59:59
→ Display response or fallback text
```

#### Cache Strategy:
```sql
coachCache table:
- userId, planId, context='today'
- cacheKey (ISO date: YYYY-MM-DD)
- payload (JSON: {headline, bullets, prompts})
- expiresAt (end of day)
- Unique constraint: (userId, context, cacheKey)
```

#### Fallback Behavior:
- If API fails: Shows motivational default message
- "Ready to train? Focus on form and progressive overload today."
- Users can manually refresh to retry

---

### Workout Logging Component (`ExerciseLogger.tsx`)

**Triggered by:** Clicking "Start Workout" → Opens modal/overlay

#### Features:

1. **Multi-Exercise Flow:**
   - Shows current exercise (e.g., "Exercise 1 / 8")
   - Displays target sets × reps and tempo
   - Shows exercise cues/form tips

2. **Set Logging Form:**
   ```
   Set {N}
   ├─ Weight (kg) [number input]
   ├─ Reps [number input]
   ├─ RPE (5-10) [optional number]
   └─ Notes [optional text]
   ```

3. **Rest Timer:**
   - Auto-starts if exercise has `restSeconds` defined
   - Shows MM:SS countdown
   - User can skip/complete manually

4. **Set Management:**
   - Edit existing sets
   - Delete sets
   - Renumber automatically

5. **Navigation:**
   - Next Exercise button
   - Previous Exercise button
   - Track completed sets

6. **Completion:**
   - Requires at least 1 logged set
   - Final prompt: "Overall RPE (5-10)"
   - Validates all RPE values before submission

#### Data Structure:
```typescript
LogEntry {
  exerciseId: string
  set: number
  weight: number (kg)
  reps: number
  rpe?: number (5-10)
  notes?: string
}

WorkoutLogRequest {
  workoutId: string
  entries: LogEntry[]
  rpeLastSet: number
  skipReason?: string
  performedAt: ISO timestamp
}
```

#### Submission Flow:
```
User clicks "Complete Workout"
↓
Validation: ≥1 set logged, RPE valid
↓
Online check:
  ├─ If online: POST /api/log
  │  ├─ Success: Show "Workout logged. Nice work!"
  │  └─ Failure: Fallback to offline queue
  └─ If offline: enqueueLog() → IndexedDB
     └─ Show "Offline — workout saved. We will sync it once you are online."
↓
workoutLogs + workoutLogSets tables updated
↓
Router refresh → Dashboard updates
```

#### Offline Sync Mechanism:
```typescript
// Uses IDB (IndexedDB) + Background Sync API
flushQueue() when navigator.onLine = true
// Registers background sync tag: "fitcoach-log-sync"
```

### Skip Workout Flow:
```
User clicks "Skip Today"
↓
Dropdown appears: Select reason
  ├─ rest
  ├─ injury
  ├─ schedule
  ├─ fatigue
  └─ other
↓
"Confirm Skip" button (disabled until reason selected)
↓
Creates WorkoutLogRequest with entries: []
↓
Same offline/online flow as logging
```

---

## 3. PLAN GENERATION

### Plan Page (`/plan`)
**Route:** `app/(auth)/plan/page.tsx` + `PlanView.tsx`
**Fetches:**
- `getActivePlanAction()` → Active plan or null
- `getUserPlansAction()` → All user plans
- `getPlanWorkoutsAction()` → Workouts for active plan
- `getPlanWorkoutLogsAction()` → Logs for active plan

#### UI States:

**No Active Plan:**
```
┌──────────────────────────────┐
│  Your Training Plan          │
├──────────────────────────────┤
│  No active plan yet.         │
│  [Generate New Plan] Button  │
├──────────────────────────────┤
│  Previous Plans:             │
│  • Plan A (Draft)            │
│  • Plan B (Completed)        │
└──────────────────────────────┘
```

**Active Plan:**
```
┌──────────────────────────────┐
│  Your Training Plan (Active) │
├──────────────────────────────┤
│  📅 Plan Name                │
│  12 weeks | 4 days/week      │
│  Started: Oct 1              │
│                              │
│  Week 1: [progress bar]      │
│  Week 2: [workouts shown]    │
│  ...                         │
│                              │
│  [Generate Next Week] Button │
│  [Update Start Date]         │
│  [Calendar View]             │
└──────────────────────────────┘
```

### Plan Generation Process

**Trigger:** Click "[Generate New Plan]" button

#### Streaming Response (SSE):
```javascript
fetch('/api/plan/generate', { method: 'POST' })
  .then(response => response.body.getReader())
  .then(reader => readChunks())
  // Streams progress events:
  {
    type: 'progress',
    stage: 'initializing' | 'authenticating' | 'loading_profile' | 
           'analyzing' | 'querying' | 'retrying' | 'validating' | 
           'processing' | 'saving',
    message: 'Human-readable message',
    percent: 0-100
  }
```

#### Plan Generation Route (`/api/plan/generate`)

**Process Flow:**
```
1. Authentication
   ├─ Verify Supabase session
   └─ Send progress: "Verifying your account..." (5%)

2. Load Profile
   ├─ Fetch user profile from database
   ├─ Validate required fields:
   │  ├─ scheduleDaysPerWeek (3-6)
   │  ├─ scheduleMinutesPerSession (40-90)
   │  └─ scheduleWeeks (6-16)
   └─ Send progress: "Loading your profile..." (10%)

3. AI Planning Agent
   ├─ runPlannerAgent(userProfile)
   ├─ OpenAI Agents SDK with retry logic (max 2 attempts)
   ├─ Receives structured response:
   │  ├─ microcycle: Week structure with exercises
   │  ├─ warnings: Adjustments made (PCOS, equipment, etc.)
   │  └─ periodization: Block types (accumulation, intensification, deload, realization)
   └─ Send progress: "Finding suitable exercises..." (25%)

4. Post-Processing
   ├─ postProcessPlannerResponse():
   │  ├─ Enforce PCOS guardrails (Zone 2 volume, no high-impact)
   │  ├─ Check time budgets per session
   │  ├─ Validate exercise selections
   │  └─ Add form cues and technical notes
   └─ Send progress: "Processing your plan..." (75%)

5. Calendar Building
   ├─ expandPlannerResponseInitialWeek()
   ├─ Build PlanCalendar: Maps microcycle to actual dates
   ├─ Create workout entities with sessionDate
   └─ Send progress: "Building your calendar..." (85%)

6. Database Save
   ├─ Transactional insert:
   │  ├─ INSERT INTO plans
   │  ├─ INSERT INTO workouts (one per scheduled day)
   │  ├─ INSERT INTO periodizationFrameworks
   │  └─ INSERT INTO progressionTargets
   └─ Send progress: "Saving your plan..." (95%)

7. Completion
   └─ Send complete: {planId, title, durationWeeks, daysPerWeek}
```

#### AI System Prompt (plannerSystemPrompt):
```
Core Principles:
- Output compact JSON only
- Design 6-16 week programs
- 3-6 sessions/week, 40-90 min each
- Never assign weights (app handles progression)
- Respect PCOS guardrails
- Keep exercise cues short (<10 words), max 4 per exercise

Templates by Frequency:
- 3 days/week: Full Body (squat, hinge, push, pull, core)
- 4 days/week: Upper/Lower split
- 5-6 days/week: Push/Pull/Legs (PPL)

Exercise Selection by Experience:
- Beginner: Basic bilaterals (back squat, deadlift, bench, row)
- Intermediate: Variations + targeted accessories
- Advanced: Specialty techniques + periodization

Goal-Specific Sets/Reps:
- Strength: 3-5 sets × 3-6 reps, 3-5min rest
- Hypertrophy: 3-4 sets × 8-12 reps, 90-120s rest
- Balanced: 3-4 sets × 6-10 reps, 2-3min rest
- Fat Loss: 3-4 sets × 10-15 reps, 60-90s rest + conditioning

PCOS Guardrails:
- ≥2 Zone 2 cardio sessions/week (15-20 min)
- No high-impact plyometrics
- Intense intervals ≤60 seconds
- Prefer low-moderate impact exercises
```

### Plan Activation (`/plan` - activate step)

**User Actions:**
1. Select generated plan
2. Choose start date (date picker)
3. Click "[Activate Plan]"

**Process:**
```
activatePlanAction({planId, startDate})
  ↓
Deactivate all other plans for user
  ↓
Activate selected plan:
  ├─ buildPlanSchedule(plan, startDate, workouts)
  │  ├─ Calculate relative dates from startDate
  │  ├─ Build updated calendar with absolute dates
  │  └─ Return workoutUpdates with sessionDates
  ├─ Update plan: active=true, status='active', startDate, calendar
  └─ Batch update workout: sessionDate for each workout
  ↓
revalidatePath(/plan, /dashboard)
```

#### Plan Status Values:
- `draft` - Created but not activated
- `active` - Currently in use
- `completed` - All workouts logged
- `archived` - Finished, kept for reference

---

## 4. WORKOUT LOGGING (Detailed Flow)

### Daily Workflow:

**Morning:**
1. User opens app → Dashboard
2. Sees "Today's Workout" card (if scheduled)
3. Reads Coach Brief
4. Can view full workout structure
5. Clicks "Start Workout" or "Skip Today"

**During Workout:**
1. Exercise Logger displays current exercise
2. User logs each set: weight, reps, RPE
3. Rest timer counts down automatically
4. Can edit/delete previous sets
5. Navigate between exercises

**Post-Workout:**
1. Final screen: Rate overall effort (RPE)
2. Submit → Sync to server (or queue if offline)
3. Dashboard refreshes
4. Feedback message: "Workout logged. Nice work!"

### Data Storage:

**workoutLogs table:**
```sql
{
  id: UUID,
  userId: UUID,
  planId: UUID,
  workoutId: UUID,
  sessionDate: DATE,
  performedAt: TIMESTAMP,
  rpeLastSet: NUMERIC(4,2),
  totalDurationMinutes: SMALLINT,
  notes: TEXT,
  createdAt: TIMESTAMP
}
```

**workoutLogSets table:**
```sql
{
  id: UUID,
  logId: UUID,
  exerciseId: TEXT,
  setIndex: SMALLINT,
  reps: SMALLINT,
  weightKg: NUMERIC(6,2),
  rpe: NUMERIC(4,2),
  createdAt: TIMESTAMP
}
```

### Offline Handling:

**Scenario: User logs workout offline**

```
1. Workout Logger runs on client
2. On submit: Check navigator.onLine
3. If offline:
   ├─ enqueueLog(payload) → IndexedDB
   ├─ Show: "Offline — workout saved. Sync when online."
   └─ Store in 'fitcoach-offline' DB, 'logQueue' store

4. When back online:
   ├─ attachOnlineSync() listens for 'online' event
   ├─ flushQueue() processes each entry:
   │  ├─ POST /api/log for each entry
   │  ├─ On success: Delete from IndexedDB
   │  └─ On failure: Retain for retry
   └─ All synced workouts update progress

5. Service Worker:
   ├─ Registers background sync: "fitcoach-log-sync"
   └─ Retries syncing even if app closed
```

---

## 5. EXERCISE MANAGEMENT

### Exercise Library Page (`/exercises`)
**Route:** `app/(auth)/exercises/page.tsx`
**Component:** `ExerciseManagement.tsx`

#### Two-Tab Interface:

**Tab 1: My Library**
- Component: `MyExercises.tsx`
- Fetches: `GET /api/exercises`
- Lists all saved exercises with:
  - Name, equipment, target muscles
  - Delete option per exercise
  - Search/filter by body part, equipment
  - Video/GIF preview thumbnails

**Tab 2: Browse Exercises**
- Component: `ExerciseBrowser.tsx`
- Fetches: `GET /api/exercises/browse`
  - Hits ExerciseDB API for 1000+ exercises
  - Filters by: muscle group, equipment, difficulty
- Allows user to:
  - Search by name
  - Filter by equipment, target muscle, body part
  - View exercise details (description, instructions, images/videos/GIFs)
  - **Save to Library** → `POST /api/exercises`

#### Data Flow:

**Browse → Save Exercise:**
```
User selects exercise in Browse tab
  ↓
Click "Add to Library" button
  ↓
POST /api/exercises {
  exerciseId: string (external API ID),
  name: string,
  description: string,
  instructions: string[],
  imageUrl, videoUrl, gifUrl,
  equipment: string[],
  bodyParts: string[],
  targetMuscles: string[],
  secondaryMuscles: string[],
  exerciseType: string,
  source: 'exercisedb' | 'custom' | 'built-in',
  isPcosSafe: boolean,
  impactLevel: 'low' | 'moderate' | 'high'
}
  ↓
Check uniqueness: (userId, exerciseId)
  ↓
INSERT INTO userExercises
  ↓
Show: "Exercise added to your library"
  ↓
Update saved exercises list
```

**Delete Exercise:**
```
User clicks delete on exercise
  ↓
DELETE /api/exercises?exerciseId={id}
  ↓
DELETE FROM userExercises WHERE userId={id} AND exerciseId={exerciseId}
  ↓
Refresh list
```

#### userExercises Table:
```sql
{
  id: UUID,
  userId: UUID,
  exerciseId: TEXT (external ID),
  name: TEXT,
  description: TEXT,
  instructions: JSONB (array),
  imageUrl, videoUrl, gifUrl: TEXT,
  equipment: JSONB (array),
  bodyParts: JSONB (array),
  targetMuscles: JSONB (array),
  secondaryMuscles: JSONB (array),
  exerciseType: TEXT,
  source: TEXT ('exercisedb', 'custom', 'built-in'),
  isPcosSafe: BOOLEAN,
  impactLevel: TEXT ('low', 'moderate', 'high'),
  createdAt, updatedAt: TIMESTAMP,
  
  Unique: (userId, exerciseId)
}
```

#### PCOS-Safe Filtering:
- When hasPcos=true, exercises with impactLevel='high' are flagged
- Plan generation avoids high-impact exercises for PCOS users
- Users can still manually add any exercise

---

## 6. PROGRESS TRACKING

### Progress Page (`/progress`)
**Route:** `app/(auth)/progress/page.tsx`
**Access:** Authenticated users with profile

#### Data Fetching:
```sql
-- Get last 90 logged workouts
SELECT * FROM workoutLogs 
WHERE userId={id} 
ORDER BY sessionDate DESC, createdAt DESC 
LIMIT 90

-- Count total sets logged
SELECT COUNT(*) as totalSets FROM workoutLogSets
INNER JOIN workoutLogs ON workoutLogSets.logId = workoutLogs.id
WHERE workoutLogs.userId={id}
```

#### Summary Cards:

| Card | Calculation | Color |
|------|-------------|-------|
| Workouts Completed | Filter logs where totalDurationMinutes > 0 | Accent (green) |
| Workouts Skipped | Filter logs where totalDurationMinutes = 0 | Default (neutral) |
| Sets Logged | COUNT(*) from workoutLogSets | Default |
| 7-Day Adherence | (completed / scheduled) × 100 | Green if ≥80%, default if <80% |

#### Advanced Metrics:

**Last Workout Date:**
```
Find first completed log from 90 recent
→ Format: "Last workout Oct 15"
→ If none: "—"
```

**Average RPE (Last 5):**
```
Get rpeLastSet from last 5 completed logs
→ Calculate mean
→ Format: "7.2"
→ Fallback: "Log a few sessions with RPE..."
```

**7-Day Compliance:**
```
Filter logs within last 7 days
→ Count completed vs total scheduled
→ Highlight if ≥80% adherence
→ Shows: "4/5 scheduled sessions completed"
```

#### Visual Design:
- Grid of stat cards with borders
- Color-coded adherence (accent color if good, neutral if low)
- Trend indicators (last workout date, RPE trend)
- Helpful callouts for users with sparse data

---

## 7. SETTINGS

### Settings Page (`/settings`)
**Route:** `app/(auth)/settings/page.tsx`
**Component:** `SettingsView.tsx`

#### Sections:

**1. Plan Generation Preferences**
```
Custom Instructions for Workout Plans
┌──────────────────────────────────────┐
│ Textarea (max 500 chars)             │
│ "E.g., Focus on posterior chain,    │
│  avoid overhead movements, prefer    │
│  dumbbell variations..."             │
│                                      │
│ Char count: X/500                    │
│ [Save Preferences] Button            │
└──────────────────────────────────────┘
```

**Data:**
```sql
profiles.coachNotes (TEXT, max 500 chars)
```

**Behavior:**
- updateCustomInstructionsAction() → Server action
- Saves to database
- Included in plan generation prompts
- Helps personalize AI coach behavior

**2. My Workout Plans**
```
┌──────────────────────────────────────┐
│ Plan A                  [ACTIVE]     │
│ 12 weeks | 4 days/week              │
│ Created Oct 1                        │
│ [Delete] (if not active)             │
│                                      │
│ Plan B                  [DRAFT]      │
│ 8 weeks | 3 days/week               │
│ Created Sep 25                       │
│ [Delete] → Confirm → Confirm Delete  │
└──────────────────────────────────────┘
```

**Delete Flow:**
```
User clicks [Delete]
  ↓
Button changes to:
"Delete this plan?" [Confirm] [Cancel]
  ↓
Click [Confirm]
  ↓
deletePlanAction(planId)
  ├─ Cascading deletes:
  │  ├─ Plans → Workouts → WorkoutLogs → WorkoutLogSets
  │  ├─ Plans → PeriodizationFrameworks
  │  └─ Plans → ProgressionTargets
  └─ revalidatePath(/settings)
```

**Warning:**
- "Deleting a plan will permanently remove all workouts and logs. This action cannot be undone."

**3. Account Management**
```
┌──────────────────────────────────────┐
│ [Sign Out] Button                    │
└──────────────────────────────────────┘
```

**Action:**
- signOutAction() → Server action
- Clears Supabase session
- Clears cookies
- Redirects to `/`

---

## 8. AI COACH FEATURES

### Three Coach Contexts:

**1. Today Coach** (`/api/coach/today`)
- Displays on Dashboard before workout
- Headline + 3 bullets + 2 optional prompts
- Max 60 words
- Cached per day, expires 23:59:59

**Data Sources:**
```
User Profile:
- Goal bias, experience level, PCOS status

Today's Workout:
- Focus area, duration, exercises

Recent Logs (last 3):
- Completion status, RPE, notes
```

**Example Output:**
```
Headline: "Heavy day ahead—focus on crisp movement."

Bullets:
• Drive through your heels on squats
• Keep elbows tucked on bench
• 2-3 min rest between compound sets

Prompts:
• "How are my shoulders feeling today?"
• "Should I warm up extra today?"
```

**2. Weekly Coach** (`/api/coach/weekly`)
- Summary of week's performance
- Trends, recommendations
- Cached per week

**3. Debrief Coach** (post-workout)
- Short acknowledgement of performance
- Specific feedback on effort
- Cached per workout

### AI System Prompts:

**Coach System:**
```
You are FitCoach Coach. Provide short actionable nudges 
for daily briefings. Stay concise (<60 words). Use 
monochrome language (no emoji). Reinforce safety, PCOS 
guardrails, positive adherence. Never mention loads.
```

**Substitution System:**
```
You are FitCoach Substitutions. Suggest 2-3 alternative 
exercises targeting same pattern/muscle group. All 
alternatives must exist in FitCoach catalog. Prefer 
low-impact, PCOS-friendly options.
```

### Coach Response Schema (Zod):
```typescript
coachResponseSchema = z.object({
  headline: z.string(),
  bullets: z.array(z.string()).max(3),
  prompts: z.array(z.string()).max(2).optional()
})
```

### Caching Strategy:
```sql
coachCache table:
{
  userId: UUID,
  planId: UUID (nullable),
  context: 'today' | 'debrief' | 'weekly' | 'substitution',
  cacheKey: TEXT (date or workout ID),
  targetDate: DATE,
  payload: JSONB (coach response),
  expiresAt: TIMESTAMP,
  
  Unique: (userId, context, cacheKey)
}
```

---

## 9. WORKOUT DETAIL VIEW

### Route: `/workout/[id]`
**Component:** `WorkoutDetailView.tsx`

#### Displays:
```
Workout Title: "Upper Body Strength"
Focus: "Horizontal + Vertical Press"
Duration: 60 min
Kind: "strength"
Week: 2 | Day: 3

[Block 1: Warmup]
• Arm circles: 30s
• Band pull-aparts: 2×15
• Incline walk: 5 min

[Block 2: Strength]
• Barbell Bench Press: 4×5, Tempo 2-1-1
• Barbell Row: 4×5, Tempo 2-1-1
• Cues: Drive with legs, pack shoulders

[Block 3: Accessory]
• Incline Dumbbell Press: 3×8
• Chest Fly Machine: 3×10

[Start Workout] → Opens ExerciseLogger
```

#### Data Relationships:
```
Workout (1)
  ├─ workoutId (UUID, plan)
  ├─ userId (UUID, owning user)
  ├─ planId (UUID, parent plan)
  ├─ sessionDate (DATE, scheduled date)
  ├─ payload: WorkoutPayload (JSONB)
  │  ├─ blocks: Block[]
  │  │  ├─ type: 'warmup'|'primary'|'accessory'|'conditioning'|'finisher'
  │  │  ├─ title: string
  │  │  └─ exercises: Exercise[]
  │  │     ├─ id: string
  │  │     ├─ name: string
  │  │     ├─ sets: number
  │  │     ├─ reps: string (e.g., "5-6", "8-12")
  │  │     ├─ tempo?: string (e.g., "2-1-1")
  │  │     ├─ cues?: string[]
  │  │     └─ restSeconds?: number
  │  └─ focus: string
  └─ generationContext: JSONB (metadata from plan generation)
```

---

## 10. DATA FLOW ARCHITECTURE

### Authentication Flow:
```
1. User clicks "Start Training" on landing page
   ↓
2. Google OAuth via Supabase
   ↓
3. /api/auth/callback (Next.js route handler)
   ↓
4. Middleware checks:
   ├─ Session exists? Yes → Continue
   ├─ Has profile? No → Redirect /onboarding
   └─ Has profile? Yes → Continue to destination
   ↓
5. User in authenticated layout with nav
```

### Real-Time Data Sync:
```
User Action (logging, creating plan)
  ↓
Server Action (app/actions/*.ts) or API Route (/api/...)
  ↓
Validate with Zod schema
  ↓
Query/Mutate database with Drizzle ORM
  ↓
revalidatePath() (Next.js ISR)
  ↓
Client-side router.refresh() or redirect
  ↓
UI Updates with fresh data
```

### Offline-First Pattern:
```
User Action
  ↓
Check navigator.onLine
  ├─ Online: POST to /api/log directly
  └─ Offline: enqueueLog() → IndexedDB
      ↓
      When back online: window 'online' event
      ↓
      flushQueue() processes each entry
      ↓
      Background Sync API registers "fitcoach-log-sync"
      ↓
      Service Worker retries if app closed
```

### Data Consistency:
- **RLS (Row-Level Security):** Supabase policies ensure users see only their data
- **Transactions:** Plan activation uses `db.transaction()` for atomic updates
- **Indexes:** Optimized for common queries (user_id, plan_id, sessionDate)

---

## 11. UNIQUE APP FEATURES

### 1. PCOS Considerations
- **Detection:** Sex=female + hasPcos=true in onboarding
- **Automatic Adjustments:**
  - Enforces Zone 2 volume (2+ steady-state cardio sessions/week)
  - Removes high-impact plyometrics
  - Limits intense intervals to ≤60 seconds
  - Biases exercise selection toward low-impact
  
- **User Education:**
  - "Not medical advice" disclaimer
  - Transparent guardrails explanation

### 2. AI-Powered Personalization
- **Plan Generation:** OpenAI Agents SDK generates 6-16 week programs
- **Coach Briefings:** Daily context-aware coaching notes
- **Exercise Substitutions:** AI suggests alternatives matching patterns/muscles
- **Retry Logic:** Automatic retry on plan generation failure (max 2 attempts)

### 3. Offline-First Architecture
- **IndexedDB Queue:** Workouts sync when offline
- **Service Worker:** Background sync even if app closed
- **Graceful Degradation:** App functions without internet
- **Sync Notifications:** Users know when data will sync

### 4. Progressive Overload Tracking
- **RPE Logging:** Users rate effort (5-10) per workout
- **Volume Metrics:** Tracks sets, reps, weight over time
- **Periodization Framework:** Blocks cycle through accumulation → intensification → deload → realization

### 5. Streaming Plan Generation
- **SSE (Server-Sent Events):** Real-time progress updates to user
- **User Feedback:** "Finding exercises... 25%" → "Validating plan... 75%"
- **Cancellation Handling:** If generation fails, helpful error messages

### 6. Timezone Awareness
- **Auto-Detection:** Browser timezone captured during onboarding
- **Correct Scheduling:** "Today" interpreted relative to user's zone
- **Coach Context:** Coach brief generated for user's current date

---

## 12. KEY COMPONENTS & PATTERNS

### Component Hierarchy:
```
(public)/
  page.tsx → Landing page (Google OAuth)

(auth)/layout.tsx
  ├─ DesktopNav (header navigation)
  ├─ main (content area)
  └─ BottomNav (mobile navigation)

(auth)/dashboard/
  ├─ page.tsx → Fetches today's workout
  ├─ TodayView.tsx (main component)
  ├─ CoachBrief.tsx (coaching notes)
  └─ ExerciseLogger.tsx (logging UI)

(auth)/plan/
  ├─ page.tsx → Fetches plans
  └─ PlanView.tsx (plan management)

(auth)/exercises/
  ├─ page.tsx
  └─ ExerciseManagement.tsx
      ├─ MyExercises.tsx (saved exercises)
      └─ ExerciseBrowser.tsx (ExerciseDB integration)

(auth)/progress/
  └─ page.tsx (stats & metrics)

(auth)/settings/
  ├─ page.tsx
  └─ SettingsView.tsx (preferences & plan management)
```

### Validation Patterns:
- **Zod Schemas:** Input validation at form submission + API routes
- **Server-Side:** Drizzle ORM schema enforcement
- **Client-Side:** Early feedback on form errors

---

## 13. COMPLETE USER JOURNEY EXAMPLE

### Day 1: New User Onboarding
```
1. 08:00 - Visit app.fitcoach.com
   └─ See landing page with "Start Training" button

2. 08:02 - Click "Start Training"
   └─ Google OAuth → New profile created in Supabase

3. 08:05 - Onboarding form (7 steps)
   ├─ Step 1: "Sarah, 28 years old, Female"
   ├─ Step 2: "170cm, 65kg, Metric"
   ├─ Step 3: "✓ PCOS considerations, ✓ No high-impact"
   ├─ Step 4: "Intermediate (1+ years training)"
   ├─ Step 5: "4 days/week, 60 min/session, 12 weeks"
   │         "Mon, Tue, Thu, Sat preferred"
   ├─ Step 6: "Barbell, Dumbbells, Cables, Bodyweight"
   │         "Avoid: Jumping plyos, Heavy deadlifts"
   ├─ Step 7: "Goal: Balanced, Coach tone: Friendly"
   │         "Enabled: Today brief, Debrief, Weekly"
   │         "Notes: Focus on posterior chain"
   └─ Click "Save & Continue"
   └─ saveProfileAction() saves to database → Redirect /plan

4. 08:15 - Plan Generation Page
   └─ Click "[Generate New Plan]"
   └─ Streaming progress: 0% → 100%
   └─ Receive 12-week Upper/Lower split (4 days/week)
   └─ Plan includes PCOS guardrails:
      ├─ Mon: Upper Body + Zone 2 walk (20 min)
      ├─ Tue: Lower Body
      ├─ Thu: Upper Body + Zone 2 bike (20 min)
      └─ Sat: Lower Body + Core
   └─ All high-impact plyos removed
   └─ Click "[Activate Plan]" with start date Oct 1

5. 08:30 - Dashboard
   └─ "Today is Oct 1, Monday"
   └─ Coach Brief appears:
      "Strong week ahead—prioritize form over load."
      • Let your glutes do the work in deadlifts
      • Keep shoulders packed on rows
   └─ Today's Workout: "Upper Body A" (59 min)
   └─ See all exercises listed
```

### Day 2-7: First Week of Training
```
Tuesday Oct 2:
- 07:00 Opens app → Dashboard
- Sees: "Today's Workout: Lower Body A"
- Coach brief: "Fresh legs today. Build momentum for the week."
- Clicks "[Start Workout]"
- Exercise Logger opens
  ├─ Squat: Log 4 sets of 8 reps, various weights, RPE 7-8 each
  ├─ Rest timer: 3 min between sets
  ├─ RDL: Log 3 sets of 8, RPE 7
  ├─ Split Squat: Log 3 sets of 10, RPE 7
  └─ Core: Pallof Press 2×10
- Final: Overall RPE = 7.5
- Submit → Online sync → "Workout logged. Nice work!"
- Dashboard updates with completion status
```

### Week 2:
```
Friday Oct 6:
- Morning: Coach brief about weekend training
- Workout: "Upper Body B" (different exercises than Oct 1)
- Logs 58 min, RPE 8 (bit harder)

Saturday Oct 7:
- Realizes not ready to train
- Clicks "Skip Today"
- Selects reason: "Too fatigued"
- Confirm Skip → Logs as completed (0 duration)
- Dashboard shows "Skipped workouts: 1"
```

### Week 4: Progress Check
```
Monday Oct 22:
- Visits /progress page
- Sees stats:
  ├─ Workouts completed: 11
  ├─ Workouts skipped: 1
  ├─ Sets logged: 127
  ├─ 7-day adherence: 100% (4/4 scheduled)
  └─ Average RPE: 7.3
- Feels motivated by progress
```

### Week 8: Plan Generation (Next Week)
```
Monday Nov 26 (end of week 8 of original plan):
- Visits /plan page
- Sees: Plan has 12 weeks total, currently week 8 active
- Clicks "[Generate Next Week]" (for week 9)
- API calls plan generation for week 9
- Returns new exercises, same structure, periodized progression
- New workouts inserted, calendar updates
- Dashboard shows upcoming week with new exercises
```

### Month 3: Final Settings Update
```
Friday Dec 24:
- Visits /settings
- Updates custom instructions:
  "Now comfortable with overhead work. Add more shoulder press variations."
- Saves → Saved for next plan generation
- Reviews all plans created:
  ├─ Plan A (Oct 1-Dec 24) [ACTIVE] - 12 weeks
  ├─ Plan B (auto-generated week 9) [ACTIVE]
  └─ Previous drafts [ARCHIVED]
```

---

## 14. SECURITY & DATA PROTECTION

### Row-Level Security (RLS):
```sql
-- Users see only their own data
CREATE POLICY "Users select" ON users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Plans select" ON plans 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Workout logs select" ON workout_logs 
  FOR SELECT USING (auth.uid() = user_id);
```

### Authentication:
- **Supabase Auth:** Google OAuth 2.0
- **Session Management:** Supabase cookies + refresh tokens
- **Middleware:** Validates session on every protected route
- **Logout:** Clears Supabase session + cookies

### Data Privacy:
- **No payment info:** Fitness app, no billing
- **No tracking:** No Google Analytics, no user behavior tracking (optional OpenAI telemetry)
- **Export rights:** User can export all data via API
- **Deletion:** Cascade delete on user account deletion

---

## 15. PERFORMANCE OPTIMIZATIONS

### Caching Strategies:
| Data | Cache Layer | TTL |
|------|------------|-----|
| Coach Brief | Database (coachCache) | 1 day |
| User Profile | Server-side (getActivePlanAction) | On-demand |
| Workouts | Database + ISR | Revalidated on change |
| ExerciseDB | Client-side (save to library) | Indefinite |

### Database Optimizations:
- **Indexes:** On userId, planId, sessionDate for fast queries
- **Unique Constraints:** Prevent duplicate exercises per user
- **Transactions:** Atomic plan activation & workout deletion

### Frontend Optimizations:
- **Code Splitting:** Next.js automatic per-route splitting
- **Image Optimization:** Next/image for ExerciseDB thumbnails
- **Lazy Loading:** Exercise Browser lazy loads results
- **PWA Ready:** Service worker for offline support + background sync

---

## CONCLUSION

FitCoach provides a comprehensive strength training platform with:

1. **Intelligent Planning:** AI generates personalized 6-16 week programs
2. **Smart Logging:** Real-time workout tracking with offline sync
3. **Adaptive Coaching:** Context-aware daily briefings & weekly reviews
4. **Health Focus:** PCOS support, Zone 2 volume, injury prevention
5. **User Control:** Customizable preferences, equipment selection, goal bias
6. **Data Insights:** Progress metrics, adherence tracking, RPE trends
7. **Accessibility:** Offline-first, timezone-aware, responsive UI

**Core User Flow:** Onboard → Generate Plan → Log Daily → Track Progress → Iterate

The app balances AI sophistication with user simplicity, empowering lifters to train smart with consistent, evidence-based programming.

