# Exercise Management & Custom Plan Creation - Implementation Guide

**Date**: 2025-11-05
**Status**: Planning Phase
**Priority**: High

---

## 🎯 Overview

This document outlines the implementation plan for:
1. **Exercise Library Management** ✅ (Partially Complete)
2. **Plan Exercise Management** ❌ (Not Built)
3. **Custom Plan Creation** ❌ (Not Built)

---

## ✅ What's Already Built

### Exercise Library (User Exercises)

**Database Schema**: `user_exercises` table
**API Endpoints**:
- `GET /api/exercises` - Fetch user's saved exercises
- `POST /api/exercises` - Add exercise to library
- `DELETE /api/exercises` - Remove exercise from library

**UI Components**:
- `ExerciseBrowser` - Browse and search ExerciseDB
- `MyExercises` - View saved exercises
- `ExerciseManagement` - Main exercise management view

**Current Status**:
- ⚠️ **Database migration not applied** (causes 500 error)
- ✅ Code is ready and functional once migration is applied

---

## ❌ What Needs to Be Built

### 1. Plan Exercise Management

**Goal**: Allow users to add/remove exercises from existing workout plans

#### Current Plan Structure

Plans store exercises in two places:

1. **Plan Level** (`plans.microcycle` JSONB):
```typescript
type PlanMicrocycle = {
  id: string;
  weeks: number;
  daysPerWeek: number;
  pattern: Array<{
    dayIndex: number;
    focus: string;
    blocks: Array<{
      type: "warmup" | "strength" | "accessory" | "conditioning" | "recovery";
      title: string;
      durationMinutes: number;
      exercises: Array<{
        id: string;           // ExerciseDB ID or custom ID
        name: string;
        equipment: string;
        sets: number;
        reps: string;
        tempo?: string;
        cues?: string[];
        notes?: string;
      }>;
    }>;
  }>;
};
```

2. **Workout Level** (`workouts.payload` JSONB):
```typescript
type WorkoutPayload = {
  workoutId: string;
  focus: string;
  blocks: Array<{
    type: "warmup" | "primary" | "accessory" | "conditioning" | "finisher";
    title: string;
    exercises: Array<{
      id: string;
      name: string;
      equipment: string;
      sets: number;
      reps: string;
      tempo?: string;
      cues?: string[];
      restSeconds?: number;
    }>;
  }>;
};
```

#### Required API Endpoints

**1. Add Exercise to Workout**
```
POST /api/workouts/[workoutId]/exercises
Body: {
  blockIndex: number;
  exercise: {
    id: string;
    name: string;
    equipment: string;
    sets: number;
    reps: string;
    tempo?: string;
    cues?: string[];
    restSeconds?: number;
  };
  position?: number; // Insert at specific position (default: end)
}
```

**2. Remove Exercise from Workout**
```
DELETE /api/workouts/[workoutId]/exercises/[exerciseId]
Query: blockIndex=0
```

**3. Update Exercise in Workout**
```
PATCH /api/workouts/[workoutId]/exercises/[exerciseId]
Body: {
  blockIndex: number;
  updates: Partial<Exercise>;
}
```

**4. Reorder Exercises in Workout**
```
PATCH /api/workouts/[workoutId]/exercises/reorder
Body: {
  blockIndex: number;
  exerciseId: string;
  newPosition: number;
}
```

#### Required UI Components

**1. Workout Editor Modal**
- View workout details
- Edit exercises in each block
- Add/remove exercises
- Reorder exercises via drag-and-drop
- Save changes

**2. Exercise Picker Component**
- Search user's exercise library
- Filter by body part, equipment, etc.
- Select exercise to add to workout
- Preview exercise details (image, instructions, etc.)

**3. Exercise Card with Actions**
- Display exercise details
- Edit sets/reps inline
- Remove exercise button
- Drag handle for reordering

#### Implementation Considerations

**Challenge**: Exercises are embedded in JSONB fields, not separate tables
- **Pros**: Fast reads, no joins needed
- **Cons**: Updates require reading entire JSON, modifying, and writing back

**Solution**:
1. Read workout from database
2. Parse JSON payload
3. Modify exercises array
4. Validate changes
5. Update workout with new payload
6. Also update `plans.microcycle` if this is the template workout

**Data Consistency**:
- When editing a workout, check if it's the first week
- If first week → also update the plan's microcycle template
- If later weeks → only update the specific workout instance

---

### 2. Custom Plan Creation

**Goal**: Allow users to create their own workout plans from scratch

#### Required Features

**A. Plan Builder UI**
- Set plan parameters:
  - Duration (weeks)
  - Days per week
  - Minutes per session
  - Start date
- Choose workout days
- Set plan title and description

**B. Workout Template Builder**
- For each workout day:
  - Set focus (e.g., "Upper Body", "Lower Body")
  - Add blocks (warmup, strength, accessory, etc.)
  - Add exercises to each block
  - Configure sets/reps for each exercise

**C. API Endpoints**

**1. Create Custom Plan**
```
POST /api/plan/custom
Body: {
  title: string;
  summary?: string;
  durationWeeks: number;
  daysPerWeek: number;
  minutesPerSession: number;
  preferredDays: PreferredDay[];
  startDate: string;
  microcycle: PlanMicrocycle;
}
```

**2. Generate Workouts from Template**
- Similar to AI plan generation
- Use the custom microcycle to expand into weekly workouts
- Reuse existing `expandPlannerResponseInitialWeek` function

#### Implementation Steps

1. **Create Custom Plan Form** (`/app/(auth)/plan/create/page.tsx`)
   - Multi-step wizard
   - Step 1: Plan parameters
   - Step 2: Workout templates
   - Step 3: Exercise selection for each workout
   - Step 4: Review and create

2. **Create Workout Template Builder** (`components/WorkoutTemplateBuilder.tsx`)
   - Add/remove blocks
   - Configure block types
   - Add exercises from library
   - Set sets/reps/tempo for each exercise

3. **Create Custom Plan API** (`/app/api/plan/custom/route.ts`)
   - Validate plan structure
   - Create plan record
   - Generate workout instances
   - Set plan as active if user wants

4. **Plan Selection Screen**
   - List existing plans
   - Options: "Generate with AI" or "Create Custom Plan"
   - Allow switching between plans

---

### 3. Hybrid Approach: AI + Editing

**Goal**: Generate plan with AI, then customize it

This is likely the **best user experience**:
1. User generates plan with AI (current functionality)
2. User reviews the generated plan
3. User can edit individual workouts:
   - Add/remove exercises
   - Adjust sets/reps
   - Reorder exercises
   - Substitute exercises
4. Changes are saved and persist

**Benefits**:
- Users get AI-powered starting point
- Users have full control to customize
- Less intimidating than building from scratch

**Implementation**: Build the Workout Editor first (section 1), then add "Create Custom Plan" later.

---

## 🗺️ Recommended Implementation Order

### Phase 1: Fix Current Issue (Immediate)
1. ✅ Apply database migration for `user_exercises` table
2. ✅ Test exercise library functionality
3. ✅ Verify users can save/remove exercises

### Phase 2: Workout Exercise Management (High Priority)
1. Create workout editor API endpoints
2. Build workout editor modal UI
3. Build exercise picker component
4. Add edit buttons to workout cards
5. Test adding/removing exercises from workouts

### Phase 3: Custom Plan Creation (Medium Priority)
1. Design plan builder UI/UX
2. Create workout template builder component
3. Build custom plan API
4. Create plan selection/management screen
5. Test end-to-end custom plan flow

### Phase 4: Polish & Enhancement (Low Priority)
1. Drag-and-drop reordering
2. Exercise preview/details modal
3. Exercise substitution suggestions (AI-powered)
4. Plan templates library
5. Share custom plans with community

---

## 📝 Database Schema Considerations

### Option A: Keep Current Structure (Recommended)
- ✅ Exercises embedded in JSON (current)
- ✅ Fast reads, simple queries
- ❌ Updates require full JSON replacement
- **Use Case**: Small number of edits, performance-critical reads

### Option B: Add Separate Exercise Tables
```sql
CREATE TABLE plan_exercises (
  id UUID PRIMARY KEY,
  plan_id UUID REFERENCES plans(id),
  workout_day_index INT,
  block_index INT,
  exercise_position INT,
  exercise_data JSONB
);
```
- ✅ Easier updates, can modify individual exercises
- ❌ Requires joins for every workout view
- ❌ Migration complexity
- **Use Case**: Frequent edits, less concern about read performance

**Recommendation**: Keep current structure (Option A) for now. The JSON approach is working well and matches the AI-generated plan structure. Only migrate to Option B if you see performance issues with updates.

---

## 🧪 Testing Checklist

### Exercise Library
- [ ] User can browse exercises from ExerciseDB
- [ ] User can save exercise to library
- [ ] User can remove exercise from library
- [ ] Saved exercises persist across sessions
- [ ] User cannot see other users' exercises

### Workout Editing
- [ ] User can view workout details
- [ ] User can add exercise from library to workout
- [ ] User can remove exercise from workout
- [ ] User can edit sets/reps/rest for exercises
- [ ] User can reorder exercises
- [ ] Changes save successfully
- [ ] Changes reflect immediately in UI

### Custom Plan Creation
- [ ] User can create plan from scratch
- [ ] User can set all plan parameters
- [ ] User can build workout templates
- [ ] Plan generates correct workout instances
- [ ] Custom plan appears in plan list
- [ ] User can activate custom plan

---

## 🚀 Quick Start: Fix the 500 Error

1. **Apply the migration**:
   - Open Supabase Dashboard → SQL Editor
   - Run `supabase-user-exercises-migration.sql`
   - Verify all checks pass ✅

2. **Test the exercise library**:
   - Navigate to `/exercises` in your app
   - Browse exercises
   - Try saving an exercise
   - Check if it appears in "My Exercises"

3. **Check for errors**:
   - Open browser console
   - Verify `/api/exercises` returns 200 (not 500)
   - Confirm exercises load successfully

---

## 📚 Related Files

**Schema & Migrations**:
- `drizzle/schema.ts` - Database schema definitions
- `drizzle/migrations/0003_great_sauron.sql` - User exercises table
- `supabase-user-exercises-migration.sql` - Manual migration script

**API Routes**:
- `app/api/exercises/route.ts` - Exercise library CRUD
- `app/api/exercises/browse/route.ts` - Browse ExerciseDB
- `app/api/exercises/filters/route.ts` - Filter options

**Components**:
- `components/ExerciseBrowser.tsx` - Exercise browsing UI
- `components/MyExercises.tsx` - User's saved exercises
- `app/(auth)/exercises/ExerciseManagement.tsx` - Main management view

**Libraries**:
- `lib/exercisedb.ts` - ExerciseDB API client

---

## 💡 Future Enhancements

- **AI Exercise Substitution**: Smart suggestions for replacing exercises
- **Exercise Analytics**: Track which exercises you do most
- **Community Plans**: Share and discover plans from other users
- **Exercise Video Integration**: Embed instructional videos
- **Form Check**: AI-powered form checking via camera
- **Progressive Overload Tracking**: Auto-suggest weight increases
- **Deload Week Automation**: AI-adjusted intensity on deload weeks
