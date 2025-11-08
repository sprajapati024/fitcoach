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
  // ============================================================================
  // SQUAT PATTERN (Quad-dominant lower body)
  // ============================================================================
  {
    id: "back_squat",
    name: "Back Squat",
    aliases: ["barbell squat", "high bar squat"],
    movement: "squat",
    primaryMuscle: "quadriceps",
    secondaryMuscles: ["glutes", "core", "erectors"],
    equipment: "barbell",
    impact: "moderate",
    isPcosFriendly: true,
    notes: "Foundational squat pattern.",
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
    id: "goblet_squat",
    name: "Goblet Squat",
    aliases: ["dumbbell goblet squat"],
    movement: "squat",
    primaryMuscle: "quadriceps",
    secondaryMuscles: ["glutes", "core"],
    equipment: "dumbbell",
    impact: "low",
    isPcosFriendly: true,
    notes: "Beginner-friendly squat pattern.",
  },
  {
    id: "safety_bar_squat",
    name: "Safety Bar Squat",
    aliases: ["ssb squat"],
    movement: "squat",
    primaryMuscle: "quadriceps",
    secondaryMuscles: ["glutes", "upper back"],
    equipment: "barbell",
    impact: "moderate",
    isPcosFriendly: true,
    notes: "Easier on shoulders and wrists.",
  },
  {
    id: "box_squat",
    name: "Box Squat",
    aliases: ["barbell box squat"],
    movement: "squat",
    primaryMuscle: "quadriceps",
    secondaryMuscles: ["glutes", "hamstrings"],
    equipment: "barbell",
    impact: "low",
    isPcosFriendly: true,
    notes: "Teaches depth and reduces stress.",
  },
  {
    id: "leg_press",
    name: "Leg Press",
    aliases: ["machine leg press"],
    movement: "squat",
    primaryMuscle: "quadriceps",
    secondaryMuscles: ["glutes", "hamstrings"],
    equipment: "machine",
    impact: "low",
    isPcosFriendly: true,
    notes: "Reduced spinal loading.",
  },
  {
    id: "split_squat",
    name: "Split Squat",
    aliases: ["stationary lunge"],
    movement: "lunge",
    primaryMuscle: "quadriceps",
    secondaryMuscles: ["glutes"],
    equipment: "dumbbell",
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

  // ============================================================================
  // HINGE PATTERN (Posterior chain dominant)
  // ============================================================================
  {
    id: "conventional_deadlift",
    name: "Conventional Deadlift",
    aliases: ["deadlift", "barbell deadlift"],
    movement: "hinge",
    primaryMuscle: "posterior chain",
    secondaryMuscles: ["glutes", "hamstrings", "upper back", "grip"],
    equipment: "barbell",
    impact: "moderate",
    isPcosFriendly: true,
    notes: "King of hinges.",
  },
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
    id: "romanian_deadlift",
    name: "Romanian Deadlift",
    aliases: ["rdl", "stiff leg deadlift"],
    movement: "hinge",
    primaryMuscle: "hamstrings",
    secondaryMuscles: ["glutes", "lower back"],
    equipment: "barbell",
    impact: "low",
    isPcosFriendly: true,
    notes: "Hamstring emphasis.",
  },
  {
    id: "sumo_deadlift",
    name: "Sumo Deadlift",
    aliases: [],
    movement: "hinge",
    primaryMuscle: "posterior chain",
    secondaryMuscles: ["adductors", "glutes", "upper back"],
    equipment: "barbell",
    impact: "moderate",
    isPcosFriendly: true,
    notes: "Wider stance variation.",
  },
  {
    id: "single_leg_rdl",
    name: "Single-Leg Romanian Deadlift",
    aliases: ["single leg rdl", "one leg rdl"],
    movement: "hinge",
    primaryMuscle: "hamstrings",
    secondaryMuscles: ["glutes", "core stability"],
    equipment: "dumbbell",
    impact: "low",
    isPcosFriendly: true,
    notes: "Balance and stability focus.",
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
    id: "glute_bridge",
    name: "Glute Bridge",
    aliases: ["bodyweight bridge"],
    movement: "hinge",
    primaryMuscle: "glutes",
    secondaryMuscles: ["hamstrings"],
    equipment: "bodyweight",
    impact: "low",
    isPcosFriendly: true,
    notes: "Beginner glute activation.",
  },
  {
    id: "good_morning",
    name: "Good Morning",
    aliases: ["barbell good morning"],
    movement: "hinge",
    primaryMuscle: "hamstrings",
    secondaryMuscles: ["glutes", "erectors"],
    equipment: "barbell",
    impact: "low",
    isPcosFriendly: true,
    notes: "Hamstring and posterior chain.",
  },
  {
    id: "kettlebell_swing",
    name: "Kettlebell Swing",
    aliases: ["kb swing", "russian swing"],
    movement: "hinge",
    primaryMuscle: "glutes",
    secondaryMuscles: ["hamstrings", "core"],
    equipment: "kettlebell",
    impact: "moderate",
    isPcosFriendly: true,
    notes: "Explosive hip extension.",
  },

  // ============================================================================
  // LUNGE PATTERN (Unilateral lower body)
  // ============================================================================
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
    id: "reverse_lunge",
    name: "Reverse Lunge",
    aliases: ["backward lunge"],
    movement: "lunge",
    primaryMuscle: "glutes",
    secondaryMuscles: ["quads", "hamstrings"],
    equipment: "dumbbell",
    impact: "low",
    isPcosFriendly: true,
    notes: "Knee-friendly lunge variation.",
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
    id: "lateral_lunge",
    name: "Lateral Lunge",
    aliases: ["side lunge"],
    movement: "lunge",
    primaryMuscle: "glutes",
    secondaryMuscles: ["adductors", "quads"],
    equipment: "dumbbell",
    impact: "low",
    isPcosFriendly: true,
    notes: "Frontal plane movement.",
  },
  {
    id: "step_up",
    name: "Dumbbell Step-Up",
    aliases: ["box step up"],
    movement: "lunge",
    primaryMuscle: "quadriceps",
    secondaryMuscles: ["glutes"],
    equipment: "dumbbell",
    impact: "low",
    isPcosFriendly: true,
  },

  // ============================================================================
  // HORIZONTAL PUSH (Chest/Pressing)
  // ============================================================================
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
    id: "incline_bench_press",
    name: "Incline Bench Press",
    aliases: ["incline barbell press"],
    movement: "horizontal_push",
    primaryMuscle: "upper chest",
    secondaryMuscles: ["triceps", "anterior delts"],
    equipment: "barbell",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "db_bench_press",
    name: "Dumbbell Bench Press",
    aliases: ["dumbbell flat press"],
    movement: "horizontal_push",
    primaryMuscle: "chest",
    secondaryMuscles: ["triceps", "anterior delts"],
    equipment: "dumbbell",
    impact: "low",
    isPcosFriendly: true,
    notes: "Greater range of motion than barbell.",
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
    id: "push_up",
    name: "Push-Up",
    aliases: ["pushup"],
    movement: "horizontal_push",
    primaryMuscle: "chest",
    secondaryMuscles: ["triceps", "core"],
    equipment: "bodyweight",
    impact: "low",
    isPcosFriendly: true,
    notes: "Foundational bodyweight press.",
  },
  {
    id: "dip",
    name: "Dip",
    aliases: ["parallel bar dip"],
    movement: "horizontal_push",
    primaryMuscle: "chest",
    secondaryMuscles: ["triceps", "anterior delts"],
    equipment: "bodyweight",
    impact: "low",
    isPcosFriendly: true,
    notes: "Advanced bodyweight press.",
  },
  {
    id: "floor_press",
    name: "Floor Press",
    aliases: ["barbell floor press"],
    movement: "horizontal_push",
    primaryMuscle: "chest",
    secondaryMuscles: ["triceps"],
    equipment: "barbell",
    impact: "low",
    isPcosFriendly: true,
    notes: "Reduced range, tricep focus.",
  },
  {
    id: "cable_chest_fly",
    name: "Cable Chest Fly",
    aliases: ["cable fly"],
    movement: "horizontal_push",
    primaryMuscle: "chest",
    secondaryMuscles: ["anterior delts"],
    equipment: "cable",
    impact: "low",
    isPcosFriendly: true,
    notes: "Isolation movement.",
  },
  {
    id: "close_grip_bench",
    name: "Close-Grip Bench Press",
    aliases: ["narrow grip bench"],
    movement: "horizontal_push",
    primaryMuscle: "triceps",
    secondaryMuscles: ["chest", "anterior delts"],
    equipment: "barbell",
    impact: "low",
    isPcosFriendly: true,
    notes: "Tricep emphasis.",
  },

  // ============================================================================
  // VERTICAL PUSH (Shoulders/Overhead)
  // ============================================================================
  {
    id: "overhead_press",
    name: "Overhead Press",
    aliases: ["military press", "barbell shoulder press", "ohp"],
    movement: "vertical_push",
    primaryMuscle: "shoulders",
    secondaryMuscles: ["triceps", "upper chest"],
    equipment: "barbell",
    impact: "low",
    isPcosFriendly: true,
    notes: "Standing overhead press.",
  },
  {
    id: "seated_db_press",
    name: "Seated Dumbbell Shoulder Press",
    aliases: ["seated shoulder press"],
    movement: "vertical_push",
    primaryMuscle: "shoulders",
    secondaryMuscles: ["triceps"],
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
    id: "landmine_press",
    name: "Landmine Press",
    aliases: ["landmine shoulder press"],
    movement: "vertical_push",
    primaryMuscle: "shoulders",
    secondaryMuscles: ["triceps", "core"],
    equipment: "barbell",
    impact: "low",
    isPcosFriendly: true,
    notes: "Angled press, shoulder-friendly.",
  },
  {
    id: "arnold_press",
    name: "Arnold Press",
    aliases: [],
    movement: "vertical_push",
    primaryMuscle: "shoulders",
    secondaryMuscles: ["triceps"],
    equipment: "dumbbell",
    impact: "low",
    isPcosFriendly: true,
    notes: "Rotational shoulder press.",
  },
  {
    id: "push_press",
    name: "Push Press",
    aliases: ["barbell push press"],
    movement: "vertical_push",
    primaryMuscle: "shoulders",
    secondaryMuscles: ["triceps", "legs"],
    equipment: "barbell",
    impact: "moderate",
    isPcosFriendly: true,
    notes: "Explosive overhead press with leg drive.",
  },
  {
    id: "lateral_raise",
    name: "Dumbbell Lateral Raise",
    aliases: ["side raise"],
    movement: "vertical_push",
    primaryMuscle: "shoulders",
    secondaryMuscles: ["upper traps"],
    equipment: "dumbbell",
    impact: "low",
    isPcosFriendly: true,
    notes: "Shoulder isolation.",
  },

  // ============================================================================
  // HORIZONTAL PULL (Back/Rowing)
  // ============================================================================
  {
    id: "barbell_row",
    name: "Barbell Row",
    aliases: ["bent over row", "pendlay row"],
    movement: "horizontal_pull",
    primaryMuscle: "mid-back",
    secondaryMuscles: ["lats", "biceps", "rear delts"],
    equipment: "barbell",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "db_row",
    name: "Dumbbell Row",
    aliases: ["single arm row", "one arm row"],
    movement: "horizontal_pull",
    primaryMuscle: "mid-back",
    secondaryMuscles: ["lats", "biceps"],
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
    id: "tbar_row",
    name: "T-Bar Row",
    aliases: ["landmine row"],
    movement: "horizontal_pull",
    primaryMuscle: "mid-back",
    secondaryMuscles: ["lats", "biceps"],
    equipment: "barbell",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "inverted_row",
    name: "Inverted Row",
    aliases: ["bodyweight row", "australian pull up"],
    movement: "horizontal_pull",
    primaryMuscle: "upper back",
    secondaryMuscles: ["biceps", "rear delts"],
    equipment: "bodyweight",
    impact: "low",
    isPcosFriendly: true,
    notes: "Beginner-friendly rowing.",
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
    id: "seal_row",
    name: "Seal Row",
    aliases: ["prone bench row"],
    movement: "horizontal_pull",
    primaryMuscle: "upper back",
    secondaryMuscles: ["lats", "biceps"],
    equipment: "dumbbell",
    impact: "low",
    isPcosFriendly: true,
    notes: "Strict rowing with no momentum.",
  },

  // ============================================================================
  // VERTICAL PULL (Lats/Pulling)
  // ============================================================================
  {
    id: "pull_up",
    name: "Pull-Up",
    aliases: ["pullup"],
    movement: "vertical_pull",
    primaryMuscle: "lats",
    secondaryMuscles: ["biceps", "upper back"],
    equipment: "bodyweight",
    impact: "low",
    isPcosFriendly: true,
    notes: "Overhand grip vertical pull.",
  },
  {
    id: "chin_up",
    name: "Chin-Up",
    aliases: ["chinup"],
    movement: "vertical_pull",
    primaryMuscle: "lats",
    secondaryMuscles: ["biceps", "upper back"],
    equipment: "bodyweight",
    impact: "low",
    isPcosFriendly: true,
    notes: "Underhand grip, bicep emphasis.",
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
    id: "neutral_grip_pulldown",
    name: "Neutral Grip Pulldown",
    aliases: ["parallel grip pulldown"],
    movement: "vertical_pull",
    primaryMuscle: "lats",
    secondaryMuscles: ["biceps"],
    equipment: "cable",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "assisted_pull_up",
    name: "Assisted Pull-Up",
    aliases: ["band assisted pull up"],
    movement: "vertical_pull",
    primaryMuscle: "lats",
    secondaryMuscles: ["biceps", "upper back"],
    equipment: "band",
    impact: "low",
    isPcosFriendly: true,
    notes: "Beginner progression.",
  },

  // ============================================================================
  // CARRY (Loaded carries and grip)
  // ============================================================================
  {
    id: "farmers_walk",
    name: "Farmer's Walk",
    aliases: ["farmers carry"],
    movement: "carry",
    primaryMuscle: "grip",
    secondaryMuscles: ["traps", "core", "forearms"],
    equipment: "dumbbell",
    impact: "low",
    isPcosFriendly: true,
    notes: "Full-body loaded carry.",
  },
  {
    id: "suitcase_carry",
    name: "Suitcase Carry",
    aliases: ["single arm carry"],
    movement: "carry",
    primaryMuscle: "core",
    secondaryMuscles: ["grip", "obliques"],
    equipment: "dumbbell",
    impact: "low",
    isPcosFriendly: true,
    notes: "Unilateral anti-lateral flexion.",
  },
  {
    id: "overhead_carry",
    name: "Overhead Carry",
    aliases: ["waiter walk"],
    movement: "carry",
    primaryMuscle: "shoulders",
    secondaryMuscles: ["core", "grip"],
    equipment: "dumbbell",
    impact: "low",
    isPcosFriendly: true,
  },

  // ============================================================================
  // CORE (Anti-extension, anti-rotation, anti-lateral flexion)
  // ============================================================================
  {
    id: "plank",
    name: "Plank",
    aliases: ["front plank"],
    movement: "core",
    primaryMuscle: "core",
    secondaryMuscles: ["shoulders"],
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
    id: "ab_wheel_rollout",
    name: "Ab Wheel Rollout",
    aliases: ["rollout"],
    movement: "core",
    primaryMuscle: "core",
    secondaryMuscles: ["shoulders"],
    equipment: "ab_wheel",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "hanging_leg_raise",
    name: "Hanging Leg Raise",
    aliases: ["hanging knee raise"],
    movement: "core",
    primaryMuscle: "core",
    secondaryMuscles: ["hip flexors"],
    equipment: "bodyweight",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "bird_dog",
    name: "Bird Dog",
    aliases: [],
    movement: "core",
    primaryMuscle: "core",
    secondaryMuscles: ["glutes", "shoulders"],
    equipment: "bodyweight",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "russian_twist",
    name: "Russian Twist",
    aliases: [],
    movement: "core",
    primaryMuscle: "obliques",
    secondaryMuscles: ["core"],
    equipment: "bodyweight",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "cable_crunch",
    name: "Cable Crunch",
    aliases: ["kneeling cable crunch"],
    movement: "core",
    primaryMuscle: "core",
    secondaryMuscles: [],
    equipment: "cable",
    impact: "low",
    isPcosFriendly: true,
  },

  // ============================================================================
  // CONDITIONING (Cardio and metabolic)
  // ============================================================================
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
    id: "sled_drag",
    name: "Sled Drag",
    aliases: ["prowler drag"],
    movement: "conditioning",
    primaryMuscle: "legs",
    secondaryMuscles: ["hamstrings", "core"],
    equipment: "sled",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "assault_bike",
    name: "Assault Bike",
    aliases: ["air bike", "airdyne"],
    movement: "conditioning",
    primaryMuscle: "cardio",
    secondaryMuscles: ["full body"],
    equipment: "bike",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "ski_erg",
    name: "Ski Erg",
    aliases: [],
    movement: "conditioning",
    primaryMuscle: "cardio",
    secondaryMuscles: ["lats", "core"],
    equipment: "machine",
    impact: "low",
    isPcosFriendly: true,
  },

  // ============================================================================
  // MOBILITY & WARM-UP
  // ============================================================================
  {
    id: "cat_camel",
    name: "Cat-Camel",
    aliases: ["cat cow"],
    movement: "mobility",
    primaryMuscle: "spine",
    secondaryMuscles: ["core"],
    equipment: "bodyweight",
    impact: "low",
    isPcosFriendly: true,
    notes: "Spinal mobility.",
  },
  {
    id: "worlds_greatest_stretch",
    name: "World's Greatest Stretch",
    aliases: [],
    movement: "mobility",
    primaryMuscle: "hips",
    secondaryMuscles: ["hamstrings", "t-spine"],
    equipment: "bodyweight",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "90_90_hip_switch",
    name: "90/90 Hip Switch",
    aliases: [],
    movement: "mobility",
    primaryMuscle: "hips",
    secondaryMuscles: ["glutes"],
    equipment: "bodyweight",
    impact: "low",
    isPcosFriendly: true,
  },

  // ============================================================================
  // ACCESSORY/ISOLATION (Arms, calves, etc.)
  // ============================================================================
  {
    id: "bicep_curl",
    name: "Dumbbell Bicep Curl",
    aliases: ["db curl"],
    movement: "horizontal_pull",
    primaryMuscle: "biceps",
    secondaryMuscles: [],
    equipment: "dumbbell",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "hammer_curl",
    name: "Hammer Curl",
    aliases: ["neutral grip curl"],
    movement: "horizontal_pull",
    primaryMuscle: "biceps",
    secondaryMuscles: ["brachialis", "forearms"],
    equipment: "dumbbell",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "tricep_extension",
    name: "Overhead Tricep Extension",
    aliases: ["tricep overhead extension"],
    movement: "horizontal_push",
    primaryMuscle: "triceps",
    secondaryMuscles: [],
    equipment: "dumbbell",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "skull_crusher",
    name: "Skull Crusher",
    aliases: ["lying tricep extension"],
    movement: "horizontal_push",
    primaryMuscle: "triceps",
    secondaryMuscles: [],
    equipment: "barbell",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "cable_tricep_pushdown",
    name: "Cable Tricep Pushdown",
    aliases: ["tricep pushdown"],
    movement: "horizontal_push",
    primaryMuscle: "triceps",
    secondaryMuscles: [],
    equipment: "cable",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "leg_curl",
    name: "Leg Curl",
    aliases: ["hamstring curl"],
    movement: "hinge",
    primaryMuscle: "hamstrings",
    secondaryMuscles: [],
    equipment: "machine",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "leg_extension",
    name: "Leg Extension",
    aliases: [],
    movement: "squat",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [],
    equipment: "machine",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "calf_raise",
    name: "Calf Raise",
    aliases: ["standing calf raise"],
    movement: "squat",
    primaryMuscle: "calves",
    secondaryMuscles: [],
    equipment: "machine",
    impact: "low",
    isPcosFriendly: true,
  },
  {
    id: "shrug",
    name: "Dumbbell Shrug",
    aliases: ["trap shrug"],
    movement: "vertical_pull",
    primaryMuscle: "traps",
    secondaryMuscles: [],
    equipment: "dumbbell",
    impact: "low",
    isPcosFriendly: true,
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
    notes: ex.description || undefined,
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
    notes: ex.description || undefined,
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
