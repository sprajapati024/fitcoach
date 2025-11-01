import { tool } from '@openai/agents';
import { z } from 'zod';
import { listExercises } from '@/lib/exerciseLibrary';

export const queryExercisesTool = tool({
  name: 'query_exercises',
  description: 'Search exercises by movement pattern, impact level, and PCOS compatibility',
  parameters: z.object({
    movement: z.union([z.string(), z.null()]).optional().describe('Movement pattern: squat, hinge, lunge, push, pull, carry, etc.'),
    impact: z.union([z.enum(['low', 'moderate', 'high']), z.null()]).optional(),
    pcosFriendly: z.union([z.boolean(), z.null()]).optional().describe('Filter for PCOS-safe exercises'),
  }),
  async execute({ movement, impact, pcosFriendly }) {
    const exercises = listExercises();
    const filtered = exercises.filter(ex => {
      if (movement !== undefined && movement !== null && ex.movement !== movement) return false;
      if (impact !== undefined && impact !== null && ex.impact !== impact) return false;
      if (pcosFriendly !== undefined && pcosFriendly !== null && ex.isPcosFriendly !== pcosFriendly) return false;
      return true;
    });

    if (filtered.length === 0) {
      return 'No exercises found matching the criteria.';
    }

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

    if (details.length === 0) {
      return 'No exercises found with the provided IDs.';
    }

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
    const totalMinutes = blocks.reduce(
      (sum: number, block: { type: string; durationMinutes: number }) => sum + block.durationMinutes,
      0
    );
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
