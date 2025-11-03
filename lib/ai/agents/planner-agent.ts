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

  return `Generate a training plan for:

${JSON.stringify(payload, null, 2)}

WORKFLOW - Follow these steps in order:
1. Use query_exercises to find exercises for these movements: squat, hinge, push, pull, core
   ${payload.flags.pcos ? '   - Also query for low-impact conditioning (pcosFriendly: true)' : ''}
   ${payload.constraints.no_high_impact ? '   - Use impact: "low" or "medium" only' : ''}

2. Use get_exercise_details to get full info for your top 8-12 exercise choices

3. Design a microcycle pattern with ${payload.schedule.days_per_week} training days
   - Each day should have 2-4 blocks (warmup, strength, accessory, conditioning)
   ${payload.flags.pcos ? '   - Include Zone-2 cardio 2-3x/week (15-20 min blocks), NO HIIT >60s' : ''}
   - Assign sets/reps appropriate for ${payload.goal_bias} goal

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
