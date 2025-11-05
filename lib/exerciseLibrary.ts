import { db } from "./db";
import { userExercises } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

export type MovementPattern =
  | "squat"
  | "hinge"
  | "lunge"
  | "horizontal_push"
  | "horizontal_pull"
  | "vertical_push"
  | "vertical_pull"
  | "carry"
  | "core"
  | "conditioning"
  | "mobility";

export type ImpactLevel = "low" | "moderate" | "high";

export interface ExerciseDefinition {
  id: string;
  name: string;
  aliases: string[];
  movement: MovementPattern;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  impact: ImpactLevel;
  isPcosFriendly: boolean;
  notes?: string;
}

const catalog: ExerciseDefinition[] = [
  {
    id: "trap_bar_deadlift",
    name: "Trap Bar Deadlift",
    aliases: ["hex bar deadlift", "neutral grip deadlift"],
    movement: "hinge",
    primaryMuscle: "posterior chain",
    secondaryMuscles: ["hamstrings", "glutes", "upper back"],
    equipment: "trap_bar",
    impact: "low",
    isPcosFriendly: true,
    notes: "Neutral grip hinge with reduced lumbar stress.",
  },
  {
    id: "front_squat",
    name: "Front Squat",
    aliases: ["front barbell squat"],
    movement: "squat",
    primaryMuscle: "quadriceps",
    secondaryMuscles: ["glutes", "core"],
    equipment: "barbell",
    impact: "moderate",
    isPcosFriendly: true,
  },
  {
    id: "rear_foot_elevated_split_squat",
    name: "Rear-Foot Elevated Split Squat",
    aliases: ["rfess", "bulgarian split squat"],
    movement: "lunge",
    primaryMuscle: "quadriceps",
    secondaryMuscles: ["glutes", "adductors"],
    equipment: "dumbbell",
    impact: "moderate",
    isPcosFriendly: true,
  },
  {
    id: "bench_press",
    name: "Barbell Bench Press",
    aliases: ["flat bench", "bench"],
    movement: "horizontal_push",
    primaryMuscle: "chest",
    secondaryMuscles: ["triceps", "anterior delts"],
    equipment: "barbell",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "incline_db_press",
    name: "Incline Dumbbell Press",
    aliases: ["incline press"],
    movement: "horizontal_push",
    primaryMuscle: "upper chest",
    secondaryMuscles: ["triceps", "front delts"],
    equipment: "dumbbell",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "half_kneel_press",
    name: "Half-Kneeling Dumbbell Press",
    aliases: ["half kneeling shoulder press"],
    movement: "vertical_push",
    primaryMuscle: "shoulders",
    secondaryMuscles: ["triceps", "core"],
    equipment: "dumbbell",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "chest_supported_row",
    name: "Chest-Supported Row",
    aliases: ["incline row"],
    movement: "horizontal_pull",
    primaryMuscle: "upper back",
    secondaryMuscles: ["lats", "posterior delts"],
    equipment: "dumbbell",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "lat_pulldown",
    name: "Lat Pulldown",
    aliases: ["cable pulldown"],
    movement: "vertical_pull",
    primaryMuscle: "lats",
    secondaryMuscles: ["biceps", "upper back"],
    equipment: "machine",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "seated_cable_row",
    name: "Seated Cable Row",
    aliases: ["low row"],
    movement: "horizontal_pull",
    primaryMuscle: "mid-back",
    secondaryMuscles: ["biceps", "rear delts"],
    equipment: "cable",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "hip_thrust",
    name: "Barbell Hip Thrust",
    aliases: ["hip bridge"],
    movement: "hinge",
    primaryMuscle: "glutes",
    secondaryMuscles: ["hamstrings"],
    equipment: "barbell",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "walking_lunge",
    name: "Dumbbell Walking Lunge",
    aliases: ["db walking lunge"],
    movement: "lunge",
    primaryMuscle: "glutes",
    secondaryMuscles: ["quads", "core"],
    equipment: "dumbbell",
    impact: "moderate",
    isPcosFriendly: true,
  },
  {
    id: "pallof_press",
    name: "Pallof Press",
    aliases: ["anti-rotation press"],
    movement: "core",
    primaryMuscle: "core",
    secondaryMuscles: ["obliques"],
    equipment: "cable",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "dead_bug",
    name: "Dead Bug",
    aliases: ["deadbug"],
    movement: "core",
    primaryMuscle: "core",
    secondaryMuscles: ["hip flexors"],
    equipment: "bodyweight",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "side_plank",
    name: "Side Plank",
    aliases: [],
    movement: "core",
    primaryMuscle: "obliques",
    secondaryMuscles: ["glute med"],
    equipment: "bodyweight",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "bike_zone2",
    name: "Bike - Zone 2",
    aliases: ["stationary bike zone 2"],
    movement: "conditioning",
    primaryMuscle: "cardio",
    secondaryMuscles: ["legs"],
    equipment: "bike",
    impact: "low",
    isPcosFriendly: true,
    notes: "Steady state aerobic, ideal for PCOS guardrails.",
  },
  {
    id: "treadmill_walk",
    name: "Incline Treadmill Walk",
    aliases: ["zone 2 walk"],
    movement: "conditioning",
    primaryMuscle: "cardio",
    secondaryMuscles: ["hamstrings"],
    equipment: "treadmill",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "rower_zone2",
    name: "Row Erg Zone 2",
    aliases: ["erg zone 2"],
    movement: "conditioning",
    primaryMuscle: "cardio",
    secondaryMuscles: ["back", "legs"],
    equipment: "rower",
    impact: "moderate",
    isPcosFriendly: true,
  },
  {
    id: "sled_push",
    name: "Sled Push",
    aliases: ["prowler push"],
    movement: "conditioning",
    primaryMuscle: "legs",
    secondaryMuscles: ["glutes", "core"],
    equipment: "sled",
    impact: "moderate",
    isPcosFriendly: true,
  },
  {
    id: "band_pull_apart",
    name: "Band Pull Apart",
    aliases: ["banded pull apart"],
    movement: "horizontal_pull",
    primaryMuscle: "rear delts",
    secondaryMuscles: ["upper back"],
    equipment: "band",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "face_pull",
    name: "Cable Face Pull",
    aliases: [],
    movement: "horizontal_pull",
    primaryMuscle: "rear delts",
    secondaryMuscles: ["upper back"],
    equipment: "cable",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "box_jump",
    name: "Box Jump",
    aliases: [],
    movement: "squat",
    primaryMuscle: "power",
    secondaryMuscles: ["glutes", "calves"],
    equipment: "plyo_box",
    impact: "high",
    isPcosFriendly: false,
    notes: "Marked high impact to respect PCOS guardrails.",
  },
];

const exerciseMap = new Map<string, ExerciseDefinition>();
const aliasMap = new Map<string, string>();

catalog.forEach((exercise) => {
  exerciseMap.set(exercise.id.toLowerCase(), exercise);
  exercise.aliases.forEach((alias) => {
    aliasMap.set(alias.toLowerCase(), exercise.id);
  });
  aliasMap.set(exercise.name.toLowerCase(), exercise.id);
});

export const exerciseCatalog = Object.freeze(catalog);

export function listExercises() {
  return exerciseCatalog;
}

export function resolveExerciseId(idOrAlias: string) {
  const normalized = idOrAlias.toLowerCase();
  if (exerciseMap.has(normalized)) {
    return normalized;
  }
  const alias = aliasMap.get(normalized);
  return alias ? alias.toLowerCase() : undefined;
}

export function getExercise(idOrAlias: string) {
  const resolved = resolveExerciseId(idOrAlias);
  return resolved ? exerciseMap.get(resolved) ?? null : null;
}

export function recommendAlternatives(
  idOrAlias: string,
  options: { limit?: number; excludeHighImpact?: boolean } = {},
) {
  const current = getExercise(idOrAlias);
  if (!current) {
    return [];
  }

  const { limit = 3, excludeHighImpact = true } = options;
  return catalog
    .filter((exercise) => exercise.id !== current.id)
    .filter((exercise) => exercise.movement === current.movement)
    .filter((exercise) => exercise.isPcosFriendly)
    .filter((exercise) => !excludeHighImpact || exercise.impact !== "high")
    .slice(0, limit);
}

export function isPcosSafe(idOrAlias: string) {
  const exercise = getExercise(idOrAlias);
  return exercise?.isPcosFriendly ?? true;
}

/**
 * Extended exercise library functions for user custom exercises
 * Get all exercises for a user (built-in + custom)
 */
export async function getAllExercisesForUser(userId: string): Promise<ExerciseDefinition[]> {
  // Get user's custom exercises from database
  const customExercises = await db
    .select()
    .from(userExercises)
    .where(eq(userExercises.userId, userId));

  // Transform custom exercises to match ExerciseDefinition format
  const transformedCustom: ExerciseDefinition[] = customExercises.map((ex) => ({
    id: ex.exerciseId,
    name: ex.name,
    aliases: [], // Custom exercises don't have aliases
    movement: mapBodyPartsToMovement(ex.bodyParts),
    primaryMuscle: ex.targetMuscles[0] || "unknown",
    secondaryMuscles: ex.secondaryMuscles,
    equipment: ex.equipment[0] || "unknown",
    impact: (ex.impactLevel as ImpactLevel) || "moderate",
    isPcosFriendly: ex.isPcosSafe,
    notes: ex.description,
  }));

  // Merge with built-in catalog
  return [...catalog, ...transformedCustom];
}

/**
 * Check if a user has a specific exercise in their library
 */
export async function userHasExercise(userId: string, exerciseId: string): Promise<boolean> {
  const results = await db
    .select()
    .from(userExercises)
    .where(
      and(
        eq(userExercises.userId, userId),
        eq(userExercises.exerciseId, exerciseId)
      )
    )
    .limit(1);

  return results.length > 0;
}

/**
 * Get exercise by ID including user custom exercises
 */
export async function getExerciseForUser(
  userId: string,
  exerciseId: string
): Promise<ExerciseDefinition | null> {
  // First check built-in catalog
  const builtIn = getExercise(exerciseId);
  if (builtIn) return builtIn;

  // Then check user's custom exercises
  const customResults = await db
    .select()
    .from(userExercises)
    .where(
      and(
        eq(userExercises.userId, userId),
        eq(userExercises.exerciseId, exerciseId)
      )
    )
    .limit(1);

  if (customResults.length === 0) return null;

  const ex = customResults[0];
  return {
    id: ex.exerciseId,
    name: ex.name,
    aliases: [],
    movement: mapBodyPartsToMovement(ex.bodyParts),
    primaryMuscle: ex.targetMuscles[0] || "unknown",
    secondaryMuscles: ex.secondaryMuscles,
    equipment: ex.equipment[0] || "unknown",
    impact: (ex.impactLevel as ImpactLevel) || "moderate",
    isPcosFriendly: ex.isPcosSafe,
    notes: ex.description,
  };
}

/**
 * Helper: Map body parts to movement patterns
 */
function mapBodyPartsToMovement(bodyParts: string[]): MovementPattern {
  const lowerBodyParts = bodyParts.join(" ").toLowerCase();

  if (lowerBodyParts.includes("chest") || lowerBodyParts.includes("pectorals")) {
    return "horizontal_push";
  }
  if (lowerBodyParts.includes("back") || lowerBodyParts.includes("lats")) {
    return "horizontal_pull";
  }
  if (lowerBodyParts.includes("shoulders") || lowerBodyParts.includes("delts")) {
    return "vertical_push";
  }
  if (lowerBodyParts.includes("legs") || lowerBodyParts.includes("quadriceps")) {
    return "squat";
  }
  if (lowerBodyParts.includes("glutes") || lowerBodyParts.includes("hamstrings")) {
    return "hinge";
  }
  if (lowerBodyParts.includes("core") || lowerBodyParts.includes("abs")) {
    return "core";
  }
  if (lowerBodyParts.includes("cardio") || lowerBodyParts.includes("conditioning")) {
    return "conditioning";
  }

  // Default fallback
  return "core";
}
