# FitCoach: Week-by-Week Adaptive Plan Generation

## Status Update (January 2025)

**Completed:**
- ✅ Phase 1: Database & Schema Updates (100%)
- ✅ Phase 2: Business Logic Modules (100%)
- ✅ Phase 3: AI Agent Updates (100%) ⭐ NEW
  - Schema validation for adaptive planning
  - Prompt templates for initial/subsequent weeks
  - Adaptive planner agent with dual modes
- ✅ Phase 4: Core API Endpoints (100%) ⭐ NEW
  - Initial week generation (modified `/api/plan/generate`)
  - Next week generation (`/api/plan/generate-next-week`)
  - Performance analysis integration
- ✅ Phase 5: Frontend Updates (100%) ⭐ NEW
  - Dynamic calendar display (shows only generated weeks)
  - "Generate Next Week" button with performance detection
  - Adaptive planning messaging and phase indicators
- ✅ AI Coaching Features (Separate from this plan)
  - Exercise Substitution API (`/api/substitution`)
  - Weekly Review API (`/api/coach/weekly`)
  - Daily Brief API (`/api/coach/today`)
  - UI components for all features

**Remaining:**
- ⏳ Phase 6: Cost Optimization & Monitoring
- ⏳ Phase 7: Testing & Validation
- ⏳ Phase 8: Migration & Deployment

**Resolved Issues:**
- ✅ Authentication fix (Supabase cookie double-stringification)
- ✅ Calendar display with NULL sessionDate handling
- ✅ OpenAI model configuration

**Note:** Core adaptive planning system is now functional! Users can generate Week 1, complete workouts, and generate subsequent weeks based on actual performance.

---

## Overview

Shift from "12-week upfront generation" to "weekly adaptive generation" based on actual user performance.

### Current Problem
- AI generates entire 12-week program upfront
- Same pattern repeats with no consideration of user performance
- No progressive overload, no adaptation
- Expensive single API call ($3-5)

### New Approach
- AI generates Week 1 based on user profile
- User completes Week 1, logs workouts
- AI generates Week 2 based on Week 1 performance + periodization framework
- Continue week-by-week until program complete
- Cost: ~$0.05-0.10 per week × 12 weeks = $0.60-1.20 total

---

## Implementation Checklist

### Phase 1: Database & Schema Updates ✅

#### 1.1 Periodization Framework ✅
- [x] Create `periodization_framework` table in drizzle/schema.ts
  - [x] Fields: `id`, `planId`, `framework` (JSON with PeriodizationFramework type)
  - [x] Each block: `{ blockNumber, blockType, startWeek, endWeek, volumeTarget, intensityTarget, repRanges, rpeTargets }`
- [x] Add migration for new table (drizzle/migrations/0002_milky_peter_parker.sql)
- [x] Create TypeScript types for periodization blocks (PeriodizationBlock, PeriodizationFramework)

#### 1.2 Week Status Tracking ✅
- [x] Add `weekStatus` enum to workout schema: `pending | active | completed`
- [x] Add `weekNumber` field to workouts table
- [x] Add `generationContext` JSON field (stores AI context for next week)
- [x] Add `coachingNotes` text field (weekly guidance from AI)
- [x] Create migration (included in 0002_milky_peter_parker.sql)

#### 1.3 Workout Performance Tracking ✅
- [x] Create `week_performance_summary` table
  - [x] Fields: `id`, `planId`, `weekNumber`, `completionRate`, `avgRPE`, `totalVolume`, `totalTonnage`, `metrics` (JSON)
- [x] Add migration (included in 0002_milky_peter_parker.sql)
- [x] Create TypeScript types (WeekPerformanceMetrics, WeekPerformanceSummary)

---

### Phase 2: Business Logic Modules ✅

#### 2.1 Periodization Framework (`lib/periodization.ts`) ✅
- [x] Create file: `lib/periodization.ts`
- [x] Define periodization block types:
  - [x] `accumulation` - High volume, moderate intensity (12-15 reps, RPE 7-8)
  - [x] `intensification` - Moderate volume, high intensity (6-10 reps, RPE 8-9)
  - [x] `deload` - Low volume, moderate intensity (8 reps, RPE 6)
  - [x] `realization` - Low volume, peak intensity (4-6 reps, RPE 9+)
- [x] Create `generatePeriodizationFramework()` function
  - [x] Input: totalWeeks, experienceLevel, goal
  - [x] Output: Array of periodization blocks
  - [x] Beginner: Linear progression (simple accumulation → deload)
  - [x] Intermediate: Block periodization (accumulation → intensification → deload → peak)
- [x] Add block transition logic (`getCurrentBlock()`, `getBlockGuidelines()`, etc.)
- [x] Write unit tests (30 tests, all passing)

#### 2.2 Performance Analysis (`lib/performance-analysis.ts`) ✅
- [x] Create file: `lib/performance-analysis.ts`
- [x] Create `analyzeWeekPerformance()` function
  - [x] Input: planId, weekNumber
  - [x] Calculate: completion rate, avg RPE, total volume, total tonnage
  - [x] Output: Performance summary object with exercise breakdown
- [x] Create `generateProgressionRecommendations()` function
  - [x] Input: performance summary, periodization phase
  - [x] Logic:
    - [x] If exceeded targets (RPE < target, hit top of reps) → progress faster
    - [x] If struggled (RPE > target, missed reps) → maintain or reduce
    - [x] If mixed → hold steady with refinements
  - [x] Output: Recommendations for next week with confidence score
- [x] Create `summarizeWeekForAI()` function
  - [x] Input: performance summary
  - [x] Output: Concise text summary for AI prompt (token-efficient)
- [x] Add helper functions (`calculateWeekOverWeekChanges()`, `isWeekReadyForAnalysis()`)
- [x] Write unit tests (25 tests, all passing)

#### 2.3 Enhanced Progression Logic (`lib/progression.ts`) ✅
- [x] Extend existing `progression.ts` with week-to-week logic
- [x] Add `calculateExerciseProgression()` function
  - [x] Input: exercise, previous week logs, periodization phase, performance analysis
  - [x] Output: Exercise-specific load/rep/RPE recommendations
  - [x] Handles all experience levels with RPE-based autoregulation
- [x] Add `applyDeloadModifications()` enhancement
  - [x] 40% volume reduction (sets)
  - [x] 15% load reduction (weight)
  - [x] Configurable reduction percentages
- [x] Add `calculateWeeklyVolumeLandmarks()` for trend analysis
- [x] Add 1RM estimation utilities (`estimateOneRepMax()`, `calculateWeightForReps()`)
- [x] Write unit tests (28 tests, all passing)

---

### Phase 3: AI Agent Updates ✅ COMPLETE

**Status:** Adaptive planning system fully implemented with week-by-week generation capability.

**Prerequisites:**
- ✅ Periodization framework (Phase 2)
- ✅ Performance analysis (Phase 2)
- ✅ Weekly review AI (completed separately - November 2025)

**Completed:** All adaptive planning infrastructure built and tested.

---

#### 3.0 Related Completed Work (November 2025) ✅

**AI Infrastructure Built (Supports Adaptive Planning):**

- [x] **Weekly Performance Review** (`lib/ai/weekly-context-builder.ts`)
  - [x] Aggregates week performance using Phase 2 analysis
  - [x] Integrates periodization framework context
  - [x] Generates AI-powered insights and recommendations
  - [x] Can be extended to inform next week generation

- [x] **AI Prompt System** (`lib/ai/prompts.ts`)
  - [x] `coachSystemPrompt` - General coaching guidance
  - [x] `substitutionSystemPrompt` - Exercise alternatives
  - [x] Foundation for week-specific prompt templates (see 3.2 below)

- [x] **Schema Validation Extensions** (`lib/validation.ts`)
  - [x] `coachResponseSchema` - AI response structure
  - [x] `substitutionResponseSchema` - Alternative exercises
  - [x] Foundation for adaptive planning schemas (see 3.1 below)

- [x] **AI Client Infrastructure** (`lib/ai/client.ts`, `lib/ai/buildPrompt.ts`)
  - [x] OpenAI integration with retry logic
  - [x] Context building utilities
  - [x] Schema validation with Zod
  - [x] Ready for adaptive planning prompts

- [x] **Performance Context Builders**
  - [x] `buildWeeklyContext()` - Summarizes week metrics for AI
  - [x] `buildWeeklyPrompt()` - Generates AI prompts with performance data
  - [x] Can be adapted for `subsequentWeekPromptTemplate` (see 3.2)

- [x] **API Endpoints**
  - [x] `GET /api/coach/weekly` - Weekly review generation (uses Phase 2 analysis)
  - [x] `POST /api/substitution` - Exercise alternatives
  - [x] Caching infrastructure for cost optimization

**How This Supports Adaptive Planning:**
The weekly review system already:
1. Analyzes performance using Phase 2 modules
2. Integrates periodization context
3. Generates progression recommendations
4. Has AI prompt infrastructure

**What's Still Needed:**
- Modify planner agent to accept previous week performance as input
- Create dedicated prompts for week-by-week generation (vs. review)
- Build `/api/plan/generate-next-week` endpoint
- Frontend UI for triggering next week generation

---

#### 3.1 Update Schema Validation (`lib/validation.ts`) ✅
- [x] Add `periodizationPhaseSchema` (accumulation, intensification, deload, realization)
- [x] Add `periodizationBlockSchema`:
  ```typescript
  blockNumber: z.number().int().min(1).max(4)
  blockType: z.enum(["accumulation", "intensification", "deload", "realization"])
  weeks: z.number().int().min(1).max(6)
  volumeTarget: z.enum(["high", "moderate", "low"])
  intensityTarget: z.enum(["low", "moderate", "high"])
  repRanges: z.object({ strength: z.string(), accessory: z.string() })
  rpeTargets: z.object({ strength: z.number(), accessory: z.number() })
  ```
- [x] Add `weeklyWorkoutSchema` with coaching notes and phase tracking
- [x] Add `exerciseWithRPESchema` with targetRPE, targetRIR, and progressionNotes
- [x] Add `adaptiveWeekResponseSchema` for next week generation responses

#### 3.2 Create Prompt Templates (`lib/ai/prompts.ts`) ✅
- [x] Create `initialWeekPromptTemplate`:
  - [x] Assessment focus with user context
  - [x] Movement pattern introduction
  - [x] Baseline setting for Week 1
  - [x] Clear RPE/RIR guidance based on experience level
- [x] Create `subsequentWeekPromptTemplate`:
  - [x] Include previous week performance summary
  - [x] Apply periodization phase rules
  - [x] Progression/regression logic based on adherence and RPE
  - [x] Exercise variation guidance
- [x] Create phase-specific guidelines:
  - [x] `accumulationPhaseGuidelines` (volume focus, RPE 7-8)
  - [x] `intensificationPhaseGuidelines` (intensity focus, RPE 8-9)
  - [x] `deloadPhaseGuidelines` (recovery, RPE 6-7)
  - [x] `realizationPhaseGuidelines` (peak performance, RPE 9-10)
- [x] Add experience-level specific prompts:
  - [x] Beginner guidelines (conservative progression, RPE 6-7)
  - [x] Intermediate guidelines (balanced progression, RPE 7-8)
  - [x] Advanced guidelines (aggressive progression, RPE 8-9+)

#### 3.3 Refactor Planner Agent (`lib/ai/agents/planner-agent.ts`) ✅
- [x] Kept legacy `runPlannerAgent()` for backward compatibility
- [x] Created adaptive planner with two modes:
  - [x] `generateInitialWeek()` function
    - [x] Input: user profile with experience/PCOS/equipment
    - [x] Generate Week 1 with baseline assessment
    - [x] Include warm-up protocols, RPE targets, progression cues
  - [x] `generateNextWeek()` function
    - [x] Input: profile, week number, phase, previous week performance
    - [x] Generate next week based on actual performance data
    - [x] Adjust for progression, regression, or maintenance based on adherence/RPE
- [x] AI tools integration:
  - [x] Reused existing: `query_exercises`, `get_exercise_details`, `validate_time_budget`
  - [x] Performance analysis handled by `preparePerformanceDataForAdaptivePlanner()`
- [x] Enhanced prompts with:
  - [x] RPE/RIR targets per exercise
  - [x] Warm-up protocols and time budget validation
  - [x] Experience-level appropriate exercise selection
  - [x] PCOS-friendly options (low-impact, Zone-2 cardio)
  - [x] Weekly coaching rationale explaining progressions

---

### Phase 4: API Endpoints ✅ COMPLETE

#### 4.1 Initial Plan Generation (Modified `app/api/plan/generate/route.ts`) ✅
- [x] Modified existing endpoint to generate only Week 1
- [x] Input validation:
  - [x] User profile (demographics, experience, goals, schedule, equipment)
  - [x] Program duration (weeks)
- [x] Logic:
  - [x] Generate Week 1 workouts using `expandPlannerResponseInitialWeek()`
  - [x] Store microcycle pattern for future week generation
  - [x] Store plan with empty calendar (weeks generated on-demand)
  - [x] Return: Week 1 workouts only
- [x] Error handling with retry logic
- [x] SSE-based progress updates

#### 4.2 Next Week Generation (`app/api/plan/generate-next-week/route.ts`) ✅
- [x] Created new endpoint: `POST /api/plan/generate-next-week`
- [x] Input validation:
  - [x] planId (required)
  - [x] Auto-detects current week number from database
- [x] Logic:
  - [x] Fetch user profile and plan details
  - [x] Analyze previous week performance via `preparePerformanceDataForAdaptivePlanner()`
  - [x] Determine periodization phase based on week number
  - [x] Generate next week via `generateNextWeek()` with performance data
  - [x] Store new week workouts in database
  - [x] Return: new week number, phase, summary, progression rationale
- [x] Error handling with detailed logging
- [x] Request logging implemented

#### 4.3 Week Summary (`app/api/plan/week-summary/[weekId]/route.ts`)
- [ ] Create new endpoint: `GET /api/plan/week-summary/:weekId`
- [ ] Logic:
  - [ ] Fetch all logged workouts for the week
  - [ ] Calculate performance metrics
  - [ ] Store in `week_performance_summary` table
  - [ ] Return summary
- [ ] Add caching (1 hour)

#### 4.4 Modify Existing Generate Endpoint (`app/api/plan/generate/route.ts`)
- [ ] Add flag to route to new vs. old system
- [ ] New plans → redirect to `/generate-initial`
- [ ] Keep legacy logic for existing plans
- [ ] Add deprecation notice in comments

---

### Phase 5: Frontend Updates ✅ COMPLETE

#### 5.1 Plan Creation Flow ✅
- [x] Initial plan generation shows Week 1 only
- [x] Adaptive planning message explains week-by-week approach
- [x] Calendar dynamically displays only generated weeks

#### 5.2 Weekly Workflow UI ✅
- [x] Dynamic calendar display (`components/WorkoutCalendar.tsx`):
  - [x] Shows only weeks with generated workouts
  - [x] Handles both NULL and set sessionDate values
  - [x] Groups workouts by actual weekIndex
- [x] "Generate Next Week" button (`app/(auth)/plan/PlanView.tsx`):
  - [x] Shows when any progress detected in current week
  - [x] Only appears if more weeks remain in plan
  - [x] Displays which week will be generated (e.g., "Generate Week 2")
  - [x] Shows loading state during generation
  - [x] Displays success message with phase indicator
- [x] Adaptive planning messaging:
  - [x] Explains week-by-week approach when only Week 1 exists
  - [x] Shows progress detection and readiness for next week
- [x] Calendar improvements:
  - [x] Displays deload week badges
  - [x] Shows workout focus and duration
  - [x] Links to individual workout pages

#### 5.3 Performance Analysis Integration ✅
- [x] `preparePerformanceDataForAdaptivePlanner()` transforms workout logs
- [x] Calculates adherence, RPE, sets completed vs. target
- [x] Feeds into next week generation automatically
- [x] Existing performance analysis modules (`lib/performance-analysis.ts`) utilized

---

### Phase 6: Cost Optimization & Monitoring

#### 6.1 Token Usage Tracking
- [ ] Add token counting to AI agent calls
- [ ] Store token usage in database per week generation
- [ ] Create dashboard to monitor costs

#### 6.2 Smart Context Management
- [ ] Limit previous week summary to essential info (max 500 tokens)
- [ ] Cache periodization framework (don't resend every call)
- [ ] Use structured data instead of verbose text where possible

#### 6.3 Rate Limiting
- [ ] Limit week generation to 1 per user per day
- [ ] Add cooldown after generation (prevent spam)

---

### Phase 7: Testing & Validation

#### 7.1 Unit Tests
- [ ] Test periodization framework generation for all experience levels
- [ ] Test performance analysis calculations
- [ ] Test progression recommendation logic
- [ ] Test schema validation for new structures

#### 7.2 Integration Tests
- [ ] Test full flow: initial generation → week completion → next week generation
- [ ] Test with different user profiles (beginner, intermediate, advanced)
- [ ] Test PCOS guardrails integration
- [ ] Test time budget constraints

#### 7.3 E2E Tests
- [ ] Test complete 8-week program generation week-by-week
- [ ] Verify progressive overload occurs
- [ ] Verify deload weeks trigger correctly
- [ ] Test cost stays within budget ($1.50 max for 12-week program)

#### 7.4 Manual Testing
- [ ] Test with real workout logging
- [ ] Verify RPE targets make sense
- [ ] Check coaching notes quality
- [ ] Validate exercise progressions feel natural

---

### Phase 8: Migration & Deployment

#### 8.1 Database Migration
- [ ] Run migrations in development
- [ ] Test rollback procedures
- [ ] Run migrations in production

#### 8.2 Feature Flag
- [ ] Add feature flag: `ENABLE_WEEKLY_ADAPTIVE_PLANNING`
- [ ] Allow opt-in for beta users
- [ ] Gradual rollout

#### 8.3 Documentation
- [ ] Update API documentation
- [ ] Create user guide for weekly adaptive plans
- [ ] Document cost structure

#### 8.4 Monitoring
- [ ] Set up alerts for high API costs
- [ ] Monitor generation success rate
- [ ] Track user satisfaction (completion rates)

---

## Success Metrics

- [ ] Cost per program: <$1.50 for 12 weeks (vs. $3-5 previously)
- [ ] Plan quality: Users complete 70%+ of workouts (vs. current unknown)
- [ ] Progressive overload: 90%+ of weeks show measurable progression
- [ ] User feedback: Positive sentiment on "feels like a real coach"

---

## Estimated Timeline

- **Phase 1-2 (Foundation):** 2-3 days
- **Phase 3-4 (AI & API):** 3-4 days
- **Phase 5 (Frontend):** 2-3 days
- **Phase 6-7 (Optimization & Testing):** 2 days
- **Phase 8 (Deploy):** 1 day

**Total: 10-13 days** (2-3 weeks with buffer)

---

## Notes

- Keep legacy system running for existing plans
- Monitor costs closely during rollout
- Gather user feedback early and iterate
- Consider adding "regenerate week" option if user wants to retry

---

## Open Questions

- [ ] Should users be able to manually trigger week generation early?
- [ ] How to handle missed weeks (user takes 2 weeks off)?
- [ ] Should AI have ability to extend/shorten program based on progress?
- [ ] Add "ask coach" feature for mid-week questions?

---

## Relationship to Completed Work

### What's Already Built (November 2025)

**Phase 1-2 Foundation:**
- ✅ Database schema supports adaptive planning
- ✅ Periodization framework can guide week-by-week generation
- ✅ Performance analysis calculates weekly metrics
- ✅ Progression logic determines load changes

**AI Coaching Features (Completed Separately):**
- ✅ Daily brief (`/api/coach/today`) - motivational messages
- ✅ Weekly review (`/api/coach/weekly`) - performance insights using Phase 2 analysis
- ✅ Exercise substitution (`/api/substitution`) - real-time alternatives
- ✅ All UI components created

### What Still Needs to Be Built

**Core Adaptive Planning System:**
- ⏸️ Week-by-week plan generation (Phase 3-8 of this document)
- ⏸️ Modified planner agent to generate incrementally
- ⏸️ API endpoints for initial week + next week generation
- ⏸️ Frontend UI for triggering and viewing week generation
- ⏸️ Cost optimization and monitoring

**Integration:**
The weekly review AI we built can be enhanced to:
1. Provide input to the adaptive planner
2. Show progression recommendations alongside coaching notes
3. Explain why next week's plan changed based on performance

**Recommended Approach:**
1. Start Phase 3 of this document (AI agent updates)
2. Build on existing weekly review to inform next week generation
3. Use auto-progression system (Issue #5) as foundation
4. Test with real user data before full deployment

---

## Implementation Summary (January 2025)

### What Was Built

**Core Adaptive Planning System:**
1. **Schema Extensions** (`lib/validation.ts`):
   - `periodizationPhaseSchema`, `periodizationBlockSchema`
   - `exerciseWithRPESchema`, `weeklyWorkoutSchema`
   - `adaptiveWeekResponseSchema`

2. **Prompt Engineering** (`lib/ai/prompts.ts`):
   - `initialWeekPromptTemplate()` - Week 1 generation with baseline assessment
   - `subsequentWeekPromptTemplate()` - Week N+1 generation with performance data
   - Phase-specific guidelines (accumulation, intensification, deload, realization)
   - Experience-level prompts (beginner, intermediate, advanced)

3. **Adaptive Planner Agent** (`lib/ai/agents/planner-agent.ts`):
   - `adaptivePlannerAgent` - New agent instance with adaptive capabilities
   - `generateInitialWeek()` - Generates Week 1 with RPE targets
   - `generateNextWeek()` - Generates subsequent weeks based on actual performance

4. **Performance Analysis Bridge** (`lib/performance-analysis.ts`):
   - `preparePerformanceDataForAdaptivePlanner()` - Transforms workout logs into agent input format
   - Calculates adherence, average RPE, completed vs. target sets

5. **API Endpoints**:
   - Modified `/api/plan/generate` - Now generates only Week 1
   - Created `/api/plan/generate-next-week` - Performance-based week generation

6. **Calendar System** (`lib/calendar.ts`):
   - `generateWeekWorkouts()` - Single week generation
   - `expandPlannerResponseInitialWeek()` - Week 1 expansion

7. **Frontend UI**:
   - Dynamic calendar showing only generated weeks
   - "Generate Next Week" button with progress detection
   - Adaptive planning messaging
   - Phase indicators and success feedback

### Key Features

- ✅ Week-by-week plan generation (not all 12 weeks upfront)
- ✅ Performance-based progression (adherence + RPE analysis)
- ✅ Periodization phase awareness (accumulation → intensification → deload → realization)
- ✅ Experience-level appropriate programming
- ✅ PCOS-friendly considerations maintained
- ✅ Cost-effective ($0.05-0.10 per week vs. $3-5 upfront)

### Bug Fixes Included

- ✅ Supabase authentication (cookie double-stringification)
- ✅ OpenAI model configuration (`o4-mini` → `gpt-4o-mini`)
- ✅ Service worker auth route caching
- ✅ Calendar display with NULL sessionDate handling

### Testing Status

- Manual testing: ✅ Verified Week 1 generation and display
- Ready for: Week 1 completion → Week 2 generation testing
- Remaining: Full 12-week program validation, cost tracking

---

## Related Documentation

- [Issue #5](https://github.com/sprajapati024/fitcoach/issues/5) - Auto-Progression (prerequisite for adaptive planning)
- [Issue #6](https://github.com/sprajapati024/fitcoach/issues/6) - Phase 3 AI Features Integration
- `lib/periodization.ts` - Periodization framework implementation
- `lib/performance-analysis.ts` - Week performance analysis
- `lib/progression.ts` - Exercise-specific progression logic
