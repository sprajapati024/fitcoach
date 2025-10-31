# FitCoach Core Flows Implementation Plan

## Overview

**GitHub Issue**: [#1 - Implement FitCoach core flows](https://github.com/user/FitCoach/issues/1)

**Status**: 4/13 tasks completed (Auth, Onboarding, Plan Generation, Plan Activation)

**Goal**: Deliver the first usable vertical slice with Today experience, workout logging, progress tracking, offline support, and complete UI polish.

**Timeline**: 25 days (5 phases × 5 days each)

---

## Current Status

### ✅ Completed
- Auth shell (Supabase SSR, Google sign-in)
- Onboarding stepper (7 steps + coach notes)
- Plan generation flow (AI planner, PCOS post-processing)
- Plan activation & calendar UI (PlanWeekGrid, date selection)

### 🚧 Pending
- Today experience (exercise logger, coach brief)
- Workout logging API (batch logs, RPE, offline queue)
- Progress & weekly review (metrics, sparklines, AI review)
- Settings page (toggles, sliders, preferences)
- AI substitution helper (exercise alternatives)
- Progression engine wiring (API, triggers, tests)
- Offline queue hooks (service worker, UI indicators)
- Testing & linting (unit/integration/E2E tests)
- README refresh (complete documentation)

---

## Phase 1: Core Logging Infrastructure (Days 1-5)

### Goal
Build the workout logging foundation that enables all other features.

### 1.1 Workout Logging API

**Priority**: CRITICAL - Foundation for all tracking

#### Tasks
- [ ] Create `app/api/log/route.ts` - POST endpoint for workout logs
- [ ] Implement batch log processing (multiple sets + overall RPE)
- [ ] Add Drizzle ORM insert logic for `workoutLogs` and `workoutLogSets`
- [ ] Handle duplicate log prevention (check existing logs by workout ID + date)
- [ ] Add error handling with descriptive messages
- [ ] Return logged workout summary

#### Code Template
```typescript
// app/api/log/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServerClient';
import { db } from '@/drizzle/db';
import { workoutLogs, workoutLogSets } from '@/drizzle/schema';
import { logRequestSchema } from '@/lib/validation';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = logRequestSchema.parse(body);

    // Check for duplicate log
    const existing = await db.query.workoutLogs.findFirst({
      where: and(
        eq(workoutLogs.userId, user.id),
        eq(workoutLogs.workoutId, validated.workoutId),
        eq(workoutLogs.completedAt, validated.completedAt)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Workout already logged for this date' },
        { status: 409 }
      );
    }

    // Insert workout log
    const [log] = await db.insert(workoutLogs).values({
      id: crypto.randomUUID(),
      userId: user.id,
      workoutId: validated.workoutId,
      completedAt: validated.completedAt,
      durationMinutes: validated.durationMinutes,
      overallRpe: validated.overallRpe,
      notes: validated.notes,
      createdAt: new Date().toISOString(),
    }).returning();

    // Insert sets
    if (validated.sets && validated.sets.length > 0) {
      const setRecords = validated.sets.map((set, index) => ({
        id: crypto.randomUUID(),
        logId: log.id,
        exerciseId: set.exerciseId,
        setNumber: index + 1,
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe,
        notes: set.notes,
        createdAt: new Date().toISOString(),
      }));

      await db.insert(workoutLogSets).values(setRecords);
    }

    // TODO: Trigger progression recompute if week completed
    // await triggerProgressionCompute(user.id, log.workoutId);

    return NextResponse.json({
      success: true,
      logId: log.id,
      message: 'Workout logged successfully',
    });

  } catch (error) {
    console.error('[Workout Log] Error:', error);
    return NextResponse.json(
      { error: 'Failed to log workout' },
      { status: 500 }
    );
  }
}
```

#### Database Schema Reference
- **workoutLogs**: id, userId, workoutId, completedAt, durationMinutes, overallRpe, notes
- **workoutLogSets**: id, logId, exerciseId, setNumber, weight, reps, rpe, notes

#### Success Criteria
- [ ] API accepts valid log requests
- [ ] Prevents duplicate logs
- [ ] Stores logs and sets in database
- [ ] Returns success response
- [ ] Handles errors gracefully

---

### 1.2 Today View with Exercise Logger

**Priority**: HIGH - Primary user interaction point

#### Tasks
- [ ] Create `app/(auth)/dashboard/TodayView.tsx` - main Today view component
- [ ] Create `app/(auth)/dashboard/ExerciseLogger.tsx` - set-by-set logger
- [ ] Create `app/(auth)/dashboard/CoachBrief.tsx` - brief display (static for now)
- [ ] Update `app/(auth)/dashboard/page.tsx` to use TodayView
- [ ] Create `app/actions/dashboard.ts` - server actions for Today data
- [ ] Fetch today's workout from database
- [ ] Display workout blocks (warmup, strength, accessory, etc.)
- [ ] Implement set logging UI (weight, reps, RPE inputs)
- [ ] Add "Log Set" and "Complete Workout" buttons
- [ ] Add "Skip Today" functionality

#### Code Template - TodayView Component
```typescript
// app/(auth)/dashboard/TodayView.tsx
'use client';

import { useState } from 'react';
import { ExerciseLogger } from './ExerciseLogger';
import { CoachBrief } from './CoachBrief';
import type { workouts } from '@/drizzle/schema';

type Workout = typeof workouts.$inferSelect;

interface TodayViewProps {
  workout: Workout | null;
  userId: string;
}

export function TodayView({ workout, userId }: TodayViewProps) {
  const [isLogging, setIsLogging] = useState(false);

  if (!workout) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Today</h1>
        <p className="text-gray-600">No workout scheduled for today. Enjoy your rest day!</p>
      </div>
    );
  }

  const workoutPayload = workout.payload as any;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Today's Workout</h1>

      {/* Coach Brief */}
      <CoachBrief userId={userId} />

      {/* Workout Details */}
      <div className="mt-6 space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-2">{workoutPayload.focus || 'Training Session'}</h2>
          <p className="text-sm text-gray-600">
            {workoutPayload.blocks?.length || 0} blocks · {workoutPayload.estimatedMinutes || 60} min
          </p>
        </div>

        {/* Exercise Logger */}
        {!isLogging ? (
          <div className="space-y-4">
            {workoutPayload.blocks?.map((block: any, index: number) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold mb-2">{block.title}</h3>
                <div className="space-y-2">
                  {block.exercises?.map((exercise: any, exIndex: number) => (
                    <div key={exIndex} className="text-sm text-gray-700">
                      <span className="font-medium">{exercise.name || exercise.exerciseId}</span>
                      <span className="text-gray-500 ml-2">
                        {exercise.sets}×{exercise.reps} @ {exercise.targetRpe || '-'} RPE
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={() => setIsLogging(true)}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold"
            >
              Start Workout
            </button>
          </div>
        ) : (
          <ExerciseLogger
            workout={workout}
            userId={userId}
            onComplete={() => setIsLogging(false)}
          />
        )}
      </div>

      {/* Skip Today */}
      {!isLogging && (
        <button className="w-full mt-4 text-gray-600 py-2">
          Skip Today
        </button>
      )}
    </div>
  );
}
```

#### Code Template - ExerciseLogger Component
```typescript
// app/(auth)/dashboard/ExerciseLogger.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { workouts } from '@/drizzle/schema';

type Workout = typeof workouts.$inferSelect;

interface Set {
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number;
  notes?: string;
}

interface ExerciseLoggerProps {
  workout: Workout;
  userId: string;
  onComplete: () => void;
}

export function ExerciseLogger({ workout, userId, onComplete }: ExerciseLoggerProps) {
  const router = useRouter();
  const [sets, setSets] = useState<Set[]>([]);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [notes, setNotes] = useState('');
  const [overallRpe, setOverallRpe] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const workoutPayload = workout.payload as any;
  const allExercises = workoutPayload.blocks?.flatMap((block: any) =>
    block.exercises?.map((ex: any) => ({
      ...ex,
      blockTitle: block.title,
    })) || []
  ) || [];

  const currentEx = allExercises[currentExercise];

  const handleLogSet = () => {
    if (!weight || !reps || !rpe) {
      alert('Please fill in weight, reps, and RPE');
      return;
    }

    const newSet: Set = {
      exerciseId: currentEx.exerciseId,
      setNumber: sets.filter(s => s.exerciseId === currentEx.exerciseId).length + 1,
      weight: parseFloat(weight),
      reps: parseInt(reps),
      rpe: parseFloat(rpe),
      notes: notes.trim() || undefined,
    };

    setSets([...sets, newSet]);
    setWeight('');
    setReps('');
    setRpe('');
    setNotes('');
  };

  const handleNextExercise = () => {
    if (currentExercise < allExercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
    }
  };

  const handleCompleteWorkout = async () => {
    if (!overallRpe) {
      alert('Please rate your overall workout RPE');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId: workout.id,
          completedAt: new Date().toISOString(),
          durationMinutes: 60, // TODO: Calculate actual duration
          overallRpe: parseFloat(overallRpe),
          sets,
          notes: '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log workout');
      }

      router.refresh();
      onComplete();
    } catch (error) {
      console.error('Error logging workout:', error);
      alert('Failed to log workout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 rounded-lg p-4">
        <p className="text-sm text-gray-600">{currentEx.blockTitle}</p>
        <h3 className="text-lg font-semibold">{currentEx.name || currentEx.exerciseId}</h3>
        <p className="text-sm text-gray-600">
          Target: {currentEx.sets}×{currentEx.reps} @ {currentEx.targetRpe || '-'} RPE
        </p>
      </div>

      {/* Set Inputs */}
      <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Weight (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Reps</label>
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">RPE (1-10)</label>
          <input
            type="number"
            step="0.5"
            min="1"
            max="10"
            value={rpe}
            onChange={(e) => setRpe(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="7.5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Felt strong"
          />
        </div>

        <button
          onClick={handleLogSet}
          className="w-full bg-black text-white py-2 rounded font-semibold"
        >
          Log Set
        </button>
      </div>

      {/* Logged Sets */}
      {sets.filter(s => s.exerciseId === currentEx.exerciseId).length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold mb-2">Logged Sets</h4>
          <div className="space-y-1 text-sm">
            {sets
              .filter(s => s.exerciseId === currentEx.exerciseId)
              .map((set, index) => (
                <div key={index} className="flex justify-between">
                  <span>Set {set.setNumber}</span>
                  <span>{set.weight}kg × {set.reps} @ {set.rpe} RPE</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2">
        {currentExercise < allExercises.length - 1 ? (
          <button
            onClick={handleNextExercise}
            className="flex-1 bg-gray-200 text-black py-2 rounded font-semibold"
          >
            Next Exercise
          </button>
        ) : (
          <>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Overall RPE</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="10"
                value={overallRpe}
                onChange={(e) => setOverallRpe(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="7.5"
              />
            </div>
            <button
              onClick={handleCompleteWorkout}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 text-white py-2 rounded font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Logging...' : 'Complete Workout'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

#### Code Template - CoachBrief Component (Static for Phase 1)
```typescript
// app/(auth)/dashboard/CoachBrief.tsx
'use client';

interface CoachBriefProps {
  userId: string;
}

export function CoachBrief({ userId }: CoachBriefProps) {
  // Phase 1: Static placeholder
  // Phase 3: Will fetch from /api/coach/today

  return (
    <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4">
      <p className="text-sm text-gray-700">
        Ready to train? Focus on form and progressive overload today. Let's get stronger! 💪
      </p>
    </div>
  );
}
```

#### Server Actions Template
```typescript
// app/actions/dashboard.ts
'use server';

import { createServerClient } from '@/lib/supabaseServerClient';
import { db } from '@/drizzle/db';
import { workouts } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function getTodayWorkout() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const today = new Date().toISOString().split('T')[0];

  const workout = await db.query.workouts.findFirst({
    where: and(
      eq(workouts.userId, user.id),
      eq(workouts.scheduledDate, today)
    ),
  });

  return workout;
}
```

#### Success Criteria
- [ ] Today view displays current workout
- [ ] Exercise logger allows set-by-set input
- [ ] Logged sets appear in UI
- [ ] Complete workout submits to API
- [ ] Success/error states handled
- [ ] Mobile-responsive design

---

### 1.3 Skip Today Functionality

#### Tasks
- [ ] Add skip reason dropdown (rest, injury, schedule, other)
- [ ] Create skip log in database (use workoutLogs with skip flag)
- [ ] Update Today view to show skip confirmation
- [ ] Store skip reason in notes field

#### Code Addition to TodayView
```typescript
const [skipReason, setSkipReason] = useState('');
const [isSkipping, setIsSkipping] = useState(false);

const handleSkipToday = async () => {
  if (!skipReason) {
    alert('Please select a reason for skipping');
    return;
  }

  try {
    const response = await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workoutId: workout.id,
        completedAt: new Date().toISOString(),
        durationMinutes: 0,
        overallRpe: null,
        sets: [],
        notes: `Skipped: ${skipReason}`,
      }),
    });

    if (response.ok) {
      router.refresh();
    }
  } catch (error) {
    console.error('Error skipping workout:', error);
  }
};
```

#### Success Criteria
- [ ] Skip button shows reason dropdown
- [ ] Skip creates log entry with 0 duration
- [ ] Skip reason stored in notes
- [ ] UI updates after skip

---

### 1.4 Update Dashboard Page

#### Task
- [ ] Replace placeholder with TodayView component
- [ ] Fetch today's workout via server action
- [ ] Pass workout and userId to TodayView

#### Code Template
```typescript
// app/(auth)/dashboard/page.tsx
import { createServerClient } from '@/lib/supabaseServerClient';
import { getTodayWorkout } from '@/app/actions/dashboard';
import { TodayView } from './TodayView';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const workout = await getTodayWorkout();

  return <TodayView workout={workout} userId={user.id} />;
}
```

#### Success Criteria
- [ ] Dashboard shows TodayView
- [ ] Workout fetched on page load
- [ ] Authentication enforced

---

### Phase 1 Summary

**Files Created**: 5
- app/api/log/route.ts
- app/(auth)/dashboard/TodayView.tsx
- app/(auth)/dashboard/ExerciseLogger.tsx
- app/(auth)/dashboard/CoachBrief.tsx
- app/actions/dashboard.ts

**Files Modified**: 1
- app/(auth)/dashboard/page.tsx

**Database Tables Used**:
- workouts (read)
- workoutLogs (write)
- workoutLogSets (write)

**Success Metrics**:
- [ ] Users can view today's workout
- [ ] Users can log sets with weight/reps/RPE
- [ ] Users can complete workouts
- [ ] Users can skip workouts with reason
- [ ] Logs stored in database
- [ ] UI responsive on mobile

---

## Phase 2: Progression & Settings (Days 6-10)

### Goal
Enable progressive overload calculation and user preference management.

### 2.1 Progression Computation API

**Priority**: HIGH - Drives adaptive training

#### Tasks
- [ ] Create `app/api/progression/compute/route.ts` - POST endpoint
- [ ] Accept userId, weekNumber, planId
- [ ] Fetch historical workout logs for past 4 weeks
- [ ] Call `computeProgressionTargets()` from lib/progression.ts
- [ ] Store results in `progressionTargets` table
- [ ] Return computed targets

#### Code Template
```typescript
// app/api/progression/compute/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServerClient';
import { db } from '@/drizzle/db';
import { progressionTargets, workoutLogs, workoutLogSets, plans } from '@/drizzle/schema';
import { computeProgressionTargets } from '@/lib/progression';
import { eq, and, gte, desc } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { planId, weekNumber } = await request.json();

    // Fetch user's active plan
    const plan = await db.query.plans.findFirst({
      where: and(
        eq(plans.userId, user.id),
        eq(plans.id, planId)
      ),
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Fetch historical logs (past 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const logs = await db.query.workoutLogs.findMany({
      where: and(
        eq(workoutLogs.userId, user.id),
        gte(workoutLogs.completedAt, fourWeeksAgo.toISOString())
      ),
      orderBy: [desc(workoutLogs.completedAt)],
      with: {
        sets: true,
      },
    });

    // Compute progression targets
    const targets = computeProgressionTargets({
      weekNumber,
      historicalLogs: logs,
      planMicrocycle: plan.microcycle as any,
      hasPcos: false, // TODO: Fetch from profile
    });

    // Store targets in database
    const targetRecords = targets.map(target => ({
      id: crypto.randomUUID(),
      userId: user.id,
      planId: plan.id,
      weekNumber,
      exerciseId: target.exerciseId,
      targetWeight: target.targetWeight,
      targetReps: target.targetReps,
      targetSets: target.targetSets,
      createdAt: new Date().toISOString(),
    }));

    await db.insert(progressionTargets).values(targetRecords);

    return NextResponse.json({
      success: true,
      targets: targetRecords,
    });

  } catch (error) {
    console.error('[Progression Compute] Error:', error);
    return NextResponse.json(
      { error: 'Failed to compute progression' },
      { status: 500 }
    );
  }
}
```

#### Success Criteria
- [ ] API accepts valid requests
- [ ] Computes targets from historical data
- [ ] Stores targets in database
- [ ] Handles missing data gracefully
- [ ] Returns computed targets

---

### 2.2 Progression Trigger on Log Completion

#### Tasks
- [ ] Add trigger logic to workout log API
- [ ] Detect when a week is completed
- [ ] Automatically call progression compute API
- [ ] Handle async computation (don't block log response)

#### Code Addition to /api/log/route.ts
```typescript
// After successful workout log insertion:

// Check if week completed
const isWeekCompleted = await checkWeekCompletion(user.id, log.workoutId);

if (isWeekCompleted) {
  // Trigger progression compute asynchronously
  fetch('/api/progression/compute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planId: validated.planId, // Add to schema
      weekNumber: validated.weekNumber, // Add to schema
    }),
  }).catch(err => console.error('Progression trigger failed:', err));
}

async function checkWeekCompletion(userId: string, workoutId: string): Promise<boolean> {
  // TODO: Implement logic to check if all workouts for the week are logged
  return false;
}
```

#### Success Criteria
- [ ] Week completion detected correctly
- [ ] Progression compute triggered automatically
- [ ] Async trigger doesn't block logging
- [ ] Failed triggers logged for debugging

---

### 2.3 Settings Page UI

**Priority**: MEDIUM - User preference management

#### Tasks
- [ ] Create `app/(auth)/settings/SettingsForm.tsx` - settings UI
- [ ] Create `app/actions/settings.ts` - update settings server action
- [ ] Create `components/Toggle.tsx` - reusable toggle component
- [ ] Create `components/Slider.tsx` - reusable slider component
- [ ] Implement unit system toggle (metric/imperial)
- [ ] Implement coach feature switches (Today, Debrief, Weekly)
- [ ] Implement coach tone selector (concise, encouraging, technical)
- [ ] Implement goal bias slider (strength → hypertrophy → fat_loss)
- [ ] Add sign-out button (already exists, keep it)

#### Code Template - SettingsForm
```typescript
// app/(auth)/settings/SettingsForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateSettings } from '@/app/actions/settings';
import { Toggle } from '@/components/Toggle';
import { Slider } from '@/components/Slider';
import type { profiles } from '@/drizzle/schema';

type Profile = typeof profiles.$inferSelect;

interface SettingsFormProps {
  profile: Profile;
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const router = useRouter();
  const [unitSystem, setUnitSystem] = useState(profile.unitSystem || 'metric');
  const [coachTodayEnabled, setCoachTodayEnabled] = useState(profile.coachTodayEnabled);
  const [coachDebriefEnabled, setCoachDebriefEnabled] = useState(profile.coachDebriefEnabled);
  const [coachWeeklyEnabled, setCoachWeeklyEnabled] = useState(profile.coachWeeklyEnabled);
  const [coachTone, setCoachTone] = useState(profile.coachTone || 'concise');
  const [goalBias, setGoalBias] = useState(profile.goalBias);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        unitSystem,
        coachTodayEnabled,
        coachDebriefEnabled,
        coachWeeklyEnabled,
        coachTone,
        goalBias,
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Unit System */}
      <section className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Units</h2>
        <div className="flex items-center justify-between">
          <span>Unit System</span>
          <div className="flex gap-2">
            <button
              onClick={() => setUnitSystem('metric')}
              className={`px-4 py-2 rounded ${
                unitSystem === 'metric' ? 'bg-black text-white' : 'bg-gray-200'
              }`}
            >
              Metric
            </button>
            <button
              onClick={() => setUnitSystem('imperial')}
              className={`px-4 py-2 rounded ${
                unitSystem === 'imperial' ? 'bg-black text-white' : 'bg-gray-200'
              }`}
            >
              Imperial
            </button>
          </div>
        </div>
      </section>

      {/* Coach Features */}
      <section className="bg-white rounded-lg p-4 shadow-sm space-y-3">
        <h2 className="font-semibold mb-3">Coach Features</h2>
        <Toggle
          label="Daily Brief"
          checked={coachTodayEnabled}
          onChange={setCoachTodayEnabled}
        />
        <Toggle
          label="Post-Workout Debrief"
          checked={coachDebriefEnabled}
          onChange={setCoachDebriefEnabled}
        />
        <Toggle
          label="Weekly Review"
          checked={coachWeeklyEnabled}
          onChange={setCoachWeeklyEnabled}
        />
      </section>

      {/* Coach Tone */}
      <section className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Coach Tone</h2>
        <select
          value={coachTone}
          onChange={(e) => setCoachTone(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="concise">Concise</option>
          <option value="encouraging">Encouraging</option>
          <option value="technical">Technical</option>
        </select>
      </section>

      {/* Goal Bias */}
      <section className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Goal Bias</h2>
        <Slider
          label={goalBias}
          value={goalBias}
          options={['strength', 'balanced', 'hypertrophy', 'fat_loss']}
          onChange={setGoalBias}
        />
      </section>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-black text-white py-3 rounded-lg font-semibold disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
```

#### Code Template - Toggle Component
```typescript
// components/Toggle.tsx
'use client';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-black' : 'bg-gray-300'
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
```

#### Code Template - Settings Server Action
```typescript
// app/actions/settings.ts
'use server';

import { createServerClient } from '@/lib/supabaseServerClient';
import { db } from '@/drizzle/db';
import { profiles } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateSettings(data: {
  unitSystem?: string;
  coachTodayEnabled?: boolean;
  coachDebriefEnabled?: boolean;
  coachWeeklyEnabled?: boolean;
  coachTone?: string;
  goalBias?: string;
}) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  await db.update(profiles)
    .set({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(profiles.userId, user.id));

  revalidatePath('/settings');
}
```

#### Success Criteria
- [ ] Settings form displays current values
- [ ] Toggles work correctly
- [ ] Tone selector updates
- [ ] Goal bias slider works
- [ ] Save persists to database
- [ ] UI updates after save

---

### Phase 2 Summary

**Files Created**: 6
- app/api/progression/compute/route.ts
- app/(auth)/settings/SettingsForm.tsx
- app/actions/settings.ts
- components/Toggle.tsx
- components/Slider.tsx

**Files Modified**: 2
- app/api/log/route.ts (add progression trigger)
- app/(auth)/settings/page.tsx (use SettingsForm)

**Database Tables Used**:
- progressionTargets (write)
- profiles (read/write)
- workoutLogs (read)

**Success Metrics**:
- [ ] Progression targets computed automatically
- [ ] Targets stored in database
- [ ] Settings page functional
- [ ] User preferences saved
- [ ] UI responsive

---

## Phase 3: AI Features (Days 11-15)

### Goal
Implement AI-powered coach features with caching.

### 3.1 AI Coach Today Brief

**Priority**: HIGH - Daily user engagement

#### Tasks
- [ ] Create `app/api/coach/today/route.ts` - GET endpoint
- [ ] Integrate with coach agent (from AIplan.md Phase 2)
- [ ] Check `coachCache` table for existing brief
- [ ] Generate new brief if cache miss or expired
- [ ] Cache response with midnight expiry
- [ ] Update CoachBrief component to fetch from API

#### Code Template
```typescript
// app/api/coach/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServerClient';
import { db } from '@/drizzle/db';
import { coachCache, profiles } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { callCoach } from '@/lib/ai/client';
import { coachSystemPrompt } from '@/lib/ai/prompts';
import { z } from 'zod';

const coachBriefSchema = z.object({
  message: z.string(),
  focus: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    // Check cache
    const cached = await db.query.coachCache.findFirst({
      where: and(
        eq(coachCache.userId, user.id),
        eq(coachCache.type, 'today'),
        eq(coachCache.date, today)
      ),
    });

    if (cached) {
      return NextResponse.json({ brief: cached.content });
    }

    // Fetch user profile
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.id),
    });

    if (!profile || !profile.coachTodayEnabled) {
      return NextResponse.json({ brief: null });
    }

    // Generate brief
    const userPrompt = `Provide a brief motivational message for today's workout. User tone preference: ${profile.coachTone || 'concise'}. Keep it 1-2 sentences.`;

    const result = await callCoach({
      systemPrompt: coachSystemPrompt,
      userPrompt,
      schema: coachBriefSchema,
      maxTokens: 200,
    });

    if (!result.success) {
      return NextResponse.json({ brief: 'Ready to train? Let\'s get stronger!' });
    }

    const brief = result.data.message;

    // Cache result
    await db.insert(coachCache).values({
      id: crypto.randomUUID(),
      userId: user.id,
      type: 'today',
      date: today,
      content: brief,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ brief });

  } catch (error) {
    console.error('[Coach Today] Error:', error);
    return NextResponse.json({ brief: 'Ready to train? Let\'s get stronger!' });
  }
}
```

#### Update CoachBrief Component
```typescript
// app/(auth)/dashboard/CoachBrief.tsx
'use client';

import { useEffect, useState } from 'react';

interface CoachBriefProps {
  userId: string;
}

export function CoachBrief({ userId }: CoachBriefProps) {
  const [brief, setBrief] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/coach/today')
      .then(res => res.json())
      .then(data => {
        setBrief(data.brief);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      </div>
    );
  }

  if (!brief) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4">
      <p className="text-sm text-gray-700">{brief}</p>
    </div>
  );
}
```

#### Success Criteria
- [ ] API generates AI brief
- [ ] Caching reduces API calls
- [ ] CoachBrief displays message
- [ ] Handles disabled state
- [ ] Fallback for errors

---

### 3.2 Exercise Substitution API

**Priority**: MEDIUM - Enhances flexibility

#### Tasks
- [ ] Create `app/api/substitution/route.ts` - POST endpoint
- [ ] Accept exerciseId and reason
- [ ] Use `recommendAlternatives()` from exerciseLibrary
- [ ] Enhance with AI reasoning if needed
- [ ] Log to `substitutionEvents` table
- [ ] Return 2-3 alternatives

#### Code Template
```typescript
// app/api/substitution/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServerClient';
import { db } from '@/drizzle/db';
import { substitutionEvents } from '@/drizzle/schema';
import { recommendAlternatives } from '@/lib/exerciseLibrary';
import { substitutionRequestSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = substitutionRequestSchema.parse(body);

    // Get alternatives
    const alternatives = recommendAlternatives(
      validated.exerciseId,
      validated.constraints || {}
    );

    // Log substitution event
    await db.insert(substitutionEvents).values({
      id: crypto.randomUUID(),
      userId: user.id,
      workoutId: validated.workoutId,
      originalExerciseId: validated.exerciseId,
      substitutedExerciseId: alternatives[0]?.id || null,
      reason: validated.reason,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      alternatives: alternatives.slice(0, 3),
    });

  } catch (error) {
    console.error('[Substitution] Error:', error);
    return NextResponse.json(
      { error: 'Failed to find substitutions' },
      { status: 500 }
    );
  }
}
```

#### Success Criteria
- [ ] API returns valid alternatives
- [ ] Substitution events logged
- [ ] PCOS compatibility respected
- [ ] Equipment constraints enforced

---

### 3.3 Weekly Review Generation

**Priority**: MEDIUM - Progress insights

#### Tasks
- [ ] Create `app/api/coach/weekly/route.ts` - GET endpoint
- [ ] Aggregate past week's workout logs
- [ ] Calculate adherence rate
- [ ] Generate AI review with insights
- [ ] Cache weekly review
- [ ] Return review text

#### Code Template
```typescript
// app/api/coach/weekly/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServerClient';
import { db } from '@/drizzle/db';
import { coachCache, workoutLogs, profiles } from '@/drizzle/schema';
import { eq, and, gte } from 'drizzle-orm';
import { callCoach } from '@/lib/ai/client';
import { coachSystemPrompt } from '@/lib/ai/prompts';
import { z } from 'zod';

const weeklyReviewSchema = z.object({
  summary: z.string(),
  highlights: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const weekKey = getWeekKey(new Date());

  try {
    // Check cache
    const cached = await db.query.coachCache.findFirst({
      where: and(
        eq(coachCache.userId, user.id),
        eq(coachCache.type, 'weekly'),
        eq(coachCache.date, weekKey)
      ),
    });

    if (cached) {
      return NextResponse.json({ review: JSON.parse(cached.content) });
    }

    // Fetch profile
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.id),
    });

    if (!profile || !profile.coachWeeklyEnabled) {
      return NextResponse.json({ review: null });
    }

    // Fetch past week's logs
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const logs = await db.query.workoutLogs.findMany({
      where: and(
        eq(workoutLogs.userId, user.id),
        gte(workoutLogs.completedAt, oneWeekAgo.toISOString())
      ),
    });

    // Calculate metrics
    const adherenceRate = logs.length / (profile.scheduleDaysPerWeek || 3);
    const avgRpe = logs.reduce((sum, log) => sum + (log.overallRpe || 0), 0) / logs.length;

    // Generate review
    const userPrompt = `Generate a weekly review. Past week stats: ${logs.length} workouts completed, ${(adherenceRate * 100).toFixed(0)}% adherence, avg RPE ${avgRpe.toFixed(1)}. Tone: ${profile.coachTone || 'concise'}.`;

    const result = await callCoach({
      systemPrompt: coachSystemPrompt,
      userPrompt,
      schema: weeklyReviewSchema,
      maxTokens: 400,
    });

    if (!result.success) {
      return NextResponse.json({ review: null });
    }

    // Cache result
    await db.insert(coachCache).values({
      id: crypto.randomUUID(),
      userId: user.id,
      type: 'weekly',
      date: weekKey,
      content: JSON.stringify(result.data),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ review: result.data });

  } catch (error) {
    console.error('[Coach Weekly] Error:', error);
    return NextResponse.json({ review: null });
  }
}

function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const weekNumber = Math.ceil(
    ((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7
  );
  return `${year}-W${weekNumber}`;
}
```

#### Success Criteria
- [ ] Weekly review generated
- [ ] Metrics calculated correctly
- [ ] Review cached per week
- [ ] Handles no-data gracefully

---

### Phase 3 Summary

**Files Created**: 3
- app/api/coach/today/route.ts
- app/api/substitution/route.ts
- app/api/coach/weekly/route.ts

**Files Modified**: 1
- app/(auth)/dashboard/CoachBrief.tsx

**Database Tables Used**:
- coachCache (read/write)
- substitutionEvents (write)
- workoutLogs (read)

**Success Metrics**:
- [ ] AI coach brief displayed daily
- [ ] Substitution alternatives accurate
- [ ] Weekly review insightful
- [ ] Caching reduces costs
- [ ] All AI features optional (toggles work)

---

## Phase 4: Progress & Offline (Days 16-20)

### Goal
Build progress tracking UI and offline support indicators.

### 4.1 Progress View with Charts

**Priority**: MEDIUM - User engagement

#### Tasks
- [ ] Create `app/(auth)/progress/ProgressView.tsx`
- [ ] Create `app/(auth)/progress/AdherenceChart.tsx`
- [ ] Create `app/(auth)/progress/VolumeSparkline.tsx`
- [ ] Create `app/(auth)/progress/WeeklyReview.tsx`
- [ ] Create `app/actions/progress.ts` - data fetching
- [ ] Calculate adherence rate (completed vs scheduled)
- [ ] Aggregate volume by week
- [ ] Display sparklines for key exercises

#### Code Template - ProgressView
```typescript
// app/(auth)/progress/ProgressView.tsx
'use client';

import { AdherenceChart } from './AdherenceChart';
import { VolumeSparkline } from './VolumeSparkline';
import { WeeklyReview } from './WeeklyReview';

interface ProgressViewProps {
  adherenceData: Array<{ week: string; rate: number }>;
  volumeData: Array<{ week: string; volume: number }>;
}

export function ProgressView({ adherenceData, volumeData }: ProgressViewProps) {
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Progress</h1>

      {/* Weekly Review */}
      <WeeklyReview />

      {/* Adherence */}
      <section className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Adherence</h2>
        <AdherenceChart data={adherenceData} />
      </section>

      {/* Volume */}
      <section className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Weekly Volume</h2>
        <VolumeSparkline data={volumeData} />
      </section>
    </div>
  );
}
```

_(Detailed chart component code omitted for brevity - use basic SVG or charting library)_

#### Success Criteria
- [ ] Adherence chart displays
- [ ] Volume sparkline shows trends
- [ ] Weekly review integrated
- [ ] Data updates on navigation

---

### 4.2 Offline Queue UI

**Priority**: MEDIUM - PWA enhancement

#### Tasks
- [ ] Create `components/OfflineBanner.tsx` - offline status indicator
- [ ] Create `components/QueueBadge.tsx` - queue count display
- [ ] Create `hooks/useOfflineStatus.ts` - online/offline hook
- [ ] Add banner to app layout
- [ ] Show queue count in bottom navigation

#### Code Template - OfflineBanner
```typescript
// components/OfflineBanner.tsx
'use client';

import { useOfflineStatus } from '@/hooks/useOfflineStatus';

export function OfflineBanner() {
  const { isOffline, queueCount } = useOfflineStatus();

  if (!isOffline && queueCount === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-100 border-b border-yellow-300 p-2 text-center text-sm">
      {isOffline && <span>Offline mode - changes will sync automatically</span>}
      {queueCount > 0 && <span> • {queueCount} workout(s) pending sync</span>}
    </div>
  );
}
```

#### Code Template - useOfflineStatus Hook
```typescript
// hooks/useOfflineStatus.ts
'use client';

import { useState, useEffect } from 'react';
import { getQueuedLogCount } from '@/lib/offlineQueue';

export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    const updateStatus = () => {
      setIsOffline(!navigator.onLine);
      getQueuedLogCount().then(setQueueCount);
    };

    updateStatus();

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    const interval = setInterval(updateStatus, 5000);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      clearInterval(interval);
    };
  }, []);

  return { isOffline, queueCount };
}
```

#### Success Criteria
- [ ] Banner shows when offline
- [ ] Queue count accurate
- [ ] Updates in real-time
- [ ] Auto-hides when online

---

### Phase 4 Summary

**Files Created**: 7
- app/(auth)/progress/ProgressView.tsx
- app/(auth)/progress/AdherenceChart.tsx
- app/(auth)/progress/VolumeSparkline.tsx
- app/(auth)/progress/WeeklyReview.tsx
- app/actions/progress.ts
- components/OfflineBanner.tsx
- hooks/useOfflineStatus.ts

**Files Modified**: 2
- app/(auth)/progress/page.tsx
- app/layout.tsx (add OfflineBanner)

**Success Metrics**:
- [ ] Progress view displays metrics
- [ ] Charts render correctly
- [ ] Offline banner functional
- [ ] Queue syncs automatically

---

## Phase 5: Testing & Documentation (Days 21-25)

### Goal
Ensure code quality, test coverage, and comprehensive documentation.

### 5.1 Unit Tests

#### Tasks
- [ ] Create `tests/progression.test.ts` - progression engine tests
- [ ] Create `tests/offlineQueue.test.ts` - offline queue tests
- [ ] Create `tests/calendar.test.ts` - calendar generation tests
- [ ] Create `tests/postProcessor.test.ts` - PCOS guardrails tests
- [ ] Create `tests/validation.test.ts` - schema validation tests
- [ ] Achieve >80% coverage for lib/ modules

#### Code Template - Progression Tests
```typescript
// tests/progression.test.ts
import { describe, it, expect } from 'vitest';
import { computeProgressionTargets, isDeloadWeek } from '@/lib/progression';

describe('Progression Engine', () => {
  it('should detect deload weeks correctly', () => {
    expect(isDeloadWeek(4, 12)).toBe(true);
    expect(isDeloadWeek(8, 12)).toBe(true);
    expect(isDeloadWeek(2, 12)).toBe(false);
  });

  it('should compute progressive overload', () => {
    const targets = computeProgressionTargets({
      weekNumber: 2,
      historicalLogs: [],
      planMicrocycle: {},
      hasPcos: false,
    });
    expect(targets).toBeDefined();
  });
});
```

#### Success Criteria
- [ ] All tests pass
- [ ] Coverage >80%
- [ ] CI/CD integration (optional)

---

### 5.2 Integration Tests

#### Tasks
- [ ] Create `tests/api/log.test.ts` - workout logging API tests
- [ ] Test authentication flows
- [ ] Test database operations
- [ ] Mock Supabase client

#### Success Criteria
- [ ] API tests pass
- [ ] Auth enforced
- [ ] Database mocks work

---

### 5.3 README & Documentation

#### Tasks
- [ ] Rewrite `README.md` - project overview
- [ ] Create `docs/ARCHITECTURE.md` - system design
- [ ] Create `docs/API.md` - API documentation
- [ ] Create `docs/TESTING.md` - testing guide
- [ ] Create `docs/DEPLOYMENT.md` - deployment steps
- [ ] Document environment variables
- [ ] Add setup instructions
- [ ] Include troubleshooting section

#### README Template
```markdown
# FitCoach

AI-powered strength training app designed for PCOS-friendly progressive overload.

## Features
- Personalized workout plans with AI planner
- PCOS-aware exercise selection and guardrails
- Progressive load calculation with deload weeks
- Offline-first workout logging
- AI coach for daily briefs and weekly reviews
- Exercise substitution suggestions

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Supabase (Auth, PostgreSQL)
- Drizzle ORM
- OpenAI API (plan generation, coach features)
- PWA with offline support

## Setup
1. Clone repo
2. Install dependencies: `pnpm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `pnpm db:push`
5. Seed database: `pnpm seed`
6. Start dev server: `pnpm dev`

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL_PLANNER=gpt-4o
OPENAI_MODEL_COACH=gpt-4o-mini
```

## Testing
- Unit tests: `pnpm test`
- Type check: `pnpm typecheck`
- Lint: `pnpm lint`

## Deployment
See docs/DEPLOYMENT.md

## License
MIT
```

#### Success Criteria
- [ ] README comprehensive
- [ ] Architecture documented
- [ ] API routes documented
- [ ] Setup instructions clear

---

### Phase 5 Summary

**Files Created**: 10
- tests/progression.test.ts
- tests/offlineQueue.test.ts
- tests/calendar.test.ts
- tests/postProcessor.test.ts
- tests/validation.test.ts
- tests/api/log.test.ts
- docs/ARCHITECTURE.md
- docs/API.md
- docs/TESTING.md
- docs/DEPLOYMENT.md

**Files Modified**: 1
- README.md (complete rewrite)

**Success Metrics**:
- [ ] Test coverage >80%
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Setup instructions verified

---

## Implementation Checklist

### Phase 1: Core Logging (Days 1-5)
- [ ] Workout logging API endpoint
- [ ] Today view component
- [ ] Exercise logger component
- [ ] Skip Today functionality
- [ ] Coach brief placeholder

### Phase 2: Progression & Settings (Days 6-10)
- [ ] Progression computation API
- [ ] Progression triggers
- [ ] Settings form UI
- [ ] Profile update actions

### Phase 3: AI Features (Days 11-15)
- [ ] AI coach Today brief
- [ ] Exercise substitution API
- [ ] Weekly review generation
- [ ] Coach brief caching

### Phase 4: Progress & Offline (Days 16-20)
- [ ] Progress view with charts
- [ ] Adherence metrics
- [ ] Offline banner
- [ ] Queue badge

### Phase 5: Testing & Documentation (Days 21-25)
- [ ] Unit tests
- [ ] Integration tests
- [ ] README refresh
- [ ] Architecture docs

---

## Files Summary

### To Create (35 files)

**API Routes (7)**:
- app/api/log/route.ts
- app/api/progression/compute/route.ts
- app/api/coach/today/route.ts
- app/api/coach/debrief/route.ts _(optional)_
- app/api/coach/weekly/route.ts
- app/api/substitution/route.ts

**Server Actions (4)**:
- app/actions/dashboard.ts
- app/actions/workout.ts
- app/actions/progress.ts
- app/actions/settings.ts

**Components (12)**:
- app/(auth)/dashboard/TodayView.tsx
- app/(auth)/dashboard/ExerciseLogger.tsx
- app/(auth)/dashboard/CoachBrief.tsx
- app/(auth)/progress/ProgressView.tsx
- app/(auth)/progress/AdherenceChart.tsx
- app/(auth)/progress/VolumeSparkline.tsx
- app/(auth)/progress/WeeklyReview.tsx
- app/(auth)/settings/SettingsForm.tsx
- components/SubstitutionDialog.tsx
- components/OfflineBanner.tsx
- components/Toggle.tsx
- components/Slider.tsx

**Tests (6)**:
- tests/progression.test.ts
- tests/offlineQueue.test.ts
- tests/calendar.test.ts
- tests/postProcessor.test.ts
- tests/validation.test.ts
- tests/api/log.test.ts

**Hooks (1)**:
- hooks/useOfflineStatus.ts

**Documentation (5)**:
- README.md (rewrite)
- docs/ARCHITECTURE.md
- docs/API.md
- docs/TESTING.md
- docs/DEPLOYMENT.md

### To Modify (5 files)
- app/(auth)/dashboard/page.tsx
- app/(auth)/progress/page.tsx
- app/(auth)/settings/page.tsx
- app/layout.tsx
- app/api/log/route.ts

---

## Dependencies

All required infrastructure exists:
- ✅ Database tables (workouts, workoutLogs, workoutLogSets, progressionTargets, coachCache, substitutionEvents)
- ✅ Validation schemas (logRequestSchema, substitutionRequestSchema)
- ✅ Utility functions (offlineQueue, progression, calendar)
- ✅ AI integration (OpenAI client, prompts, post-processor)
- ✅ Auth (Supabase SSR)
- ✅ Testing (Vitest configured)

**No blockers - ready to implement!**

---

## Success Metrics

### Before Implementation
- Today view: Placeholder
- Workout logging: 0%
- Progress tracking: 0%
- Settings: Sign-out only
- AI features: Plan generation only
- Offline support: Infrastructure only
- Test coverage: <5%

### After Implementation (Target)
- Today view: Fully functional with logger
- Workout logging: 100% (API + UI)
- Progress tracking: Charts + metrics
- Settings: Full preference management
- AI features: Brief + substitution + review
- Offline support: Visual indicators + auto-sync
- Test coverage: >80%

---

## Timeline

**Total**: 25 days (5 phases × 5 days each)

- **Week 1 (Days 1-5)**: Core logging infrastructure
- **Week 2 (Days 6-10)**: Progression + Settings
- **Week 3 (Days 11-15)**: AI features
- **Week 4 (Days 16-20)**: Progress + Offline UI
- **Week 5 (Days 21-25)**: Testing + Documentation

---

## Notes

- Keep UI monochrome (grayscale design system)
- All AI calls use caching to minimize costs
- Offline-first: Queue logs locally, sync when online
- PCOS guardrails enforced in post-processor
- Progressive overload: 2-5% increase per week
- Deload weeks: Week 4 and 8 (if plan ≥10 weeks)

---

Last Updated: 2025-10-31
