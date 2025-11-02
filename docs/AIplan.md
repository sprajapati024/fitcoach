# FitCoach OpenAI Agents SDK Migration Plan

## Overview

**Current Problem**: Plan generation timing out (57-58s) with empty responses from GPT-5 models, large context loading causing performance issues.

**Solution**: Migrate to OpenAI Agents SDK (`@openai/agents`) with function tools, stateful sessions, and multi-agent workflows.

**Priority Order**: Planner → Coach → Substitution → Load Calculation

**Last Updated**: 2025-11-04

---

### Update 2025-11-04
- Shipped `/api/coach/today` on top of Agents SDK utilities; daily briefs now cache per user/day and respect profile tone flags.
- Dashboard coach card calls the new route with optimistic refresh, falling back to offline copy when needed.
- Workout logging API distinguishes skipped vs. completed sessions so Coach + Progress analytics share the same status signal.

### Update 2025-11-03
- Plan persistence now stores relative workouts (no default session dates) and relies on `buildPlanSchedule` during activation for timezone-safe alignment.
- Added a backfill script (`pnpm backfill:plans`) and unit test coverage to validate the agent output expansion path.

## Phase 0: Setup & Preparation ✅

### Goal
Set up the OpenAI Agents SDK infrastructure and prepare the codebase for migration.

**Status**: COMPLETED (2025-10-31)

### Tasks
- [x] Install dependencies: `pnpm install @openai/agents` (zod already at v4.1.12)
- [x] Update to use `gpt-4o` model (handled in agent configuration)
- [x] Create directory structure: `lib/ai/agents/`
- [x] Agent types defined inline (no separate types.ts needed)

### Success Criteria
- [x] Dependencies installed successfully (@openai/agents 0.2.1)
- [x] Directory structure in place
- [x] No breaking changes to existing functionality

### Known Issues
- ✅ RESOLVED: Build errors with Zod schema conversion - Fixed in commit c4b9a5d ([GitHub Issue #4](https://github.com/sprajapati024/fitcoach/issues/4))
  - Solution: Use union pattern `z.union([z.string(), z.null()]).optional()` for optional fields
  - All tool schemas and validation schemas updated

---

## Phase 1: Planner Agent (Priority 1 - Fix Timeout Issue) ✅

### Goal
Replace the current monolithic planner with an agent-based approach using function tools to dynamically query exercises.

**Status**: COMPLETED (2025-11-02) - Implementation complete, build errors resolved, ready for production testing

### 1.1 Create Shared Tool Utilities ✅

**Status**: COMPLETED (2025-10-31)

- [x] Create `lib/ai/agents/tools.ts`
- [x] Implement `queryExercisesTool`:
  - Filters exercises by movement, impact, PCOS compatibility
  - Returns: "exercise_id: Exercise Name" list
- [x] Implement `getExerciseDetailsTool`:
  - Returns full exercise info for specific IDs
  - Includes: equipment, muscles, notes
- [x] Implement `validateTimeBudgetTool`:
  - Validates session fits within time constraints
  - Returns: pass/fail + suggestions if over budget
- [x] Tools use Zod schemas for type safety

**Resolution**:
- ✅ Zod schema conversion fixed - [GitHub Issue #4](https://github.com/sprajapati024/fitcoach/issues/4) CLOSED
  - Solution: Use union pattern `z.union([z.string(), z.null()]).optional()` for all optional fields
  - Applied to: `movement`, `impact`, `pcosFriendly` parameters in tools.ts

### Code Template for Tools
```typescript
import { tool } from '@openai/agents';
import { z } from 'zod';
import { listExercises } from '@/lib/exerciseLibrary';

export const queryExercisesTool = tool({
  name: 'query_exercises',
  description: 'Search exercises by movement pattern, impact level, and PCOS compatibility',
  parameters: z.object({
    movement: z.union([z.string(), z.null()]).optional().describe('Movement pattern: squat, hinge, lunge, etc.'),
    impact: z.union([z.enum(['low', 'moderate', 'high']), z.null()]).optional(),
    pcosFriendly: z.union([z.boolean(), z.null()]).optional().describe('Filter for PCOS-safe exercises'),
  }),
  async execute({ movement, impact, pcosFriendly }) {
    const exercises = listExercises();
    const filtered = exercises.filter(ex => {
      if (movement && ex.movement !== movement) return false;
      if (impact && ex.impact !== impact) return false;
      if (pcosFriendly !== undefined && ex.isPcosFriendly !== pcosFriendly) return false;
      return true;
    });
    return filtered.map(ex => `${ex.id}: ${ex.name}`).join(', ');
  },
});

export const getExerciseDetailsTool = tool({
  name: 'get_exercise_details',
  description: 'Get full details for specific exercise IDs',
  parameters: z.object({
    exerciseIds: z.array(z.string()).describe('Array of exercise IDs to fetch'),
  }),
  async execute({ exerciseIds }) {
    const exercises = listExercises();
    const details = exercises
      .filter(ex => exerciseIds.includes(ex.id))
      .map(ex => ({
        id: ex.id,
        name: ex.name,
        movement: ex.movement,
        equipment: ex.equipment,
        primaryMuscle: ex.primaryMuscle,
        secondaryMuscles: ex.secondaryMuscles,
        impact: ex.impact,
        isPcosFriendly: ex.isPcosFriendly,
        notes: ex.notes,
      }));
    return JSON.stringify(details, null, 2);
  },
});

export const validateTimeBudgetTool = tool({
  name: 'validate_time_budget',
  description: 'Check if planned session duration fits within time budget',
  parameters: z.object({
    blocks: z.array(z.object({
      type: z.string(),
      durationMinutes: z.number(),
    })),
    maxMinutes: z.number(),
  }),
  async execute({ blocks, maxMinutes }) {
    const totalMinutes = blocks.reduce((sum, block) => sum + block.durationMinutes, 0);
    const isValid = totalMinutes <= maxMinutes;
    return JSON.stringify({
      isValid,
      totalMinutes,
      maxMinutes,
      overage: isValid ? 0 : totalMinutes - maxMinutes,
      suggestion: isValid ? 'Fits within budget' : 'Reduce accessory volume or conditioning time',
    });
  },
});
```

### 1.2 Create Planner Agent ✅

**Status**: COMPLETED (2025-10-31)

- [x] Create `lib/ai/agents/planner-agent.ts`
- [x] Define `plannerAgent` with instructions from `plannerSystemPrompt`
- [x] Configure to use `gpt-4o` model
- [x] Attach all three tools (queryExercises, getExerciseDetails, validateTimeBudget)
- [x] Validate output with `plannerResponseSchema.parse()` from `lib/validation.ts`
- [x] Export `runPlannerAgent(profile)` function
- [x] Build compact prompts (no exercise library dump)

### Code Template for Planner Agent
```typescript
import { Agent, run } from '@openai/agents';
import { plannerResponseSchema } from '@/lib/validation';
import { plannerSystemPrompt } from '@/lib/ai/prompts';
import { queryExercisesTool, getExerciseDetailsTool, validateTimeBudgetTool } from './tools';
import type { profiles } from '@/drizzle/schema';

type Profile = typeof profiles.$inferSelect;

export const plannerAgent = new Agent({
  name: 'FitCoach Planner',
  instructions: plannerSystemPrompt,
  model: 'gpt-4o',
  tools: [queryExercisesTool, getExerciseDetailsTool, validateTimeBudgetTool],
});

export async function runPlannerAgent(profile: Profile) {
  const userPrompt = buildCompactPlannerPrompt(profile);

  const result = await run(plannerAgent, userPrompt, {
    outputSchema: plannerResponseSchema,
  });

  return {
    success: true,
    data: result.finalOutput,
  };
}

// Simplified prompt builder (no exercise library dump)
function buildCompactPlannerPrompt(profile: Profile): string {
  const payload = {
    user: {
      sex: profile.sex || 'unspecified',
      age: calculateAge(profile.dateOfBirth),
      height_cm: Number(profile.heightCm) || 170,
      weight_kg: Number(profile.weightKg) || 70,
    },
    flags: {
      pcos: profile.hasPcos,
    },
    experience: profile.experienceLevel,
    schedule: {
      days_per_week: profile.scheduleDaysPerWeek || 3,
      minutes_per_session: profile.scheduleMinutesPerSession || 60,
      weeks: profile.scheduleWeeks || 8,
      preferred_days: profile.preferredDays || [],
    },
    equipment: {
      available: profile.equipment || [],
    },
    goal_bias: profile.goalBias,
    constraints: {
      avoid: profile.avoidList || [],
      no_high_impact: profile.noHighImpact,
    },
  };

  return `Generate a training plan for:

${JSON.stringify(payload, null, 2)}

INSTRUCTIONS:
- Use query_exercises tool to find suitable exercises by movement/impact/PCOS criteria
- Use get_exercise_details tool to get full info for selected exercises
- Use validate_time_budget tool to ensure sessions fit within ${payload.schedule.minutes_per_session} minutes
- Create ${payload.schedule.weeks}-week plan with ${payload.schedule.days_per_week} sessions/week
${payload.flags.pcos ? '- PCOS: Include 2-3x Zone-2 cardio/week (15-20 min), NO HIIT >60s' : ''}
${payload.constraints.no_high_impact ? '- Avoid high-impact exercises' : ''}
${payload.constraints.avoid.length > 0 ? `- Avoid: ${payload.constraints.avoid.join(', ')}` : ''}

Return structured JSON matching the PlannerResponse schema.`;
}

function calculateAge(dateOfBirth: string | null): number {
  if (!dateOfBirth) return 30;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
```

### 1.3 Update API Route ✅

**Status**: COMPLETED (2025-10-31)

- [x] Open `app/api/plan/generate/route.ts`
- [x] Import `runPlannerAgent` from new agent file
- [x] Replace `callPlanner()` with `runPlannerAgent()`
- [x] Keep all existing post-processing logic (`postProcessPlannerResponse`, `expandPlannerResponse`)
- [x] Add enhanced error logging with try/catch
- [x] Update planner version to "gpt-4o-agents" in database

### Code Changes for API Route
```typescript
import { runPlannerAgent } from '@/lib/ai/agents/planner-agent';
import { callPlanner } from '@/lib/ai/client'; // Fallback
import { serverEnv } from '@/lib/env/server';

// Inside the POST handler:
const useAgentPlanner = serverEnv.USE_AGENT_PLANNER === 'true';

const aiResult = useAgentPlanner
  ? await runPlannerAgent(profile)
  : await callPlanner({
      systemPrompt: plannerSystemPrompt,
      userPrompt: buildPlannerPrompt(profile),
      schema: plannerResponseSchema,
    });

if (!aiResult.success) {
  console.error('[Plan Generation] AI call failed:', aiResult.error);
  return NextResponse.json(
    { error: `Plan generation failed: ${aiResult.error}` },
    { status: 500 }
  );
}

// Continue with existing post-processing...
```

### 1.4 Testing & Validation ✅

**Status**: READY - Build errors resolved (2025-11-02)

- [x] Build errors resolved - all type checking passes
- [x] UUID format and foreign key constraints fixed
- [ ] Test with existing user profiles (ready for production testing)
- [ ] Verify plan generation completes in <20s
- [ ] Check exercise selections are valid
- [ ] Validate PCOS guardrails still apply
- [ ] Monitor token usage (should be ~60% reduction)
- [ ] Test error handling (invalid profile data)

### Success Criteria
- [x] Build errors resolved - all type checking passes
- [x] UUID and foreign key constraints fixed
- [x] All existing post-processing works (code intact)
- [x] No breaking changes to plan structure
- [ ] Plan generation success rate >95% (ready for production testing)
- [ ] Response time <20 seconds (ready for production testing)
- [ ] Token usage reduced by 50%+ (ready for production testing)

### Blocking Issues (RESOLVED ✅)
- ✅ **Build Error FIXED**: Zod schema to JSON Schema conversion - [GitHub Issue #4](https://github.com/sprajapati024/fitcoach/issues/4) CLOSED
  - Solution: Use union pattern `z.union([type, z.null()]).optional()` for all optional fields
  - Fixed in commit c4b9a5d (2025-11-02)
  - Applied to: tools.ts, validation.ts, planner-agent.ts
  - All builds now passing successfully

---

## Phase 2: Coach Features (Priority 2)

### Goal
Implement missing coach features (daily brief, debrief, weekly review) using stateful agents.

### 2.0 Ship Coach Today Brief API ✅

**Status**: COMPLETED (2025-11-04)

- [x] Add `/api/coach/today` route that builds context (profile, workout, recent logs) and calls `callCoach` with new prompt scaffolding.
- [x] Cache responses per user/day in `coachCache` with automatic expiry.
- [x] Update dashboard `CoachBrief` client to fetch, refresh, and handle offline fallback.
- [x] Ensure skip vs. complete signals flow from workout logs for richer prompts.

### 2.1 Create Coach Agent

> **Note**: Today brief ships via direct `callCoach` usage; this section tracks the follow-up work to promote a dedicated multi-turn coach agent that can power debriefs and weekly reviews.

- [ ] Create `lib/ai/agents/coach-agent.ts`
- [ ] Define coach tools:
  - [ ] `getTodayWorkout(userId, date)` → Fetches workout from DB
  - [ ] `getRecentLogs(userId, days)` → Retrieves workout logs
  - [ ] `getProgressionTrends(userId, weeks)` → Analyzes trends
- [ ] Create `CoachAgent` with personality configuration
- [ ] Support `profile.coachTone` (concise, encouraging, technical)
- [ ] Enable conversation history tracking

### Code Template for Coach Agent
```typescript
import { Agent, run } from '@openai/agents';
import { z } from 'zod';
import { tool } from '@openai/agents';
import { db } from '@/drizzle/db';
import { workouts, workoutLogs, profiles } from '@/drizzle/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { coachSystemPrompt } from '@/lib/ai/prompts';

const getTodayWorkoutTool = tool({
  name: 'get_today_workout',
  description: 'Fetch the user\'s workout for today',
  parameters: z.object({
    userId: z.string(),
    date: z.string().describe('ISO date string'),
  }),
  async execute({ userId, date }) {
    const workout = await db.query.workouts.findFirst({
      where: and(
        eq(workouts.userId, userId),
        eq(workouts.scheduledDate, date)
      ),
    });
    return workout ? JSON.stringify(workout.payload) : 'No workout scheduled for today';
  },
});

const getRecentLogsTool = tool({
  name: 'get_recent_logs',
  description: 'Get workout logs from the past N days',
  parameters: z.object({
    userId: z.string(),
    days: z.number().default(7),
  }),
  async execute({ userId, days }) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const logs = await db.query.workoutLogs.findMany({
      where: and(
        eq(workoutLogs.userId, userId),
        gte(workoutLogs.completedAt, cutoffDate.toISOString())
      ),
      orderBy: [desc(workoutLogs.completedAt)],
      limit: 10,
    });

    return JSON.stringify(logs.map(log => ({
      date: log.completedAt,
      duration: log.durationMinutes,
      rpe: log.overallRpe,
      notes: log.notes,
    })));
  },
});

const getProgressionTrendsTool = tool({
  name: 'get_progression_trends',
  description: 'Analyze volume and intensity trends over past weeks',
  parameters: z.object({
    userId: z.string(),
    weeks: z.number().default(4),
  }),
  async execute({ userId, weeks }) {
    // Implement trend analysis logic
    // Calculate average volume, intensity, adherence
    return JSON.stringify({
      averageWeeklyVolume: 1200, // Placeholder
      averageIntensity: 7.5,
      adherenceRate: 0.85,
      trend: 'increasing',
    });
  },
});

export function createCoachAgent(tone: string = 'concise') {
  const toneInstructions = {
    concise: 'Be brief and to-the-point. 2-3 sentences max.',
    encouraging: 'Be supportive and motivating. Celebrate wins.',
    technical: 'Focus on biomechanics and programming details.',
  };

  return new Agent({
    name: 'FitCoach',
    instructions: `${coachSystemPrompt}\n\nTone: ${toneInstructions[tone] || toneInstructions.concise}`,
    model: 'gpt-4o-mini',
    tools: [getTodayWorkoutTool, getRecentLogsTool, getProgressionTrendsTool],
  });
}

export async function runCoachAgent(
  userId: string,
  tone: string,
  promptType: 'today' | 'debrief' | 'weekly',
  context?: Record<string, unknown>
) {
  const agent = createCoachAgent(tone);

  const prompts = {
    today: `Provide a brief for today's workout. Use get_today_workout to see what's planned. Keep it motivating and focused.`,
    debrief: `The user just completed a workout. Use get_recent_logs to see what they did. Provide encouraging feedback and highlight one key takeaway.`,
    weekly: `Provide a weekly review. Use get_progression_trends and get_recent_logs to analyze the past week. Highlight progress and suggest one adjustment.`,
  };

  const result = await run(agent, prompts[promptType]);
  return result.finalOutput;
}
```

### 2.2 Create API Routes

- [ ] Create `app/api/coach/today/route.ts`
  - [ ] Authenticate user
  - [ ] Check `coachCache` for existing brief
  - [ ] If cache miss or expired, run coach agent
  - [ ] Cache response with midnight expiry
  - [ ] Return brief text

- [ ] Create `app/api/coach/debrief/route.ts`
  - [ ] Accept workout log ID
  - [ ] Fetch log details
  - [ ] Run coach agent with debrief prompt
  - [ ] Return feedback

- [ ] Create `app/api/coach/weekly/route.ts`
  - [ ] Run coach agent with weekly prompt
  - [ ] Analyze past 7 days
  - [ ] Return review text

### Code Template for Today Route
```typescript
// app/api/coach/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServerClient';
import { runCoachAgent } from '@/lib/ai/agents/coach-agent';
import { db } from '@/drizzle/db';
import { coachCache, profiles } from '@/drizzle/schema';
import { eq, and, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const today = new Date().toISOString().split('T')[0];

  // Check cache
  const cached = await db.query.coachCache.findFirst({
    where: and(
      eq(coachCache.userId, userId),
      eq(coachCache.type, 'today'),
      eq(coachCache.date, today)
    ),
  });

  if (cached) {
    return NextResponse.json({ brief: cached.content });
  }

  // Fetch user profile for tone
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Run coach agent
  try {
    const brief = await runCoachAgent(userId, profile.coachTone || 'concise', 'today');

    // Cache result
    await db.insert(coachCache).values({
      userId,
      type: 'today',
      date: today,
      content: brief,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ brief });
  } catch (error) {
    console.error('[Coach Today] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate brief' },
      { status: 500 }
    );
  }
}
```

### 2.3 UI Integration

- [ ] Create `components/CoachBrief.tsx` component
- [ ] Add to Today view (`app/(auth)/dashboard/page.tsx`)
- [ ] Show loading state while fetching
- [ ] Display brief with coach icon
- [ ] Add "Skip Today" action

- [ ] Create `components/CoachDebrief.tsx` component
- [ ] Show after workout log submission
- [ ] Display feedback with encouraging tone

- [ ] Create `components/WeeklyReview.tsx` component
- [ ] Add to Progress view
- [ ] Show trends and suggestions

### Success Criteria
- [ ] Daily brief loads in <3s
- [ ] Debrief appears after workout completion
- [ ] Weekly review shows accurate trends
- [ ] Cache reduces API calls by 80%+
- [ ] Coach tone matches user preference

---

## Phase 3: Substitution Agent (Priority 3)

### Goal
Build real-time exercise substitution feature with context-aware alternatives.

### 3.1 Create Substitution Agent

- [ ] Create `lib/ai/agents/substitution-agent.ts`
- [ ] Define substitution tools:
  - [ ] `getAvailableEquipment(userId)` → User's equipment
  - [ ] `findSimilarExercises(exerciseId, movement)` → Query by pattern
  - [ ] `checkPcosCompatibility(exerciseId)` → Safety check
- [ ] Return 2-3 alternatives with reasoning

### Code Template
```typescript
import { Agent, run } from '@openai/agents';
import { z } from 'zod';
import { tool } from '@openai/agents';
import { listExercises } from '@/lib/exerciseLibrary';
import { db } from '@/drizzle/db';
import { profiles } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

const getAvailableEquipmentTool = tool({
  name: 'get_available_equipment',
  description: 'Get user\'s available equipment list',
  parameters: z.object({
    userId: z.string(),
  }),
  async execute({ userId }) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });
    return JSON.stringify(profile?.equipment || []);
  },
});

const findSimilarExercisesTool = tool({
  name: 'find_similar_exercises',
  description: 'Find exercises with similar movement patterns',
  parameters: z.object({
    exerciseId: z.string(),
    movement: z.string(),
    requirePcosSafe: z.boolean().optional(),
  }),
  async execute({ exerciseId, movement, requirePcosSafe }) {
    const exercises = listExercises();
    const similar = exercises.filter(ex =>
      ex.id !== exerciseId &&
      ex.movement === movement &&
      (!requirePcosSafe || ex.isPcosFriendly)
    );
    return JSON.stringify(similar.slice(0, 5));
  },
});

const substitutionAgent = new Agent({
  name: 'Exercise Substitution Assistant',
  instructions: `You help users find exercise alternatives. Reasons for substitution:
- Equipment unavailable
- Injury/discomfort
- Fatigue/recovery needed
- Preference

Provide 2-3 alternatives with brief reasoning for each.`,
  model: 'gpt-4o-mini',
  tools: [getAvailableEquipmentTool, findSimilarExercisesTool],
});

export async function runSubstitutionAgent(
  userId: string,
  exerciseId: string,
  reason: string
) {
  const prompt = `Find substitutions for exercise "${exerciseId}". Reason: ${reason}. User ID: ${userId}`;
  const result = await run(substitutionAgent, prompt);
  return result.finalOutput;
}
```

### 3.2 Create API Route

- [ ] Create `app/api/substitution/route.ts`
- [ ] Accept: `exerciseId`, `reason` (equipment/injury/fatigue/preference)
- [ ] Run substitution agent
- [ ] Parse alternatives from response
- [ ] Log to `substitutionEvents` table
- [ ] Return structured alternatives

### 3.3 UI Integration

- [ ] Add "Substitute Exercise" button in workout view
- [ ] Show modal with reason selection
- [ ] Display 2-3 alternatives with details
- [ ] Allow user to select and apply
- [ ] Update workout payload with substitution

### Success Criteria
- [ ] Substitutions return in <5s
- [ ] Alternatives match movement pattern
- [ ] PCOS compatibility enforced
- [ ] Equipment constraints respected
- [ ] Substitution events logged

---

## Phase 4: Progressive Load Agent (Priority 4)

### Goal
Implement intelligent weekly load target calculations with AI-enhanced progression logic.

### 4.1 Create Progression Agent

- [ ] Create `lib/ai/agents/progression-agent.ts`
- [ ] Define progression tools:
  - [ ] `getHistoricalVolume(exerciseId, weeks)` → Calculate trend
  - [ ] `checkDeloadWeek(weekNumber)` → Detect deload weeks
  - [ ] `applyPcosRecovery(targets)` → Adjust for PCOS
- [ ] Combine deterministic formulas + AI reasoning

### Code Template
```typescript
import { Agent, run } from '@openai/agents';
import { z } from 'zod';
import { tool } from '@openai/agents';
import { db } from '@/drizzle/db';
import { workoutLogs, workoutLogSets } from '@/drizzle/schema';
import { eq, and, gte } from 'drizzle-orm';

const getHistoricalVolumeTool = tool({
  name: 'get_historical_volume',
  description: 'Calculate volume trend for an exercise over past weeks',
  parameters: z.object({
    userId: z.string(),
    exerciseId: z.string(),
    weeks: z.number().default(4),
  }),
  async execute({ userId, exerciseId, weeks }) {
    // Query workout logs and calculate volume
    // Return: average volume, trend direction, recent PRs
    return JSON.stringify({
      averageVolume: 2400, // kg lifted
      trend: 'increasing',
      weeklyData: [2200, 2300, 2400, 2500],
      lastPR: { weight: 100, reps: 8, date: '2025-10-24' },
    });
  },
});

const checkDeloadWeekTool = tool({
  name: 'check_deload_week',
  description: 'Check if current week is a deload week',
  parameters: z.object({
    weekNumber: z.number(),
    planWeeks: z.number(),
  }),
  async execute({ weekNumber, planWeeks }) {
    // Deload weeks: 4, 8 (if plan >= 10 weeks)
    const isDeload = weekNumber === 4 || (planWeeks >= 10 && weekNumber === 8);
    return JSON.stringify({
      isDeload,
      deloadFactor: isDeload ? 0.6 : 1.0,
      message: isDeload ? 'Deload week: reduce volume by 40%' : 'Regular training week',
    });
  },
});

const progressionAgent = new Agent({
  name: 'Progression Calculator',
  instructions: `Calculate weekly load targets for strength training. Rules:
- Progressive overload: 2-5% increase per week for compound lifts
- Deload weeks (4, 8): 60% of recent volume
- PCOS considerations: Extra recovery, avoid overreaching
- Missed workouts: Don't inflate targets, use completed sessions only`,
  model: 'gpt-4o-mini',
  tools: [getHistoricalVolumeTool, checkDeloadWeekTool],
});

export async function runProgressionAgent(
  userId: string,
  exerciseId: string,
  weekNumber: number,
  planWeeks: number,
  hasPcos: boolean
) {
  const prompt = `Calculate load targets for user ${userId}, exercise ${exerciseId}, week ${weekNumber}/${planWeeks}. PCOS: ${hasPcos}`;
  const result = await run(progressionAgent, prompt);
  return result.finalOutput;
}
```

### 4.2 Create API Route

- [ ] Create `app/api/progression/compute/route.ts`
- [ ] Trigger: Weekly (after week completion)
- [ ] Run progression agent for each exercise in plan
- [ ] Calculate targets (weight, reps, sets)
- [ ] Store in `progressionTargets` table
- [ ] Return summary

### 4.3 UI Integration

- [ ] Add progression targets to Today view
- [ ] Show suggested weight/reps for each exercise
- [ ] Display trend indicators (↑ increase, → maintain, ↓ deload)
- [ ] Allow manual overrides

### Success Criteria
- [ ] Targets calculated in <10s per exercise
- [ ] Progressive overload applied correctly
- [ ] Deload weeks reduce volume appropriately
- [ ] PCOS recovery adjustments work
- [ ] Targets display in UI

---

## Phase 5: Cleanup & Optimization

### Goal
Remove legacy code, optimize performance, and finalize documentation.

### 5.1 Code Cleanup

- [ ] Remove `callPlanner()` and `callCoach()` from `lib/ai/client.ts`
- [ ] Remove GPT-5 model detection logic
- [ ] Remove `USE_AGENT_PLANNER` feature flag
- [ ] Update all imports to use agent implementations
- [ ] Remove unused prompt builders

### 5.2 Testing

- [ ] Add unit tests for all tools
- [ ] Add integration tests for each agent
- [ ] Test error handling and edge cases
- [ ] Test with various profile configurations
- [ ] Load testing (concurrent plan generations)

### 5.3 Monitoring & Observability

- [ ] Add agent execution tracing
- [ ] Log token usage per agent
- [ ] Monitor latency and success rates
- [ ] Set up alerts for failures
- [ ] Track cost per user interaction

### 5.4 Documentation

- [ ] Update README with agent architecture
- [ ] Document agent prompts and tools
- [ ] Add troubleshooting guide
- [ ] Create agent configuration guide
- [ ] Update API documentation

### Success Criteria
- [ ] All legacy code removed
- [ ] Test coverage >80%
- [ ] Monitoring dashboards set up
- [ ] Documentation complete
- [ ] No performance regressions

---

## Rollback Plan

If issues arise during migration:

1. **Phase 1 Rollback**:
   - Set `USE_AGENT_PLANNER=false` in `.env.local`
   - Falls back to original `callPlanner()` implementation

2. **Phase 2-4 Rollback**:
   - Coach/substitution/progression are new features
   - Can disable via feature flags or remove routes
   - No impact on existing functionality

3. **Full Rollback**:
   - Revert `lib/ai/agents/` directory
   - Restore original `lib/ai/client.ts`
   - Uninstall `@openai/agents` if needed

---

## Metrics to Track

### Before Migration
- Plan generation success rate: ~40% (with GPT-5 timeout)
- Average response time: 57-58s (timeout)
- Token usage per plan: ~2000 tokens
- Coach features: 0 (not implemented)

### After Migration (Target)
- Plan generation success rate: >95%
- Average response time: <15s
- Token usage per plan: ~800 tokens (60% reduction)
- Coach features: 3 (today, debrief, weekly)
- Substitution requests: <5s response time
- Progression calculations: <10s per exercise

---

## Timeline Estimate

- **Phase 0**: 1 hour
- **Phase 1**: 4-6 hours (critical path)
- **Phase 2**: 6-8 hours (3 routes + UI)
- **Phase 3**: 3-4 hours (single focused feature)
- **Phase 4**: 4-5 hours (complex logic)
- **Phase 5**: 3-4 hours (cleanup + docs)

**Total**: 21-28 hours

---

## Notes

- Keep existing post-processing logic (PCOS guardrails, time budgets) - agents handle selection, post-processor handles safety
- All agents use Zod schemas for type safety
- Tracing available via OpenAI Agents SDK for debugging
- Consider adding rate limiting for coach features to control costs
- Monitor token usage closely in production

---

## Getting Help

- **OpenAI Agents SDK Docs**: https://openai.github.io/openai-agents-js/
- **GitHub Issues**: Track any blockers or bugs
- **Rollback Instructions**: See "Rollback Plan" section above

---

Last Updated: 2025-10-31
