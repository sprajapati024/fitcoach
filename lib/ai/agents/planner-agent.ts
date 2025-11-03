import { Agent, run } from '@openai/agents';
import { plannerResponseSchema, adaptiveWeekResponseSchema } from '@/lib/validation';
import { plannerSystemPrompt, initialWeekPromptTemplate, subsequentWeekPromptTemplate } from '@/lib/ai/prompts';
import { queryExercisesTool, getExerciseDetailsTool, validateTimeBudgetTool } from './tools';
import type { profiles } from '@/drizzle/schema';

type Profile = typeof profiles.$inferSelect;

export const plannerAgent = new Agent({
  name: 'FitCoach Planner',
  instructions: plannerSystemPrompt,
  model: 'gpt-4o',
  tools: [queryExercisesTool, getExerciseDetailsTool, validateTimeBudgetTool],
  outputType: plannerResponseSchema,
});

export async function runPlannerAgent(profile: Profile) {
  const userPrompt = buildCompactPlannerPrompt(profile);

  const result = await run(plannerAgent, userPrompt, { maxTurns: 15 });

  // SDK automatically validates and parses output when outputType is set
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

  // Determine workout template based on training frequency
  const templateGuidance = getTemplateGuidance(payload.schedule.days_per_week);

  // Get experience-specific exercise selection guidance
  const experienceGuidance = getExperienceGuidance(payload.experience);

  // Get goal-specific programming guidance
  const goalGuidance = getGoalGuidance(payload.goal_bias);

  return `Generate a training plan for:

${JSON.stringify(payload, null, 2)}

TEMPLATE STRUCTURE:
${templateGuidance}

EXPERIENCE-APPROPRIATE EXERCISE SELECTION:
${experienceGuidance}

GOAL-SPECIFIC PROGRAMMING:
${goalGuidance}

WORKFLOW - Follow these steps in order:
1. Use query_exercises to find exercises matching the template structure above
   - Query by movement pattern (squat, hinge, horizontal_push, horizontal_pull, vertical_push, vertical_pull)
   ${payload.flags.pcos ? '   - Also query for low-impact conditioning (pcosFriendly: true)' : ''}
   ${payload.constraints.no_high_impact ? '   - Use impact: "low" or "medium" only' : ''}
   - Select exercises appropriate for ${payload.experience} level

2. Use get_exercise_details to get full info for your top 10-15 exercise choices
   - Prioritize exercises matching the template focus for each day
   - Ensure equipment availability matches user's list

3. Design a microcycle pattern following the ${templateGuidance.split(':')[0]} template
   - Each day should have 2-4 blocks (warmup, strength, accessory, conditioning)
   - Follow the exercise hierarchy: Primary Compound → Secondary Compound → Accessories → Core/Conditioning
   ${payload.flags.pcos ? '   - Include Zone-2 cardio 2-3x/week (15-20 min blocks), NO HIIT >60s' : ''}
   - Assign sets/reps appropriate for ${payload.goal_bias} goal
   - Keep primary lifts consistent across the template

4. Use validate_time_budget to ensure each day fits within ${payload.schedule.minutes_per_session} minutes
   - If over budget, reduce accessory volume or conditioning duration
   - Validate again after adjustments

5. Once validated, STOP calling tools and return the structured JSON immediately

CRITICAL: After step 5, do NOT call any more tools. Return the JSON output matching PlannerResponse schema.

NOTE: You only need to generate the microcycle pattern (${payload.schedule.days_per_week} days). The app will handle:
- Generating the plan ID
- Expanding the pattern across ${payload.schedule.weeks} weeks
- Creating the weekly focus descriptions
- Scheduling workouts on preferred days

${payload.constraints.avoid.length > 0 ? `AVOID: ${payload.constraints.avoid.join(', ')}` : ''}`;
}

// Template guidance based on training frequency
function getTemplateGuidance(daysPerWeek: number): string {
  switch (daysPerWeek) {
    case 3:
      return `Full Body (3 days/week)
- Structure: Each session includes major movement patterns
- Day 1: Squat-focused + horizontal push + vertical pull + core
  Example: Back Squat, Bench Press, Pull-ups, Plank variations
- Day 2: Hinge-focused + vertical push + horizontal pull + conditioning
  Example: Deadlift, Shoulder Press, Barbell Row, Zone-2 cardio
- Day 3: Squat/Lunge variation + horizontal push variation + vertical pull + core
  Example: Front Squat, Incline Press, Lat Pulldown, Ab wheel
- Focus: Hit all major patterns 3x/week for balanced development`;

    case 4:
      return `Upper/Lower Split (4 days/week)
- Structure: 2 upper body days, 2 lower body days
- Upper A: Horizontal push emphasis + rows + vertical push + arms
  Example: Bench Press, Barbell Row, Shoulder Press, Bicep Curls
- Lower A: Squat variation + hinge variation + unilateral + posterior chain
  Example: Back Squat, Romanian Deadlift, Bulgarian Split Squat, Leg Curls
- Upper B: Vertical push emphasis + vertical pull + horizontal push variation + rear delts
  Example: Shoulder Press, Pull-ups, Incline DB Press, Face Pulls
- Lower B: Hinge emphasis + squat variation + unilateral + core
  Example: Deadlift, Front Squat, Walking Lunges, Hanging Leg Raises
- Focus: Balanced upper/lower split with varied exercise selection`;

    case 5:
      return `Push/Pull/Legs (5 days/week)
- Structure: Push day, Pull day, Legs day (repeat with variations)
- Push A: Horizontal press + vertical press + triceps + lateral delts
  Example: Bench Press, Shoulder Press, Dips, Lateral Raises
- Pull A: Deadlift + horizontal pull + vertical pull + biceps
  Example: Deadlift, Barbell Row, Lat Pulldown, Hammer Curls
- Legs A: Squat emphasis + hinge variation + unilateral + calves
  Example: Back Squat, Romanian Deadlift, Lunges, Calf Raises
- Push B: Incline press + vertical press variation + triceps isolation
  Example: Incline Press, DB Shoulder Press, Overhead Tricep Extension
- Pull B: Horizontal pull variation + vertical pull + rear delts + biceps
  Example: Cable Row, Pull-ups, Face Pulls, Bicep Curls
- Focus: High frequency with exercise variation to prevent fatigue`;

    case 6:
      return `Push/Pull/Legs (6 days/week - 2 full cycles)
- Structure: PPL repeated twice per week with exercise variation
- Cycle 1 (Mon/Wed/Fri): Primary compound focus with heavier loads
  Push: Barbell bench, Barbell OHP, Dips
  Pull: Deadlift, Barbell row, Pull-ups
  Legs: Back squat, RDL, Split squat
- Cycle 2 (Tue/Thu/Sat): Variation emphasis with hypertrophy focus
  Push: Incline DB press, DB shoulder press, Cable flies
  Pull: Cable row, Lat pulldown, Face pulls
  Legs: Front squat, Leg press, Leg curls
- Focus: High volume with strategic exercise variation and periodization`;

    default:
      return `Full Body (${daysPerWeek} days/week)
- Default to balanced full-body template
- Hit all major movement patterns each session
- Vary exercise selection across days`;
  }
}

// Experience-specific exercise selection guidance
function getExperienceGuidance(experience: string): string {
  switch (experience) {
    case 'beginner':
      return `BEGINNER Exercise Selection (Movement Mastery Focus):
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
- RATIONALE: Build foundational movement patterns and work capacity`;

    case 'intermediate':
      return `INTERMEDIATE Exercise Selection (Progressive Overload Focus):
- PRIMARY COMPOUNDS: Include moderate variations
  → Squat: Back squat, Front squat, Safety bar squat
  → Hinge: Deadlift, RDL, Trap bar deadlift
  → Horizontal push: Bench press, Incline press, Close-grip bench
  → Horizontal pull: Barbell row, T-bar row, Chest-supported row
  → Vertical push: Shoulder press, Push press, Landmine press
  → Vertical pull: Pull-ups, Chin-ups, Weighted variations
- CAN INCLUDE: Tempo variations, pause reps, unilateral work
- ACCESSORIES: Targeted assistance (split squats, face pulls, lateral raises)
- REP RANGES: 6-10 reps for main compounds, 8-12 for accessories
- INTENSITY: Target RPE 7-8 on main lifts
- RATIONALE: Build strength with appropriate variation and volume`;

    case 'advanced':
      return `ADVANCED Exercise Selection (Specialization Focus):
- PRIMARY COMPOUNDS: All variations available
  → Squat: Back, Front, Safety bar, Pause, Tempo, Box squats
  → Hinge: Conventional, Sumo, Deficit, Block pulls, Stiff-leg
  → Horizontal push: Competition bench, Board press, Floor press, Chains
  → Horizontal pull: All row variations, Pendlay rows, Meadows rows
  → Vertical push: Military press, Push press, Jerk, Handstand push-ups
  → Vertical pull: Weighted pull-ups, Muscle-ups, One-arm variations
- CAN INCLUDE: Advanced techniques (clusters, rest-pause, accommodating resistance)
- ACCESSORIES: Specialization work targeting weaknesses
- REP RANGES: Varied 4-15 depending on phase and exercise
- INTENSITY: Target RPE 8-9 on primary lifts
- RATIONALE: Maximize strength adaptations with sophisticated programming`;

    default:
      return `Exercise selection should match user's experience level`;
  }
}

// Goal-specific programming guidance
function getGoalGuidance(goalBias: string): string {
  switch (goalBias) {
    case 'strength':
      return `STRENGTH Goal Programming:
- Sets: 3-5 per exercise
- Reps: 3-6 for main compounds, 6-8 for accessories
- Focus: Heavy primary compounds with minimal accessories
- Structure: Primary compound + 1-2 secondary compounds + 1-2 accessories max
- Example block: Squat 4x5, Romanian Deadlift 3x6, Leg Curls 3x8`;

    case 'hypertrophy':
      return `HYPERTROPHY Goal Programming:
- Sets: 3-4 per exercise
- Reps: 8-12 for most exercises, 6-8 for heavy compounds
- Focus: Balance of compounds and targeted accessories
- Structure: Primary compound + 2-3 secondary/accessories + isolation work
- Example block: Bench Press 4x8, Incline DB Press 3x10, Cable Flies 3x12, Tricep Extensions 3x12`;

    case 'balanced':
      return `BALANCED Goal Programming:
- Sets: 3-4 per exercise
- Reps: 6-10 for compounds, 8-12 for accessories
- Focus: Mix of strength and hypertrophy work
- Structure: Primary compound + 1-2 secondary compounds + 1-2 accessories
- Example block: Deadlift 4x6, Front Squat 3x8, Leg Press 3x10, Leg Curls 3x10`;

    case 'fat_loss':
      return `FAT LOSS Goal Programming:
- Sets: 3-4 per exercise
- Reps: 10-15 for most exercises
- Focus: Maintain muscle while maximizing calorie burn
- Structure: Circuits when possible, superset compatible exercises, include conditioning
- Example block: Squat 3x12, RDL 3x12 (superset), Lunges 3x15, 10min Zone-2 finisher`;

    default:
      return `Programming should align with user's stated goals`;
  }
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

// ============================================================================
// Phase 3: Adaptive Planning Agent Modes
// ============================================================================

/**
 * Adaptive planner agent for week-by-week generation
 * Uses adaptiveWeekResponseSchema for structured weekly output
 */
export const adaptivePlannerAgent = new Agent({
  name: 'FitCoach Adaptive Planner',
  instructions: `You are FitCoach Adaptive Planner. You generate training weeks one at a time, adapting to user performance.

Key Responsibilities:
- Generate structured weekly training plans with RPE targets
- Adapt volume and intensity based on previous week performance
- Respect PCOS guardrails and user constraints
- Provide detailed progression rationale for each week

Output Format:
- Use adaptiveWeekResponseSchema
- Include targetRPE and progressionNotes for each exercise
- Provide coachingNotes for the week explaining adaptations
- Keep cues short (<= 10 words) and actionable

Never assign specific weights - only RPE targets.`,
  model: 'gpt-4o',
  tools: [queryExercisesTool, getExerciseDetailsTool, validateTimeBudgetTool],
  outputType: adaptiveWeekResponseSchema,
});

/**
 * Generate initial week (Week 1) with baseline assessment
 * This is the entry point for a new training plan
 */
export async function generateInitialWeek(profile: Profile) {
  const userContext = {
    experience: profile.experienceLevel as "beginner" | "intermediate" | "advanced",
    hasPcos: profile.hasPcos,
    daysPerWeek: profile.scheduleDaysPerWeek || 3,
    minutesPerSession: profile.scheduleMinutesPerSession || 60,
    equipment: profile.equipment || [],
    avoidList: profile.avoidList || [],
    noHighImpact: profile.noHighImpact,
  };

  const prompt = initialWeekPromptTemplate(userContext);

  const workflowSteps = `
WORKFLOW - Follow these steps:
1. Use query_exercises to find exercises for: squat, hinge, push, pull, core
   ${userContext.hasPcos ? '   - Also query for low-impact conditioning (pcosFriendly: true)' : ''}
   ${userContext.noHighImpact ? '   - Use impact: "low" or "medium" only' : ''}

2. Use get_exercise_details to get full info for your top 8-12 choices

3. Design ${userContext.daysPerWeek} training days with:
   - Warm-up (5-10 min): mobility, activation
   - Primary strength (20-30 min): compound movements with targetRPE
   - Accessory work (10-15 min): isolation or secondary compounds
   - Optional conditioning (5-15 min): ${userContext.hasPcos ? 'Zone-2 steady-state' : 'metabolic finisher'}

4. Use validate_time_budget to ensure each day fits ${userContext.minutesPerSession} minutes

5. Return JSON matching adaptiveWeekResponseSchema

${userContext.avoidList.length > 0 ? `AVOID: ${userContext.avoidList.join(', ')}` : ''}
`;

  const fullPrompt = prompt + '\n\n' + workflowSteps;

  const result = await run(adaptivePlannerAgent, fullPrompt, { maxTurns: 15 });

  return {
    success: true,
    data: result.finalOutput,
  };
}

/**
 * Generate next week based on previous week performance
 * Uses performance data to adapt volume/intensity progressively
 */
export async function generateNextWeek(
  profile: Profile,
  weekNumber: number,
  phase: "accumulation" | "intensification" | "deload" | "realization",
  previousWeekData: {
    workouts: Array<{
      focus: string;
      completedSets: number;
      targetSets: number;
      avgRPE: number;
      notes?: string;
    }>;
    overallAdherence: number;
    avgRPEAcrossWeek: number;
    userFeedback?: string;
  }
) {
  const userContext = {
    experience: profile.experienceLevel as "beginner" | "intermediate" | "advanced",
    hasPcos: profile.hasPcos,
    daysPerWeek: profile.scheduleDaysPerWeek || 3,
    minutesPerSession: profile.scheduleMinutesPerSession || 60,
  };

  const prompt = subsequentWeekPromptTemplate(
    weekNumber,
    phase,
    previousWeekData,
    userContext
  );

  const workflowSteps = `
WORKFLOW - Follow these steps:
1. Analyze previous week performance to determine progression strategy:
   - If adherence >= 90% and RPE appropriate: increase volume or intensity
   - If adherence 75-90%: maintain current difficulty
   - If adherence < 75%: reduce volume or intensity

2. Use query_exercises if you need to substitute exercises (only if user struggled)
   - Otherwise, maintain exercise selection for consistency

3. Adjust targetRPE based on ${phase} phase:
   ${phase === 'accumulation' ? '- Target RPE 7-8' : ''}
   ${phase === 'intensification' ? '- Target RPE 8-9' : ''}
   ${phase === 'deload' ? '- Target RPE 6-7 (recovery week)' : ''}
   ${phase === 'realization' ? '- Target RPE 9-10 (peak testing)' : ''}

4. Use validate_time_budget to ensure each day fits ${userContext.minutesPerSession} minutes

5. Return JSON matching adaptiveWeekResponseSchema with detailed progressionRationale

${userContext.hasPcos ? 'CRITICAL: Maintain PCOS-friendly programming (low-impact, Zone-2 cardio)' : ''}
`;

  const fullPrompt = prompt + '\n\n' + workflowSteps;

  const result = await run(adaptivePlannerAgent, fullPrompt, { maxTurns: 15 });

  return {
    success: true,
    data: result.finalOutput,
  };
}
