# FitCoach: Week-by-Week Adaptive Plan Generation

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

### Phase 3: AI Agent Updates

#### 3.1 Update Schema Validation (`lib/validation.ts`)
- [ ] Add `periodizationBlockSchema`:
  ```typescript
  blockNumber: z.number().int().min(1).max(4)
  blockType: z.enum(["accumulation", "intensification", "deload", "realization"])
  weeks: z.number().int().min(1).max(6)
  volumeTarget: z.enum(["high", "moderate", "low"])
  intensityTarget: z.enum(["low", "moderate", "high"])
  repRanges: z.object({ strength: z.string(), accessory: z.string() })
  rpeTargets: z.object({ strength: z.number(), accessory: z.number() })
  ```
- [ ] Add `weeklyWorkoutSchema`:
  ```typescript
  weekNumber: z.number().int().min(1)
  periodizationPhase: z.string()
  coachingNotes: z.string()
  progressionFromLastWeek: z.string().optional()
  ```
- [ ] Add `exerciseWithRPESchema`:
  ```typescript
  // Extend existing exercise schema
  targetRPE: z.number().min(5).max(10).optional()
  targetRIR: z.number().int().min(0).max(5).optional()
  progressionNotes: z.string().max(200).optional()
  ```

#### 3.2 Create Prompt Templates (`lib/ai/prompts.ts`)
- [ ] Create `initialWeekPromptTemplate`:
  - [ ] Assessment focus
  - [ ] Movement pattern introduction
  - [ ] Baseline setting
  - [ ] Clear RPE/RIR guidance
- [ ] Create `subsequentWeekPromptTemplate`:
  - [ ] Include previous week summary
  - [ ] Apply periodization phase rules
  - [ ] Progression logic
  - [ ] Exercise variation guidance
- [ ] Create phase-specific sub-prompts:
  - [ ] `accumulationPhaseGuidelines`
  - [ ] `intensificationPhaseGuidelines`
  - [ ] `deloadPhaseGuidelines`
  - [ ] `realizationPhaseGuidelines`
- [ ] Add experience-level specific prompts:
  - [ ] Beginner guidelines (simple linear progression)
  - [ ] Intermediate guidelines (block periodization)
  - [ ] Advanced guidelines (daily undulating)

#### 3.3 Refactor Planner Agent (`lib/ai/agents/planner-agent.ts`)
- [ ] Rename to `planner-agent-legacy.ts` (keep for reference)
- [ ] Create new `planner-agent.ts` with two modes:
  - [ ] `generateInitialWeek()` function
    - [ ] Input: user profile, periodization framework
    - [ ] Generate Week 1 + detailed coaching notes
    - [ ] Include warm-up protocols, RPE targets, progression cues
  - [ ] `generateNextWeek()` function
    - [ ] Input: periodization framework, week number, previous week performance
    - [ ] Generate next week based on performance
    - [ ] Adjust for progression, regression, or maintenance
- [ ] Add new AI tools:
  - [ ] `analyze_previous_week`: Returns performance insights
  - [ ] `validate_progression`: Checks if progression is appropriate
  - [ ] Keep existing: `query_exercises`, `get_exercise_details`, `validate_time_budget`
- [ ] Enhance prompts with:
  - [ ] RPE/RIR targets per exercise
  - [ ] Warm-up ramp sets for primary lifts
  - [ ] Exercise complexity tiers (beginner/intermediate/advanced variations)
  - [ ] Movement balance validation (push:pull ratios)
  - [ ] Weekly coaching brief (focus, connection to last week, what's next)

---

### Phase 4: API Endpoints

#### 4.1 Initial Plan Generation (`app/api/plan/generate-initial/route.ts`)
- [ ] Create new endpoint: `POST /api/plan/generate-initial`
- [ ] Input validation:
  - [ ] User profile (demographics, experience, goals, schedule, equipment)
  - [ ] Program duration (weeks)
- [ ] Logic:
  - [ ] Generate periodization framework (call `generatePeriodizationFramework()`)
  - [ ] Store framework in database
  - [ ] Generate Week 1 (call `planner-agent.generateInitialWeek()`)
  - [ ] Store Week 1 with status: `active`
  - [ ] Return: framework + Week 1 workouts + coaching notes
- [ ] Error handling
- [ ] Add request logging

#### 4.2 Next Week Generation (`app/api/plan/generate-next-week/route.ts`)
- [ ] Create new endpoint: `POST /api/plan/generate-next-week`
- [ ] Input validation:
  - [ ] planId
  - [ ] Current week number
- [ ] Logic:
  - [ ] Fetch periodization framework
  - [ ] Analyze previous week performance (call `analyzeWeekPerformance()`)
  - [ ] Generate progression recommendations (call `generateProgressionRecommendations()`)
  - [ ] Determine current periodization phase
  - [ ] Generate next week (call `planner-agent.generateNextWeek()`)
  - [ ] Store new week with status: `pending`
  - [ ] Update previous week status to: `completed`
  - [ ] Return: new week workouts + coaching notes + progression explanation
- [ ] Error handling
- [ ] Add request logging
- [ ] Add cost tracking (log tokens used)

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

### Phase 5: Frontend Updates

#### 5.1 Plan Creation Flow
- [ ] Update plan creation wizard to explain weekly adaptive approach
- [ ] Show periodization framework preview after initial generation
- [ ] Display Week 1 with prominent coaching notes section

#### 5.2 Weekly Workflow UI
- [ ] Add "Week Overview" component
  - [ ] Display current week number and periodization phase
  - [ ] Show coaching notes prominently
  - [ ] Display week focus (e.g., "Accumulation: Build Volume")
- [ ] Add "Generate Next Week" button
  - [ ] Only show when current week is 80%+ complete
  - [ ] Show loading state during generation
  - [ ] Display success message with preview
- [ ] Add "Week Performance Summary" view
  - [ ] Completion rate
  - [ ] Average RPE
  - [ ] Total volume/tonnage
  - [ ] Visual graphs
- [ ] Update workout cards to show RPE targets
  - [ ] Display: "Target RPE: 8" or "Target RIR: 2 reps"
  - [ ] Show progression notes per exercise

#### 5.3 Coaching Notes Display
- [ ] Create expandable "Coach's Notes" section
- [ ] Show weekly focus
- [ ] Display progression explanation ("Added 5lb to squats based on last week's performance")
- [ ] Add tips specific to periodization phase

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
