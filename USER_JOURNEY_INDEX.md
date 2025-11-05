# FitCoach User Journey - Complete Documentation Index

## Overview
This folder contains comprehensive documentation of the FitCoach application's complete user journey, from onboarding through all features.

**Generated:** November 5, 2025  
**Application:** FitCoach (AI-Powered Strength Training)  
**Tech Stack:** Next.js 16, React 19, PostgreSQL, Supabase, OpenAI

---

## Documents Included

### 1. **FITCOACH_USER_JOURNEY_MAP.md** (1,313 lines)
**Purpose:** Complete, detailed documentation of every feature  
**Best for:** Deep understanding, implementation reference, API documentation

**Covers:**
- Onboarding flow (7-step stepper with all fields and validation)
- Dashboard/Today View (coach brief, workout preview, logging)
- Plan generation (AI process, streaming, PCOS guardrails)
- Workout logging (exercise logger, offline sync, RPE tracking)
- Exercise management (library, ExerciseDB integration, PCOS flags)
- Progress tracking (metrics, analytics, 90-day history)
- Settings (preferences, plan management, account)
- AI coaching features (today, weekly, debrief, substitutions)
- Workout detail view (structure, exercises, cues)
- Complete data flow architecture
- Database schema with relationships
- Unique app features and patterns
- Security and data protection
- Performance optimizations

**Structure:** 15 sections with detailed breakdowns, code snippets, SQL schemas, and flow diagrams

---

### 2. **USER_JOURNEY_SUMMARY.md** (300+ lines)
**Purpose:** Executive summary for quick reference  
**Best for:** Project managers, product teams, new team members

**Covers:**
- 7 major user flows (1-page each)
- Key features by category (AI coaching, offline, PCOS, privacy)
- Database schema highlights
- Navigation structure
- Data flow examples (logging, plan generation)
- Unique strengths
- Common user paths (beginner, returning, plan refresh)
- Files referenced
- Quick start for developers
- Glossary of terms

**Structure:** Concise bullet points, tables, quick reference sections

---

### 3. **USER_JOURNEY_QUICK_REFERENCE.md** (400+ lines)
**Purpose:** Visual diagrams and quick lookups  
**Best for:** UX designers, QA testers, support team, developers

**Covers:**
- Complete user flow diagram (ASCII art with all 9 major sections)
- 5-minute tour for new users
- 5 critical user paths with time estimates
- AI features at a glance (coach brief, plan generation, substitutions)
- Offline-first architecture explained with diagrams
- PCOS support feature breakdown
- Suggested keyboard shortcuts (future enhancements)
- Common error states and recovery procedures
- Performance metrics and targets
- SEO and metadata
- Development checklist

**Structure:** Visual diagrams, code flows, quick tables, checklists

---

## How to Use These Documents

### For Product Managers
1. Start with **USER_JOURNEY_SUMMARY.md**
2. Review the 7 major flows
3. Understand unique strengths and user paths
4. Reference glossary for terminology

### For Developers (New to Project)
1. Start with **USER_JOURNEY_QUICK_REFERENCE.md** (flow diagram)
2. Read **USER_JOURNEY_SUMMARY.md** for overview
3. Deep dive into **FITCOACH_USER_JOURNEY_MAP.md** for specific features
4. Follow the development checklist

### For UX/UI Designers
1. Review **USER_JOURNEY_QUICK_REFERENCE.md** flow diagrams
2. Read critical user paths in section 2
3. Check common error states and recovery
4. Reference specific component sections in main document

### For QA Testers
1. Start with critical user paths in **USER_JOURNEY_QUICK_REFERENCE.md**
2. Review common error states and recovery
3. Test each major flow: onboarding → plan → logging → progress
4. Verify offline functionality

### For AI/ML Engineers
1. Review plan generation in **FITCOACH_USER_JOURNEY_MAP.md** section 3
2. Study AI system prompts in same section
3. Check PCOS guardrails implementation
4. Review coach brief generation in section 8

### For DevOps/Infrastructure
1. Check database schema in **USER_JOURNEY_SUMMARY.md**
2. Review performance metrics in **USER_JOURNEY_QUICK_REFERENCE.md**
3. Study offline sync architecture in **USER_JOURNEY_QUICK_REFERENCE.md**
4. Review security & RLS in **FITCOACH_USER_JOURNEY_MAP.md** section 14

---

## Quick Navigation

### User Flows
| Flow | Location | Key Component |
|------|----------|---------------|
| Onboarding | MAIN 1 / SUMMARY 1 | OnboardingForm.tsx |
| Dashboard | MAIN 2 / QUICK 4 | TodayView.tsx |
| Plan Generation | MAIN 3 / QUICK 5 | /api/plan/generate |
| Workout Logging | MAIN 4 / QUICK 4 | ExerciseLogger.tsx |
| Exercise Management | MAIN 5 / SUMMARY 5 | ExerciseManagement.tsx |
| Progress Tracking | MAIN 6 / SUMMARY 6 | /progress page |
| Settings | MAIN 7 / SUMMARY 7 | SettingsView.tsx |

### Key Features
| Feature | Location | Details |
|---------|----------|---------|
| AI Coach Brief | MAIN 8 / QUICK 6 | /api/coach/today |
| Offline Sync | MAIN 4 / QUICK 7 | lib/offlineQueue.ts |
| PCOS Support | MAIN 1 / QUICK 8 | Automatic guardrails |
| Streaming Plans | MAIN 3 / QUICK 6 | SSE + /api/plan/generate |
| Exercise Library | MAIN 5 / QUICK 4 | ExerciseDB integration |

### Database
| Table | Location | Purpose |
|-------|----------|---------|
| profiles | SUMMARY 4, MAIN 1 | User settings |
| plans | SUMMARY 4, MAIN 3 | Workout programs |
| workouts | SUMMARY 4, MAIN 4 | Individual sessions |
| workoutLogs | SUMMARY 4, MAIN 4 | Workout records |
| workoutLogSets | SUMMARY 4, MAIN 4 | Individual sets |
| userExercises | SUMMARY 4, MAIN 5 | Saved exercises |
| coachCache | SUMMARY 4, MAIN 8 | AI coaching cache |

### Files
| File | Location | Type |
|------|----------|------|
| app/(public)/page.tsx | MAIN 1 | Landing page |
| OnboardingForm.tsx | MAIN 1 | Onboarding |
| TodayView.tsx | MAIN 2 | Dashboard |
| PlanView.tsx | MAIN 3 | Plan management |
| ExerciseLogger.tsx | MAIN 4 | Workout logging |
| ExerciseManagement.tsx | MAIN 5 | Exercise library |
| /api/plan/generate | MAIN 3 | Plan generation API |
| /api/coach/today | MAIN 8 | Coach brief API |
| drizzle/schema.ts | MAIN 15 | Database schema |
| lib/offlineQueue.ts | MAIN 4 | Offline sync |

---

## Common Questions Answered

### "How do users get started?"
→ **FITCOACH_USER_JOURNEY_MAP.md**, Section 1: Onboarding Flow

### "What happens when a user logs a workout?"
→ **FITCOACH_USER_JOURNEY_MAP.md**, Section 4: Workout Logging
→ **USER_JOURNEY_QUICK_REFERENCE.md**, User Path A: Daily Logger

### "How is the plan generated?"
→ **FITCOACH_USER_JOURNEY_MAP.md**, Section 3: Plan Generation
→ **USER_JOURNEY_QUICK_REFERENCE.md**, AI Features at a Glance

### "What happens if the user goes offline?"
→ **FITCOACH_USER_JOURNEY_MAP.md**, Section 4: Offline Handling
→ **USER_JOURNEY_QUICK_REFERENCE.md**, Offline-First Architecture

### "How are PCOS users supported?"
→ **FITCOACH_USER_JOURNEY_MAP.md**, Section 11: PCOS Considerations
→ **USER_JOURNEY_QUICK_REFERENCE.md**, PCOS Support Feature

### "What does the coach AI do?"
→ **FITCOACH_USER_JOURNEY_MAP.md**, Section 8: AI Coach Features
→ **USER_JOURNEY_QUICK_REFERENCE.md**, AI Features at a Glance

### "How are user workouts stored?"
→ **FITCOACH_USER_JOURNEY_MAP.md**, Section 4: Data Storage
→ **USER_JOURNEY_SUMMARY.md**, Database Schema Highlights

### "What routes do I need to know?"
→ **FITCOACH_USER_JOURNEY_MAP.md**, Section 12: Key Components & Patterns
→ **USER_JOURNEY_QUICK_REFERENCE.md**, Complete User Flow Diagram

---

## Key Statistics

**Complete Documentation:**
- Main document: 1,313 lines of detailed content
- Summary document: 300+ lines of executive overview
- Quick reference: 400+ lines of visual guides
- Total: ~2,000 lines of comprehensive documentation

**Coverage:**
- 7 major user flows
- 15 API routes documented
- 8+ core components detailed
- 7 database tables explained
- 4 AI coaching contexts described
- 5+ user path examples
- 3 offline sync flows explained

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 5, 2025 | Initial comprehensive documentation |

---

## Contributing

To maintain and update this documentation:

1. **When adding a feature:** Update the relevant section in MAIN document
2. **When changing a flow:** Update SUMMARY document and QUICK_REFERENCE diagrams
3. **When adding routes:** Update both MAIN document section 12 and file references
4. **When modifying DB schema:** Update section 15 in MAIN and section 4 in SUMMARY

---

## Contact & Support

For questions about the FitCoach user journey:
1. Check the relevant document using the navigation table above
2. Review the quick reference diagrams
3. Search for your specific question in the Q&A section
4. Reference the file locations and code snippets provided

---

## Additional Resources

### In the Repository
- `/drizzle/schema.ts` - Database schema definitions
- `/lib/ai/prompts.ts` - AI system prompts
- `/lib/offlineQueue.ts` - Offline sync implementation
- `/middleware.ts` - Authentication and routing guards
- `/app/actions/` - Server actions for data mutations
- `/app/api/` - API routes for external integrations

### External Tools
- [Supabase Docs](https://supabase.com/docs) - Authentication & Database
- [OpenAI Agents SDK](https://github.com/openai/agents) - Plan generation
- [ExerciseDB](https://rapidapi.com/Justin-WeibelRapidAPI/api/exercisedb) - Exercise library
- [Next.js Docs](https://nextjs.org/docs) - Framework

---

## Summary

You now have three comprehensive documents covering the FitCoach user journey:

1. **FITCOACH_USER_JOURNEY_MAP.md** - The deep reference
2. **USER_JOURNEY_SUMMARY.md** - The quick overview
3. **USER_JOURNEY_QUICK_REFERENCE.md** - The visual guide

Together, they provide complete coverage of:
- Every user action and interaction
- Every data flow and API call
- Every database table and relationship
- Every AI feature and guardrail
- Every error state and recovery path
- Performance targets and optimization strategies

Start with the document that matches your role, then reference the others as needed.

**Happy exploring!**

---

*Documentation generated: November 5, 2025*  
*For FitCoach application version: 0.1.0*
