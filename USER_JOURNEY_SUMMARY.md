# FitCoach User Journey - Executive Summary

## Document Location
**Full Details:** `/home/user/fitcoach/FITCOACH_USER_JOURNEY_MAP.md` (1,313 lines)

---

## 7 Major User Flows

### 1. **Onboarding Flow** (7-step stepper)
- Landing page → Google OAuth → Profile creation
- Collects: Name, age, sex, height, weight, PCOS status, experience level, schedule preferences, equipment, goals
- Special handling: Auto-enables PCOS guardrails if needed
- Timezone auto-detection

### 2. **Dashboard / Today View** (Daily entry point)
- Shows scheduled workout for today (or "rest day" message)
- **Coach Brief:** AI-generated personalized briefing (cached per day)
- **Start Workout** button → Opens Exercise Logger
- **Skip Today** button → Logs rest with reason selection
- Feedback notifications with auto-dismiss

### 3. **Plan Generation** (AI-powered core feature)
- Click "[Generate New Plan]" → Streaming progress updates (SSE)
- OpenAI Agents SDK creates 6-16 week periodized programs
- Post-processing enforces PCOS guardrails, time budgets, exercise validation
- Real-time progress: "Analyzing profile... 15%" → "Saving your plan... 95%"
- After generation: Select start date → Activate plan
- Auto-creates calendar with absolute session dates

### 4. **Workout Logging** (During & post-workout)
- Exercise Logger displays exercises one-by-one
- Per-set entry: Weight (kg), Reps, RPE (5-10), optional notes
- Auto-starting rest timer with MM:SS countdown
- Set management: Edit, delete, renumber automatically
- Final: Rate overall effort (RPE) before submission
- **Offline support:** Queues to IndexedDB if offline, syncs when back online
- Feedback: "Workout logged. Nice work!" or "Offline — will sync when online"

### 5. **Exercise Management** (New feature)
- Two-tab interface: "My Library" & "Browse Exercises"
- Browse: Search/filter 1000+ exercises from ExerciseDB
- Save: Click "Add to Library" → POST to /api/exercises
- Library: View, search, filter, delete saved exercises
- PCOS awareness: Flag high-impact exercises, but don't prevent selection

### 6. **Progress Tracking** (Analytics dashboard)
- 4 summary cards: Workouts completed, Workouts skipped, Sets logged, 7-day adherence
- Advanced metrics: Last workout date, Average RPE (last 5), 7-day compliance %
- Color-coded: Green for good adherence (≥80%), neutral otherwise
- Data based on last 90 logged sessions

### 7. **Settings** (User preferences & plan management)
- Custom Instructions: Text field (max 500 chars) for personalization
- My Workout Plans: List all plans with status, click to delete
- Delete flow: Confirm → Confirm again → Cascading delete (plan, workouts, logs)
- Account: Sign out button

---

## Key Features by Category

### AI Coaching
| Feature | Where | What |
|---------|-------|------|
| Today Coach | Dashboard | Headline + 3 bullets + 2 optional prompts (max 60 words) |
| Weekly Coach | Plan page (optional) | Week summary + trends + recommendations |
| Debrief Coach | Post-workout (optional) | Acknowledgement + feedback on effort |
| Exercise Substitutions | Plan alternatives | 2-3 alternative exercises matching pattern/muscle |

### Offline Capabilities
- **IndexedDB:** Local queue for workout logs
- **Background Sync API:** Retries even if app closed
- **Online detection:** Auto-syncs when navigator.onLine = true
- **Graceful messaging:** "Offline — saved locally. Will sync when online."

### PCOS Support
- **Automatic adjustments:** Zone 2 volume, no high-impact plyos, limited intense intervals
- **User education:** "Not medical advice" disclaimer
- **Transparent:** Users see what's being adjusted

### Data & Privacy
- **Authentication:** Supabase + Google OAuth
- **Row-Level Security:** Users see only their own data
- **No tracking:** No analytics, user behavior stays private
- **Cascade deletes:** Deleting plan removes all related workouts & logs

---

## Database Schema Highlights

### Core Tables
| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `profiles` | User settings | hasPcos, scheduleWeeks, goalBias, coachNotes, timezone |
| `plans` | Workout programs | status (draft/active/completed/archived), microcycle (JSONB), calendar (JSONB) |
| `workouts` | Individual sessions | payload (WorkoutPayload with blocks/exercises), sessionDate |
| `workoutLogs` | Workout records | userId, planId, sessionDate, rpeLastSet, totalDurationMinutes |
| `workoutLogSets` | Individual sets logged | exerciseId, setIndex, reps, weightKg, rpe |
| `userExercises` | Saved exercises | exerciseId (external), isPcosSafe, impactLevel, source |
| `coachCache` | AI coaching cache | context (today/weekly/debrief/substitution), payload (JSON), expiresAt |

### Key JSONB Fields
- `plans.microcycle`: Week structure with exercises, sets, reps, tempo, cues
- `plans.calendar`: Absolute dates mapped to workouts
- `workouts.payload`: Block structure (warmup, primary, accessory, etc.)
- `profiles.preferredDays`: Array of preferred training days (mon-sun)
- `profiles.equipment`: Array of available equipment

---

## Navigation Structure

### Main Menu (Bottom Nav - Mobile, Top Nav - Desktop)
1. **Today** → `/dashboard` (Today's workout + Coach brief)
2. **Plan** → `/plan` (Generate, activate, manage plans)
3. **Exercises** → `/exercises` (Browse ExerciseDB + save library)
4. **Progress** → `/progress` (Stats & metrics)
5. **Settings** → `/settings` (Preferences, plans, logout)

### Route Guards
- `Middleware.ts` enforces authentication + profile completion
- Unauthenticated → Redirect `/`
- Has session, no profile → Redirect `/onboarding`
- Has session, has profile → Allow access

---

## Data Flow Examples

### Logging a Workout
```
User: "Start Workout" button
  → ExerciseLogger component opens
  → User logs: Set 1: 100kg × 5 reps, RPE 7
  → User logs: Set 2: 100kg × 5 reps, RPE 8
  → User completes workout, rates overall RPE: 7.5
  → Check: navigator.onLine?
    ├─ YES → POST /api/log directly
    │        → workoutLogs + workoutLogSets inserted
    │        → Dashboard refresh
    │        → Show: "Workout logged. Nice work!"
    └─ NO → enqueueLog() to IndexedDB
            → Show: "Offline — will sync when online"
            → When back online: flushQueue() syncs all

Database state after sync:
  workoutLogs: id, userId, workoutId, rpeLastSet=7.5, totalDurationMinutes=58
  workoutLogSets: 2 rows (set 1 & set 2 details)
```

### Generating a Plan
```
User: Click "[Generate New Plan]"
  → /api/plan/generate route (SSE stream)
  → Progress: "Authenticating..." 5%
  → Progress: "Loading profile..." 10%
  → Progress: "Analyzing goals..." 15%
  → AI Agent: runPlannerAgent(userProfile) with retry logic
  → Post-process: Enforce PCOS guardrails, time budgets
  → Progress: "Processing..." 75%
  → Calendar build: Map to absolute dates starting from chosen start date
  → Progress: "Saving..." 95%
  → DB transaction:
      - INSERT plans
      - INSERT workouts (one per scheduled day)
      - INSERT periodizationFrameworks
      - INSERT progressionTargets
  → Progress: "Complete" 100%
  → Return planId to client
  → User: Click "[Activate Plan]" with start date
  → Deactivate other plans, activate this one
  → Update all workout sessionDates
  → Dashboard now shows today's assigned workout
```

---

## Unique Strengths

1. **AI-Driven Personalization:** OpenAI Agents SDK generates full periodized programs
2. **Offline-First:** Works without internet, syncs when back online
3. **PCOS Intelligence:** Automatic guardrails without being prescriptive
4. **Streaming UX:** Real-time progress on slow operations (plan generation)
5. **Progressive Overload:** RPE tracking, volume metrics, periodization blocks
6. **Accessibility:** Timezone-aware, unit conversion, simple mobile UI
7. **Data Privacy:** RLS policies, no tracking, cascade deletes

---

## Common User Paths

### Path 1: Beginner (1st Week)
```
Day 1: Landing → Onboard (7 steps) → Generate plan → See week 1
Day 2: Dashboard → Coach brief → Start workout → Log sets → Complete
Day 3: Rest day (no workout scheduled)
Day 4: Dashboard → Coach brief → Start workout → Log → Complete
Day 5: Dashboard → Skipped (too fatigued)
Day 6: Dashboard → Coach brief → Start workout → Log → Complete
Day 7: Settings → Check progress card → See stats
```

### Path 2: Returning User (2nd Month)
```
Morning: Dashboard → Coach brief → Start workout → Log sets
Post-workout: Submit → Sync (if offline, queue automatically)
Week review: Visit `/progress` → Check 7-day adherence
Monthly: Visit `/exercises` → Browse new exercises → Save to library
```

### Path 3: Plan Refresh (End of Current Plan)
```
Week 12 of plan: Visit `/plan` → Click "[Generate Next Week]"
AI generates week 13 → Same periodized structure
Or: Click "[Generate New Plan]" for fresh 12-week cycle
Select new start date → Activate → Dashboard updates
```

---

## Files Referenced in Document

### Core Pages
- `app/(public)/page.tsx` - Landing page
- `app/(auth)/onboarding/OnboardingForm.tsx` - 7-step form
- `app/(auth)/dashboard/TodayView.tsx` - Daily dashboard
- `app/(auth)/plan/PlanView.tsx` - Plan management
- `app/(auth)/exercises/ExerciseManagement.tsx` - Exercise library
- `app/(auth)/progress/page.tsx` - Analytics
- `app/(auth)/settings/SettingsView.tsx` - Preferences

### Components
- `ExerciseLogger.tsx` - Workout logging UI
- `CoachBrief.tsx` - AI coaching display
- `WorkoutDetailView.tsx` - Workout details
- `MyExercises.tsx` - Saved exercises list
- `ExerciseBrowser.tsx` - ExerciseDB browser

### API Routes
- `app/api/plan/generate/route.ts` - Plan generation (SSE)
- `app/api/coach/today/route.ts` - Daily coach brief
- `app/api/log/route.ts` - Workout submission
- `app/api/exercises/route.ts` - Exercise CRUD

### Server Actions
- `app/actions/profile.ts` - Profile save
- `app/actions/plan.ts` - Plan actions
- `app/actions/dashboard.ts` - Dashboard data
- `app/actions/auth.ts` - Auth operations

### Utilities
- `lib/offlineQueue.ts` - IndexedDB + sync
- `lib/ai/prompts.ts` - System prompts
- `lib/ai/agents/planner-agent.ts` - Plan generation agent
- `drizzle/schema.ts` - Database schema

---

## Quick Start for New Developers

1. **Understand the flow:** Read sections 1-7 (7 major flows)
2. **Study the data:** Review section 15 (schema highlights)
3. **Explore code:** Start with `app/(public)/page.tsx` → onboarding → dashboard
4. **Check APIs:** Study `/api/plan/generate` and `/api/coach/today` for AI integration
5. **Offline logic:** Review `lib/offlineQueue.ts` for async patterns

---

## Glossary

- **Coach Brief:** AI-generated personalized guidance (headline + bullets + prompts)
- **Microcycle:** Weekly workout template structure (exercises, sets, reps)
- **Periodization:** Training blocks cycling through accumulation → intensification → deload → realization
- **RPE:** Rate of Perceived Exertion (5-10 scale)
- **Zone 2:** Steady-state cardio at easy, conversational pace (PCOS emphasis)
- **RLS:** Row-Level Security (Supabase policy for data isolation)
- **SSE:** Server-Sent Events (streaming progress updates)
- **ISR:** Incremental Static Regeneration (Next.js caching)

