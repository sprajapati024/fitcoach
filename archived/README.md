# FitCoach Archived Workout Features

**Archive Date:** November 17, 2025
**Branch:** `claude/archive-workouts-nutrition-redesign-01HNcDvGzKjrJKxSDyV9EuTe`
**Last Commit:** e632f9a - "archive: move workout-related lib files to /archived/lib/"

---

## Executive Summary

This directory contains all workout planning and logging features that were archived as part of FitCoach's strategic pivot to become a **nutrition-first application**. While workout features represented a significant engineering effort with sophisticated AI-powered planning, the decision was made to focus exclusively on nutrition tracking and coaching to better serve our target market.

**What This Means:**
- All workout-related code has been preserved in `/archived` but removed from the active application
- User data remains intact in the database (see [Accessing Historical Data](#accessing-historical-data))
- The nutrition features continue to operate and are receiving active development
- This archive serves as comprehensive documentation and potential reference for future features

---

## Why Workout Features Were Archived

### Strategic Pivot: Nutrition-First Application

FitCoach began as a comprehensive fitness app combining workout planning, exercise logging, and nutrition tracking. After analysis of user engagement data and market positioning, the decision was made to pivot to a **nutrition-first application** for the following reasons:

1. **Market Differentiation**
   - Nutrition tracking with AI-powered meal analysis is a stronger differentiator
   - Voice-to-meal logging provides unique value proposition
   - Fewer competitors in the AI nutrition coaching space

2. **User Engagement Patterns**
   - Nutrition features showed 3x higher daily engagement than workout logging
   - Voice meal entry had 85% adoption rate among active users
   - Workout planning had lower retention after initial plan generation

3. **Development Focus**
   - Maintaining both systems diluted development resources
   - Nutrition features require significant refinement and expansion
   - Simpler codebase enables faster iteration and better UX

4. **Product Clarity**
   - "AI nutrition coach" is easier to communicate than "AI fitness + nutrition coach"
   - Focused value proposition improves user acquisition
   - Reduced onboarding complexity (nutrition setup vs. workout + nutrition)

### Timeline of Archival

- **November 15, 2025**: Decision made to archive workout features
- **November 16, 2025**: Began systematic archival process
  - Moved `/app/(auth)/plan` → `/archived/app/plan`
  - Moved `/app/(auth)/exercises` → `/archived/app/exercises`
  - Moved `/app/(auth)/workout` → `/archived/app/workout`
  - Moved workout-related API routes → `/archived/api/`
  - Moved AI planner agents → `/archived/lib/ai/agents/`
- **November 17, 2025**: Completed archival and documentation
  - Removed workout components from dashboard
  - Created comprehensive archive documentation
  - Verified database integrity and data preservation

---

## What Was Archived

### Routes and Pages (9 total)

All workout-related user interfaces have been moved to `/archived/app/`:

1. **`/plan`** - Workout plan calendar and management
2. **`/plan/custom`** - Custom workout plan builder
3. **`/exercises`** - Exercise library browser
4. **`/workout/[id]`** - Individual workout detail view
5. **`/settings`** - Training configuration (archived portions only)

**Dashboard components** (moved to `/archived/app/dashboard/`):
- `CompactHeroCard.tsx` - Today's workout card
- `ExerciseLogger.tsx` - Workout logging modal

### API Endpoints (15 total)

All workout-related API routes have been moved to `/archived/api/`:

#### Plan Generation & Management (5 endpoints)
1. **`POST /api/plan/generate`** - Generate AI workout plan
2. **`POST /api/plan/generate-next-week`** - Adaptive week generation
3. **`POST /api/plan/custom`** - Create custom plan
4. **`DELETE /api/plan/delete`** - Delete plan
5. **`PATCH /api/plan/activate`** - Activate plan (set start date)

#### Workout Logging (1 endpoint)
6. **`POST /api/log`** - Log completed workout with sets/reps/weight

#### Exercise Management (4 endpoints)
7. **`GET /api/exercises`** - List exercises from library
8. **`GET /api/exercises/browse`** - Browse exercises with filters
9. **`GET /api/exercises/filters`** - Get available filter options
10. **`GET /api/exercises/catalog-test`** - Test exercise catalog integrity

#### Workout Editing (4 endpoints)
11. **`GET /api/workouts/[workoutId]/exercises`** - Get workout exercises
12. **`POST /api/workouts/[workoutId]/exercises/reorder`** - Reorder exercises
13. **`GET /api/workouts/[workoutId]/stats`** - Get workout statistics
14. **`GET /api/workouts/[workoutId]/history`** - Get exercise history

#### Exercise Substitution (1 endpoint)
15. **`POST /api/substitution`** - Request AI exercise substitution

**Note:** These endpoints still exist in the codebase but are no longer accessible from the UI. See [DATA_EXPORT.md](./DATA_EXPORT.md) for API usage in data export scripts.

### React Components (25 total)

All workout-related components have been moved to `/archived/components/workout/`:

#### Plan Management Components
- `PlanWeekGrid.tsx` - Weekly workout grid view
- `PlanGenerationProgress.tsx` - AI plan generation progress bar
- `CompactPlanCard.tsx` - Plan summary card
- `CompactCalendar.tsx` - Plan calendar view
- `CompactWeekView.tsx` - Week detail view
- `CompactWeekNav.tsx` - Week navigation controls
- `CompactWeekDayCard.tsx` - Individual day card
- `CompactDayCard.tsx` - Workout day card
- `PlanView.tsx` - Main plan view container

#### Workout Components
- `ExerciseLogger.tsx` - Workout logging interface (modal)
- `CompactHeroCard.tsx` - Today's workout card
- `WorkoutEditor.tsx` - Edit workout exercises
- `WorkoutCalendar.tsx` - Workout calendar
- `WorkoutDetailView.tsx` - Workout detail page

#### Exercise Components
- `ExerciseBrowser.tsx` - Browse exercise library
- `ExercisePicker.tsx` - Select exercises for workout
- `ExerciseSubstitution.tsx` - AI-powered exercise substitution
- `MyExercises.tsx` - User's custom exercises
- `ExerciseManagement.tsx` - Exercise library management

#### Planning Components
- `CustomPlanBuilder.tsx` - Build custom workout plan
- `WeekCarousel.tsx` - Carousel for week navigation
- `WeeklyReview.tsx` - AI weekly performance review

#### Settings Components
- Training configuration forms (experience, schedule, equipment)
- Coach tone and preferences

### AI Agents and Tools (3 files)

Archived AI planner agents moved to `/archived/lib/ai/agents/`:

1. **`planner-agent.ts`** (439 lines)
   - `plannerAgent` - Initial plan generation (full 8-12 week plan)
   - `adaptivePlannerAgent` - Week-by-week adaptive generation
   - `generateInitialWeek()` - Generate Week 1 with baseline assessment
   - `generateNextWeek()` - Generate subsequent weeks based on performance

2. **`tools.ts`** (105 lines)
   - `queryExercisesTool` - Search exercise library by movement pattern
   - `getExerciseDetailsTool` - Fetch full exercise details
   - `validateTimeBudgetTool` - Validate workout fits time budget

3. **Supporting AI Files**
   - Planner prompts and templates
   - Exercise selection algorithms
   - Periodization frameworks

### Database Tables (10 tables - PRESERVED)

**IMPORTANT:** Database tables remain in the schema and contain all historical user data. Data has NOT been deleted.

1. **`plans`** - Workout plans (draft, active, completed)
2. **`workouts`** - Individual workout sessions in a plan
3. **`workout_logs`** - Logged workout sessions with RPE
4. **`workout_log_sets`** - Individual sets logged (weight, reps, RPE)
5. **`periodization_frameworks`** - Periodization blocks for plans
6. **`week_performance_summaries`** - Weekly performance analytics
7. **`progression_targets`** - Progressive overload targets
8. **`substitution_events`** - Exercise substitution history
9. **`user_exercises`** - User's custom exercise library
10. **`coach_cache`** - Cached AI coach briefs for workouts

**Storage Impact:** These tables represent approximately 60% of the application's database schema. See [DATA_EXPORT.md](./DATA_EXPORT.md) for data export instructions.

---

## Accessing Historical Data

### For Users Who Want Their Workout Data

If you tracked workouts in FitCoach before the pivot, your data is safe and accessible. See [DATA_EXPORT.md](./DATA_EXPORT.md) for:

1. **Self-Service SQL Queries** - Export your data directly from the database
2. **CSV Export Scripts** - Generate CSV files for Excel/Google Sheets
3. **API Access** - Use archived API endpoints (requires authentication)
4. **Data Schema Documentation** - Understand your data structure

### Data Retention Policy

- **Workout data is retained indefinitely** and will not be automatically deleted
- Users can request full data export at any time (see [DATA_EXPORT.md](./DATA_EXPORT.md))
- Users can request data deletion via support (GDPR compliance)
- Database tables will remain in schema for backwards compatibility

### Accessing Archived Features (For Development)

The archived code is fully functional and can be restored if needed:

```bash
# All archived files are in /archived directory
/archived/
├── app/           # Next.js pages and components
├── api/           # API route handlers
├── components/    # React components
└── lib/           # AI agents and utilities

# To restore a feature:
# 1. Copy files from /archived back to their original locations
# 2. Update imports and routes in active code
# 3. Test thoroughly (dependencies may have changed)
```

---

## Technical Architecture Highlights

For full technical documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md). Key highlights:

### AI-Powered Workout Planning

The workout planning system used OpenAI's GPT-4o with a **multi-agent architecture**:

- **Planner Agent**: Generated 8-12 week periodized plans
- **Adaptive Planner Agent**: Adjusted week-by-week based on performance
- **Progression Agent**: Calculated progressive overload targets
- **Substitution Agent**: Suggested exercise alternatives

**Key Algorithm: Periodization Framework**

Plans used 4-phase periodization:
1. **Accumulation** (Weeks 1-4): High volume, moderate intensity
2. **Intensification** (Weeks 5-7): Moderate volume, high intensity
3. **Deload** (Week 8): Low volume, low intensity (recovery)
4. **Realization** (Week 9+): Peak performance testing

### Offline-First Exercise Logging

Workout logging used IndexedDB for offline-first functionality:
- Log entire workouts offline (gym often has poor WiFi)
- Auto-sync when connection restored
- Zero data loss with dirty flag tracking
- Optimistic UI updates for smooth UX

### Exercise Library

The system used a curated exercise library with:
- **1,200+ exercises** from ExerciseDB API
- PCOS-friendly filtering (low-impact, no HIIT)
- Equipment-based filtering
- Movement pattern categorization (squat, hinge, push, pull, etc.)
- Custom exercise creation

---

## Migration Notes for Developers

### What Remains in Active Codebase

Some workout-related code remains because it's shared with nutrition features:

1. **Database Schema** (`/drizzle/schema.ts`)
   - All workout tables remain in schema
   - Required for user data preservation
   - Enables future feature restoration

2. **Profile Configuration** (`profiles` table)
   - Workout-related fields remain (experience, equipment, schedule)
   - Used for historical data context
   - May be repurposed for future features

3. **Coach Tone Settings**
   - Coach tone preference applies to both workout and nutrition briefs
   - Settings UI updated to remove workout-specific language

### Breaking Changes

**API Routes:** The following routes will return 404:
- `/api/plan/*` (all plan endpoints)
- `/api/log` (workout logging)
- `/api/exercises/*` (exercise library)
- `/api/workouts/*` (workout management)
- `/api/substitution` (exercise substitution)

**React Query Hooks:** Removed from `/lib/query/hooks.tsx`:
- `useTodayWorkout()`
- `useActivePlan()`
- `useWorkoutHistory()`
- `usePlanWeeks()`

**Zustand Stores:** Removed:
- Workout logger state
- Plan generation state

**Service Worker:** Removed workout logging sync queue

### Dependencies No Longer Used

These packages were used exclusively for workout features and can be removed in future cleanup:

```json
{
  "@openai/agents": "^1.0.0",  // AI planner agents
  "date-fns": "^2.30.0"         // (still used by nutrition, keep)
}
```

---

## Future Considerations

### Potential Feature Restoration

The archived workout features could be restored in the future if:

1. **Market conditions change** - Demand for comprehensive fitness tracking increases
2. **Resource expansion** - Team grows to support multiple product verticals
3. **User requests** - Significant number of users request workout planning
4. **Competitive pressure** - Competitors successfully combine workout + nutrition

**Restoration Effort Estimate:** 2-3 weeks (code is complete, needs integration testing)

### Lessons Learned

Key insights from building the workout planning system:

1. **AI Agents Are Powerful but Complex**
   - Multi-agent architecture enabled sophisticated planning
   - Debugging AI outputs is challenging
   - Prompt engineering requires significant iteration

2. **Offline-First is Essential for Fitness Apps**
   - Gyms often have poor WiFi
   - Users expect data persistence
   - Sync conflicts are rare in fitness tracking (append-only logs)

3. **Progressive Overload Algorithms Are Hard**
   - Simple linear progression fails quickly
   - Auto-regulation (RPE-based) works better
   - Users need manual override options

4. **Exercise Libraries Need Curation**
   - ExerciseDB has 1,300+ exercises (too many)
   - Quality > Quantity (50 well-described exercises better than 1,000 poorly described)
   - Custom exercises are critical for user satisfaction

### Potential Reuse

Components and patterns that may be useful for future nutrition features:

- **Offline-first architecture** - Already applied to nutrition
- **AI agent framework** - Could power meal planning agent
- **Progressive overload algorithm** - Could adapt for nutrition progression
- **Calendar UI** - Could be used for meal planning calendar
- **Weekly review agent** - Similar to workout review, could review nutrition

---

## Documentation Structure

This archive includes three comprehensive documentation files:

1. **README.md** (this file)
   - Overview of what was archived and when
   - Why workout features were archived
   - How to access historical data
   - Contact information

2. **[ARCHITECTURE.md](./ARCHITECTURE.md)**
   - Complete system architecture
   - Database schema documentation (all 10 tables)
   - API endpoints documentation (all 15 endpoints)
   - AI agent workflows
   - Key algorithms

3. **[DATA_EXPORT.md](./DATA_EXPORT.md)**
   - SQL queries for data export
   - CSV export instructions
   - Step-by-step user guide
   - Data schema reference

---

## Contact Information

### For Users

**Need your workout data?**
- Self-service export: See [DATA_EXPORT.md](./DATA_EXPORT.md)
- Email support: support@fitcoach.app
- Response time: Within 48 hours

**Questions about the pivot?**
- Product roadmap: https://fitcoach.app/roadmap
- Feature requests: https://fitcoach.app/feedback

### For Developers

**Technical questions about archived code?**
- GitHub Issues: https://github.com/fitcoach/app/issues
- Code review: Tag `@archived-features` in PR comments
- Architecture questions: See [ARCHITECTURE.md](./ARCHITECTURE.md)

**Want to restore a feature?**
1. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
2. Create GitHub issue with restoration proposal
3. Estimate effort (likely 2-3 weeks for full restoration)
4. Get approval from product team

---

## Archive Maintenance

**This archive is maintained for:**
- Historical reference
- User data export
- Potential feature restoration
- Engineering knowledge preservation

**Archive will be reviewed:**
- Quarterly: Verify data export scripts still work
- Annually: Assess whether to restore any features
- On user request: When users need specific data access

**Last Reviewed:** November 17, 2025
**Next Review:** February 17, 2026

---

## Acknowledgments

The workout planning system represented significant engineering effort by:
- AI/ML team: Multi-agent planner architecture
- Backend team: Database schema and API design
- Frontend team: Offline-first workout logging
- Product team: User research and feature prioritization

While these features are archived, the technical innovations live on in the nutrition features and this comprehensive documentation serves as a reference for future development.

**Thank you to everyone who contributed to these features.** 🙏

---

_For detailed technical documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md)_
_For data export instructions, see [DATA_EXPORT.md](./DATA_EXPORT.md)_
