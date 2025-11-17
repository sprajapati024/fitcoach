import { getExercise, listExercises } from "@/lib/exerciseLibrary";
import type { profiles } from "@/drizzle/schema";

type Profile = typeof profiles.$inferSelect;

interface SubstitutionContext {
  originalExercise: {
    id: string;
    name: string;
    movement: string;
    equipment: string;
    primaryMuscle: string;
    impact: string;
    isPcosFriendly: boolean;
  };
  reason?: string;
  userConstraints: {
    hasPcos: boolean;
    noHighImpact: boolean;
    avoidList: string[];
    availableEquipment: string[];
  };
  availableAlternatives: Array<{
    id: string;
    name: string;
    movement: string;
    equipment: string;
    impact: string;
    isPcosFriendly: boolean;
  }>;
}

/**
 * Build context for exercise substitution request
 */
export function buildSubstitutionContext({
  exerciseId,
  reason,
  userProfile,
}: {
  exerciseId: string;
  reason?: string;
  userProfile: Partial<Profile>;
}): string {
  // Get the original exercise
  const originalExercise = getExercise(exerciseId);
  if (!originalExercise) {
    throw new Error(`Exercise not found: ${exerciseId}`);
  }

  // Get all exercises from library
  const allExercises = listExercises();

  // Filter for exercises with the same movement pattern
  const samePattern = allExercises.filter(
    (ex) => ex.movement === originalExercise.movement && ex.id !== exerciseId,
  );

  // Apply user constraints
  const userConstraints = {
    hasPcos: userProfile.hasPcos ?? false,
    noHighImpact: userProfile.noHighImpact ?? false,
    avoidList: userProfile.avoidList ?? [],
    availableEquipment: userProfile.equipment ?? [],
  };

  // Filter alternatives based on constraints
  let alternatives = samePattern.filter((ex) => {
    // PCOS check
    if (userConstraints.hasPcos && !ex.isPcosFriendly) return false;

    // High impact check
    if (userConstraints.noHighImpact && ex.impact === "high") return false;

    // Avoid list check
    if (userConstraints.avoidList.some((avoid) => ex.id.includes(avoid.toLowerCase()))) {
      return false;
    }

    // Equipment check (if equipment list is provided)
    if (userConstraints.availableEquipment.length > 0) {
      const hasEquipment = userConstraints.availableEquipment.some((eq) =>
        ex.equipment.toLowerCase().includes(eq.toLowerCase()),
      );
      if (!hasEquipment) return false;
    }

    return true;
  });

  // If no alternatives found with constraints, fallback to same pattern only
  if (alternatives.length < 2) {
    alternatives = samePattern.filter((ex) => {
      // Still respect PCOS constraint (non-negotiable)
      if (userConstraints.hasPcos && !ex.isPcosFriendly) return false;
      return true;
    });
  }

  // Build context object
  const context: SubstitutionContext = {
    originalExercise: {
      id: originalExercise.id,
      name: originalExercise.name,
      movement: originalExercise.movement,
      equipment: originalExercise.equipment,
      primaryMuscle: originalExercise.primaryMuscle,
      impact: originalExercise.impact,
      isPcosFriendly: originalExercise.isPcosFriendly,
    },
    reason: reason || "User requested alternative",
    userConstraints,
    availableAlternatives: alternatives.map((ex) => ({
      id: ex.id,
      name: ex.name,
      movement: ex.movement,
      equipment: ex.equipment,
      impact: ex.impact,
      isPcosFriendly: ex.isPcosFriendly,
    })),
  };

  return JSON.stringify(context, null, 2);
}

/**
 * Build user prompt for substitution request
 */
export function buildSubstitutionPrompt({
  exerciseId,
  reason,
  userProfile,
}: {
  exerciseId: string;
  reason?: string;
  userProfile: Partial<Profile>;
}): string {
  const context = buildSubstitutionContext({ exerciseId, reason, userProfile });

  const prompt = [
    "Suggest 2-3 alternative exercises for the athlete below.",
    "Alternatives MUST:",
    "- Target the same movement pattern and muscle groups",
    "- Come from the availableAlternatives list (use the exact IDs provided)",
    "- Respect PCOS constraints if applicable",
    "- Be safe and appropriate for the user's equipment and constraints",
    "",
    "Return JSON only with fields:",
    '- alternatives: array of 2-3 objects with {exerciseId: string, rationale: string (max 80 chars)}',
    "",
    "Context:",
    context,
  ].join("\n");

  return prompt;
}
