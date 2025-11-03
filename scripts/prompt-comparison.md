# Workout Plan Generation Prompt - Before vs After

## Scenario: Beginner User, 4 Days/Week Training

---

## ❌ BEFORE (Old Prompt)

```
Generate a training plan for:

{
  "user": { "sex": "female", "age": 25, "height_cm": 165, "weight_kg": 60 },
  "flags": { "pcos": false },
  "experience": "beginner",
  "schedule": { "days_per_week": 4, "minutes_per_session": 60, "weeks": 8 },
  "equipment": { "available": ["barbell", "dumbbell", "bench", "squat_rack"] },
  "goal_bias": "balanced",
  "constraints": { "avoid": [], "no_high_impact": false }
}

WORKFLOW - Follow these steps in order:
1. Use query_exercises to find exercises for these movements: squat, hinge, push, pull, core
2. Use get_exercise_details to get full info for your top 8-12 exercise choices
3. Design a microcycle pattern with 4 training days
   - Each day should have 2-4 blocks (warmup, strength, accessory, conditioning)
   - Assign sets/reps appropriate for balanced goal
4. Use validate_time_budget to ensure each day fits within 60 minutes
5. Once validated, STOP calling tools and return the structured JSON immediately
```

### Issues with Old Prompt:
- ❌ **No template guidance** - AI picks random exercises without structure
- ❌ **No experience matching** - Could suggest advanced moves to beginners
- ❌ **Generic "squat, hinge, push, pull"** - Too vague, leads to random selection
- ❌ **No workout split specified** - Could create 4 random full-body days
- ❌ **No consistency rules** - Each workout could be completely different

---

## ✅ AFTER (New Optimized Prompt)

```
Generate a training plan for:

{
  "user": { "sex": "female", "age": 25, "height_cm": 165, "weight_kg": 60 },
  "flags": { "pcos": false },
  "experience": "beginner",
  "schedule": { "days_per_week": 4, "minutes_per_session": 60, "weeks": 8 },
  "equipment": { "available": ["barbell", "dumbbell", "bench", "squat_rack"] },
  "goal_bias": "balanced",
  "constraints": { "avoid": [], "no_high_impact": false }
}

TEMPLATE STRUCTURE:
Upper/Lower Split (4 days/week)
- Structure: 2 upper body days, 2 lower body days
- Upper A: Horizontal push emphasis + rows + vertical push + arms
  Example: Bench Press, Barbell Row, Shoulder Press, Bicep Curls
- Lower A: Squat variation + hinge variation + unilateral + posterior chain
  Example: Back Squat, Romanian Deadlift, Bulgarian Split Squat, Leg Curls
- Upper B: Vertical push emphasis + vertical pull + horizontal push variation + rear delts
  Example: Shoulder Press, Pull-ups, Incline DB Press, Face Pulls
- Lower B: Hinge emphasis + squat variation + unilateral + core
  Example: Deadlift, Front Squat, Walking Lunges, Hanging Leg Raises
- Focus: Balanced upper/lower split with varied exercise selection

EXPERIENCE-APPROPRIATE EXERCISE SELECTION:
BEGINNER Exercise Selection (Movement Mastery Focus):
- PRIMARY COMPOUNDS: Use basic bilateral movements only
  → Squat pattern: Back Squat, Goblet Squat
  → Hinge pattern: Conventional Deadlift, Romanian Deadlift
  → Horizontal push: Barbell Bench Press, Dumbbell Bench Press
  → Horizontal pull: Barbell Row, Cable Row
  → Vertical push: Shoulder Press (DB or BB)
  → Vertical pull: Lat Pulldown, Assisted Pull-ups
- AVOID: Front squats, sumo deadlifts, complex variations, Olympic lifts
- ACCESSORIES: Simple isolation movements (leg curl, bicep curl, tricep extension)
- REP RANGES: 8-12 reps for compounds, 10-15 for accessories
- INTENSITY: Start conservative (RPE 6-7), focus on form
- RATIONALE: Build foundational movement patterns and work capacity

GOAL-SPECIFIC PROGRAMMING:
BALANCED Goal Programming:
- Sets: 3-4 per exercise
- Reps: 6-10 for compounds, 8-12 for accessories
- Focus: Mix of strength and hypertrophy work
- Structure: Primary compound + 1-2 secondary compounds + 1-2 accessories
- Example block: Deadlift 4x6, Front Squat 3x8, Leg Press 3x10, Leg Curls 3x10

WORKFLOW - Follow these steps in order:
1. Use query_exercises to find exercises matching the template structure above
   - Query by movement pattern (squat, hinge, horizontal_push, horizontal_pull, vertical_push, vertical_pull)
   - Select exercises appropriate for beginner level
2. Use get_exercise_details to get full info for your top 10-15 exercise choices
   - Prioritize exercises matching the template focus for each day
   - Ensure equipment availability matches user's list
3. Design a microcycle pattern following the Upper/Lower Split (4 days/week) template
   - Each day should have 2-4 blocks (warmup, strength, accessory, conditioning)
   - Follow the exercise hierarchy: Primary Compound → Secondary Compound → Accessories → Core/Conditioning
   - Assign sets/reps appropriate for balanced goal
   - Keep primary lifts consistent across the template
4. Use validate_time_budget to ensure each day fits within 60 minutes
5. Once validated, STOP calling tools and return the structured JSON immediately
```

### Improvements in New Prompt:
- ✅ **Clear template structure** - Upper/Lower Split explicitly defined
- ✅ **Experience-matched exercises** - Only basic bilateral compounds for beginners
- ✅ **Specific movement patterns** - Detailed examples for each day
- ✅ **Workout split defined** - 2 upper, 2 lower days with clear focuses
- ✅ **Consistency built-in** - Template structure ensures coherent programming
- ✅ **Exercise hierarchy** - Primary → Secondary → Accessories → Conditioning
- ✅ **Goal-specific parameters** - Sets/reps aligned with "balanced" goal

---

## Expected Outcome Comparison

### ❌ Old Prompt Might Generate:
```
Day 1: Front Squat, Overhead Press, Bulgarian Split Squat, Box Jumps
Day 2: Sumo Deadlift, Cable Flies, Kettlebell Swings, Burpees
Day 3: Hack Squat, Dips, Face Pulls, Jump Lunges
Day 4: Deficit Deadlift, Landmine Press, Walking Lunges, Battle Ropes
```
**Problems**: Too advanced for beginner, no clear split, random exercises, inconsistent structure

### ✅ New Prompt Will Generate:
```
Day 1 (Upper A): Bench Press, Barbell Row, Shoulder Press, Bicep Curls
Day 2 (Lower A): Back Squat, Romanian Deadlift, Goblet Squat, Leg Curls
Day 3 (Upper B): Shoulder Press, Lat Pulldown, Incline DB Press, Face Pulls
Day 4 (Lower B): Deadlift, Goblet Squat, Dumbbell Lunges, Plank
```
**Benefits**: Beginner-appropriate, clear Upper/Lower split, basic compounds, structured progression

---

## Summary of Key Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Template Structure** | None - random workouts | Upper/Lower, PPL, or Full Body based on days/week |
| **Exercise Selection** | Generic movement patterns | Experience-specific with examples (beginner/intermediate/advanced) |
| **Workout Split** | Undefined | Explicitly defined (e.g., Upper A/B, Lower A/B) |
| **Consistency** | Each day could be random | Template ensures structure across all days |
| **Goal Alignment** | Generic sets/reps | Specific parameters for strength/hypertrophy/fat loss |
| **Progression** | Not addressed | Clear hierarchy and progression strategy |

---

## Result

The new prompts will generate **professional, structured workout plans** that:
- Follow proven templates (Upper/Lower, Push/Pull/Legs, Full Body)
- Match user experience level (no complex moves for beginners)
- Align with fitness goals (appropriate sets/reps/rest)
- Maintain consistency (same template structure, core lifts stay consistent)
- Progress logically (systematic overload, strategic accessory rotation)
