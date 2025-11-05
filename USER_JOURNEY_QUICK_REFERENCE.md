# FitCoach User Journey - Quick Reference

## Complete User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FITCOACH APP FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

[1] PUBLIC ENTRY
    Landing Page (/)
    └─ "Start Training" Button
       └─ Google OAuth Sign-in

[2] AUTHENTICATION
    api/auth/callback
    └─ Create user in Supabase
       └─ Check if profile exists
          ├─ YES → Redirect /dashboard
          └─ NO → Redirect /onboarding

[3] ONBOARDING (7-Step Stepper)
    /onboarding → OnboardingForm.tsx
    ├─ Step 1: Basics (name, age, sex)
    ├─ Step 2: Body (height, weight, units)
    ├─ Step 3: Health (PCOS, no high-impact)
    ├─ Step 4: Experience (beginner/intermediate)
    ├─ Step 5: Schedule (days/week, min/session, weeks)
    ├─ Step 6: Equipment (select available gear)
    ├─ Step 7: Goals (goal bias, coach tone, coach features)
    └─ saveProfileAction() → INSERT profiles

[4] MAIN DASHBOARD
    /dashboard → TodayView.tsx
    ├─ [If no workout today]
    │  └─ Rest day message + Coach brief
    └─ [If workout scheduled]
       ├─ CoachBrief.tsx (AI coaching)
       ├─ Workout preview (blocks/exercises)
       ├─ [Start Workout] Button
       │  └─ ExerciseLogger.tsx (modal/overlay)
       │     ├─ Exercise 1 of N
       │     ├─ Log Set 1: Weight, Reps, RPE
       │     ├─ Rest Timer (auto-starts)
       │     ├─ Log Set 2, 3... (edit/delete)
       │     ├─ Next Exercise
       │     └─ Final RPE + Submit
       │        └─ Online? 
       │           ├─ YES → POST /api/log → workoutLogs + workoutLogSets
       │           └─ NO → enqueueLog() → IndexedDB → Show "Offline"
       │              └─ On reconnect: flushQueue() syncs
       └─ [Skip Today] Button
          ├─ Select reason (rest/injury/schedule/fatigue/other)
          └─ POST /api/log with empty entries

[5] PLAN MANAGEMENT
    /plan → PlanView.tsx
    ├─ [No active plan]
    │  ├─ [Generate New Plan] Button
    │  │  └─ /api/plan/generate (SSE streaming)
    │  │     ├─ Auth check
    │  │     ├─ Load profile
    │  │     ├─ AI Agent: runPlannerAgent()
    │  │     ├─ Post-process: PCOS guardrails
    │  │     ├─ Build calendar
    │  │     ├─ Save to DB (transaction)
    │  │     └─ Return plan
    │  │        └─ Choose start date + [Activate Plan]
    │  │           └─ activatePlanAction()
    │  │              ├─ Deactivate other plans
    │  │              ├─ Set active=true, status='active'
    │  │              ├─ Calculate sessionDates
    │  │              └─ Update workouts
    │  └─ Previous Plans list
    └─ [Active plan]
       ├─ Plan overview (12 weeks, 4 days/week, started Oct 1)
       ├─ Week grid (W1-W12 with status)
       ├─ [Generate Next Week] Button (extends plan)
       ├─ [Update Start Date] Option
       └─ Calendar view of completed/skipped

[6] EXERCISE LIBRARY
    /exercises → ExerciseManagement.tsx
    ├─ [Tab: My Library] → MyExercises.tsx
    │  ├─ GET /api/exercises
    │  └─ List saved exercises
    │     ├─ View details
    │     └─ Delete option
    └─ [Tab: Browse] → ExerciseBrowser.tsx
       ├─ GET /api/exercises/browse (ExerciseDB)
       ├─ Search/filter exercises
       └─ [Add to Library]
          └─ POST /api/exercises
             └─ INSERT userExercises

[7] PROGRESS DASHBOARD
    /progress (Server Component)
    ├─ Query last 90 workoutLogs
    ├─ Count totalSets from workoutLogSets
    └─ Display cards:
       ├─ Workouts Completed (count)
       ├─ Workouts Skipped (count)
       ├─ Sets Logged (total)
       ├─ 7-Day Adherence % (color-coded: green if ≥80%)
       ├─ Last Workout Date
       └─ Average RPE (last 5)

[8] SETTINGS
    /settings → SettingsView.tsx
    ├─ [Plan Generation Preferences]
    │  ├─ Custom Instructions textarea (max 500 chars)
    │  └─ updateCustomInstructionsAction()
    ├─ [My Workout Plans]
    │  ├─ List all plans
    │  ├─ Show status (active/draft/completed)
    │  └─ [Delete] → Confirm → Confirm
    │     └─ deletePlanAction() (cascades)
    └─ [Account]
       └─ [Sign Out] → signOutAction()
          └─ Clear session → Redirect /

[9] SINGLE WORKOUT VIEW
    /workout/[id] → WorkoutDetailView.tsx
    ├─ Fetch workout by ID
    ├─ Display structure:
    │  ├─ Title, focus, duration, kind
    │  ├─ Block 1: Warmup
    │  │  └─ Exercises with sets×reps, tempo, cues
    │  ├─ Block 2: Primary
    │  └─ Block 3: Accessories
    └─ [Start Workout] Button
       └─ Opens ExerciseLogger (same as dashboard)
```

---

## 5-Minute Tour for New Users

### Minute 1: Landing → Onboarding
- Start on landing page: "AI builds your plan. You build your strength."
- Click "Start Training" → Google sign-in
- Redirect to onboarding form

### Minute 2-3: Complete Onboarding
- Click through 7 steps (takes ~5 minutes to answer all)
- Final step: Save & Continue
- Database stores profile in `profiles` table

### Minute 4: Generate First Plan
- Arrive at `/plan` page
- Click "[Generate New Plan]"
- Watch streaming progress (0% → 100%)
- Takes ~30-60 seconds for AI to generate

### Minute 5: Activate Plan & Start
- Choose start date (today or future)
- Click "[Activate Plan]"
- Redirect to `/dashboard`
- See today's workout in "Today's Workout" card
- Click "[Start Workout]"
- Exercise Logger opens
- Log first set: 100kg × 5 reps, RPE 7

---

## Critical User Paths (What Users Actually Do)

### Path A: Daily Logger (70% of users)
```
1. Open app
2. See Dashboard
3. Read Coach Brief (encouraging message)
4. Click [Start Workout]
5. Log exercises in ExerciseLogger
6. Complete workout
7. See "Workout logged. Nice work!"
8. Return to life

Time: 45-90 minutes (depending on plan)
```

### Path B: Rest Day Manager (20% of users)
```
1. Open app
2. See Dashboard
3. No workout scheduled today
4. Read Coach Brief
5. Click "Enjoy the recovery"
6. Leave app

Time: 1-2 minutes
```

### Path C: Weekly Reviewer (15% of users)
```
1. Open app
2. Click Progress tab
3. Check 7-day adherence %
4. See "4/5 completed, Average RPE 7.3"
5. Feel proud
6. Leave app

Time: 30 seconds
```

### Path D: Exercise Explorer (30% of users)
```
1. Open app
2. Click Exercises tab
3. Click "Browse Exercises"
4. Search "chest press"
5. See results from ExerciseDB
6. Click exercise → View details (image/video)
7. Click "Add to Library"
8. Return to My Library
9. See exercise saved

Time: 2-5 minutes
```

### Path E: Plan Refresher (After 12 weeks)
```
1. Open app
2. Click Plan tab
3. See "Plan A: Week 12 of 12 (active)"
4. Click [Generate New Plan] or [Generate Next Week]
5. AI creates new plan (or extends current)
6. Choose start date
7. Activate
8. Return to Dashboard
9. See new exercises for tomorrow

Time: 2-5 minutes
```

---

## AI Features at a Glance

### Coach Brief (Daily)
```
Appears on: Dashboard before workout
Generated by: /api/coach/today endpoint
Uses: User profile + today's workout + recent logs
Output: 
  Headline: "Heavy day ahead—focus on clean movement"
  Bullets:
    • Drive through your heels on squats
    • Pause 1 second at the bottom
    • 2-3 min rest between compounds
  Prompts:
    • "How are your shoulders today?"
    • "Any pain to report?"
Max words: 60
Cache: Until 23:59:59 same day
```

### Plan Generation (Once per 12 weeks)
```
Triggered by: User clicks [Generate New Plan]
Endpoint: /api/plan/generate (SSE)
Agent: OpenAI Agents SDK
Input: 
  - Experience level (beginner/intermediate)
  - Schedule (3-6 days/week, 40-90 min/session, 6-16 weeks)
  - Goal bias (strength/balanced/hypertrophy/fat loss)
  - Equipment available
  - PCOS status (auto-adjusts guardrails)
Output:
  - 6-16 week periodized program
  - Weekly template with exercises
  - Exercise cues & form tips
  - Rest timers
  - PCOS guardrails applied (if needed)
Retry: 2 attempts max if generation fails
```

### Exercise Substitutions (In plans, optional)
```
Triggered by: User can't do planned exercise
Endpoint: /api/substitution
Agent: Suggests 2-3 alternatives
Criteria:
  - Same movement pattern
  - Same muscle group target
  - Available in user's library or ExerciseDB
  - PCOS-safe preferred
```

---

## Offline-First Architecture Explained

### Before Going Offline
```
User logs workout while online
  ↓
POST /api/log
  ↓
Server inserts workoutLogs + workoutLogSets
  ↓
Response 200 OK
  ↓
Show: "Workout logged. Nice work!"
```

### Going Offline (No Internet)
```
User logs workout while offline
  ↓
Check: navigator.onLine? NO
  ↓
enqueueLog(payload)
  ↓
IndexedDB.add('fitcoach-offline', 'logQueue', payload)
  ↓
Service Worker registers: "fitcoach-log-sync"
  ↓
Show: "Offline — workout saved. Will sync when online."
```

### Coming Back Online
```
User reconnects to internet
  ↓
window.addEventListener('online')
  ↓
attachOnlineSync() triggers flushQueue()
  ↓
For each queued entry:
  - POST /api/log
  - If success: Delete from IndexedDB
  - If fail: Retry next time
  ↓
All workouts synced
  ↓
Dashboard shows updated stats
```

### Background Sync (Even if App Closed)
```
Service Worker has "fitcoach-log-sync" tag registered
  ↓
When connection restored (even app is closed):
  ↓
Service Worker wakes up
  ↓
Calls flushQueue()
  ↓
Syncs all offline logs
  ↓
Next time app opens: Data is current
```

---

## PCOS Support Feature (Unique to FitCoach)

### Automatic Guardrails (When PCOS Selected)
```
✓ Include ≥2 Zone 2 cardio sessions/week (15-20 min each)
✓ Remove high-impact plyometrics (no box jumps, bounding)
✓ Limit intense intervals to ≤60 seconds
✓ Prefer low-moderate impact exercises
✓ Increase steady-state volume
```

### Implementation
```
Onboarding Step 3:
  Female? YES
  └─ Ask: "PCOS considerations?"
     └─ YES (checked)
        └─ Auto-check: "No high-impact movements"
        └─ Store: hasPcos=true, noHighImpact=true

Plan Generation:
  postProcessPlannerResponse(plan, {hasPcos: true})
  ├─ Add Zone 2 cardio sessions
  ├─ Remove high-impact exercises
  ├─ Validate intensity levels
  └─ Store with warnings applied

Exercise Library:
  userExercises.isPcosSafe = true/false
  userExercises.impactLevel = 'low'/'moderate'/'high'
  
Plan Shows:
  "PCOS guardrails applied: +2 Zone 2 sessions, removed 3 high-impact movements"
```

---

## Key Keyboard Shortcuts (Future Enhancement Ideas)

```
Home          → Go to Dashboard
p             → Go to Plan
e             → Go to Exercises
g             → Go to Progress
s             → Go to Settings
Spacebar      → Start/Complete Workout (in ExerciseLogger)
←  →          → Next/Previous Exercise
Enter         → Log Set
ESC           → Close ExerciseLogger
r             → Start Rest Timer
```

(Not yet implemented, but documented for future UX improvements)

---

## Common Error States & Recovery

### Error: "Plan generation failed after 2 attempts"
**Cause:** AI agent couldn't construct valid plan  
**Recovery:** User-friendly message explains why:
- "Try simplifying your requirements: reduce equipment options"
- "Increase session time or adjust your schedule"
- "Check your profile settings and try again"

### Error: "Offline — skip queued. Will sync when online."
**Cause:** User skipped workout while offline  
**Recovery:** Auto-syncs when back online, shows confirmation

### Error: "Coach brief unavailable."
**Cause:** API timeout or OpenAI service issue  
**Recovery:** Shows fallback motivational message:
- "Ready to train? Focus on form and progressive overload today."
- Provides Refresh button to retry

### Error: "Unable to log workout. Please try again."
**Cause:** Network failure during submission  
**Recovery:** 
- Auto-queues to offline storage
- Shows: "Connection issue — saved offline and will sync soon"
- Syncs automatically when back online

---

## Performance Metrics (Target)

| Metric | Target | Implementation |
|--------|--------|-----------------|
| Time to First Paint | <1s | Server-rendered layout |
| Plan Generation | 30-60s | Streaming SSE updates |
| Workout Logging | <5s | Client-side validation + offline queue |
| Dashboard Load | <1s | Server component + ISR cache |
| Coach Brief | <500ms | Database cache + fallback |
| Exercise Search | <300ms | Client-side filter |

---

## SEO & Metadata

```
Landing Page:
  Title: "FitCoach - AI Strength Training Plans"
  Description: "Personalized workout programs powered by AI..."

Onboarding:
  Title: "Get Started with FitCoach"

Dashboard:
  Title: "Today's Workout - FitCoach"

Plan Page:
  Title: "My Training Plans - FitCoach"

Exercise Library:
  Title: "Exercise Library - FitCoach"

Progress:
  Title: "Your Progress - FitCoach"

Settings:
  Title: "Settings - FitCoach"
```

---

## Development Checklist (For New Developers)

- [ ] Understand the 7 major flows (sections 1-7)
- [ ] Review the database schema in `drizzle/schema.ts`
- [ ] Trace one complete flow: Onboarding → Plan → Logging
- [ ] Study the AI prompts in `lib/ai/prompts.ts`
- [ ] Test offline workflow: Disable network → Log workout → Reconnect
- [ ] Review PCOS guardrails in `lib/ai/postProcessor.ts`
- [ ] Check server actions vs API routes pattern
- [ ] Understand Supabase RLS policies
- [ ] Review Next.js caching patterns (ISR, revalidatePath)
- [ ] Test timezone handling in plan scheduling

---

End of Quick Reference
Generated: 2025-11-05
