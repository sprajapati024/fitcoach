import { tool } from '@openai/agents';
import { z } from 'zod';
import { listExercises } from '@/lib/exerciseLibrary';

export const queryExercisesTool = tool({
  name: 'query_exercises',
  description: 'Search exercises by movement pattern, impact level, equipment, and PCOS compatibility. Returns exercise IDs and names.',
  parameters: z.object({
    movement: z.union([z.string(), z.null()]).optional().describe('Movement pattern: squat, hinge, lunge, horizontal_push, horizontal_pull, vertical_push, vertical_pull, carry, core, conditioning, mobility'),
    impact: z.union([z.enum(['low', 'moderate', 'high']), z.null()]).optional().describe('Impact level for PCOS safety'),
    pcosFriendly: z.union([z.boolean(), z.null()]).optional().describe('Filter for PCOS-safe exercises'),
    equipment: z.union([z.array(z.string()), z.null()]).optional().describe('Array of available equipment types: barbell, dumbbell, cable, machine, bodyweight, band, kettlebell, etc.'),
  }),
  async execute({ movement, impact, pcosFriendly, equipment }) {
    const exercises = listExercises();
    const filtered = exercises.filter(ex => {
      // Movement pattern filter
      if (movement !== undefined && movement !== null && ex.movement !== movement) return false;

      // Impact level filter
      if (impact !== undefined && impact !== null && ex.impact !== impact) return false;

      // PCOS-friendly filter
      if (pcosFriendly !== undefined && pcosFriendly !== null && ex.isPcosFriendly !== pcosFriendly) return false;

      // Equipment filter - check if exercise equipment is in the available equipment list
      if (equipment !== undefined && equipment !== null && equipment.length > 0) {
        const exerciseEquipment = ex.equipment.toLowerCase();
        const hasEquipment = equipment.some((eq: string) => {
          const normalizedEq = eq.toLowerCase().trim();
          // Check for exact match or partial match (e.g., "barbell" matches "trap_bar")
          return exerciseEquipment.includes(normalizedEq) || normalizedEq.includes(exerciseEquipment);
        });
        if (!hasEquipment) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      return 'No exercises found matching the criteria. Try broadening your search (remove equipment filters or use different movement patterns).';
    }

    // Return up to 30 exercises to avoid overwhelming the AI
    const limited = filtered.slice(0, 30);
    return limited.map(ex => `${ex.id}: ${ex.name} (${ex.equipment})`).join(', ');
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
