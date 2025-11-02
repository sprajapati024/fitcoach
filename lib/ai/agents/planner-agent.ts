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
