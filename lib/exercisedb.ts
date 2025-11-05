/**
 * ExerciseDB API Integration
 * Free and open-source exercise database with 1300+ exercises
 *
 * Note: Using the free demo endpoint for exploration.
 * For production, consider deploying your own instance from:
 * https://github.com/ExerciseDB/exercisedb-api
 */

import { z } from "zod";

const EXERCISEDB_BASE_URL = "https://exercisedb.p.rapidapi.com";
const FREE_DEMO_URL = "https://exercisedb-api.vercel.app/api/v1"; // Open-source demo instance

// Exercise schema for ExerciseDB V2 format
export const exerciseDbExerciseSchema = z.object({
  exerciseId: z.string(),
  name: z.string(),
  imageUrl: z.string().optional(),
  equipments: z.array(z.string()).optional(),
  bodyParts: z.array(z.string()).optional(),
  exerciseType: z.string().optional(),
  targetMuscles: z.array(z.string()).optional(),
  secondaryMuscles: z.array(z.string()).optional(),
  videoUrl: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  overview: z.string().optional(),
  instructions: z.array(z.string()).optional(),
  exerciseTips: z.array(z.string()).optional(),
});

export type ExerciseDbExercise = z.infer<typeof exerciseDbExerciseSchema>;

// Simplified exercise format for our app
export const exerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  instructions: z.array(z.string()).default([]),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  gifUrl: z.string().optional(),
  equipment: z.array(z.string()).default([]),
  bodyParts: z.array(z.string()).default([]),
  targetMuscles: z.array(z.string()).default([]),
  secondaryMuscles: z.array(z.string()).default([]),
  exerciseType: z.string().optional(),
  isPcosSafe: z.boolean().default(true),
  impactLevel: z.enum(["low", "moderate", "high"]).optional(),
});

export type Exercise = z.infer<typeof exerciseSchema>;

/**
 * Fetch all exercises from ExerciseDB
 * Note: This is a simple implementation using a demo endpoint.
 * For production, consider caching or using pagination.
 */
export async function fetchExercises(options?: {
  bodyPart?: string;
  equipment?: string;
  limit?: number;
}): Promise<Exercise[]> {
  try {
    let url = `${FREE_DEMO_URL}/exercises`;

    // Add filters if provided
    const params = new URLSearchParams();
    if (options?.bodyPart) params.set("bodyPart", options.bodyPart);
    if (options?.equipment) params.set("equipment", options.equipment);
    if (options?.limit) params.set("limit", options.limit.toString());

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      console.error("Failed to fetch exercises:", response.statusText);
      return [];
    }

    const data = await response.json();

    // Transform to our format
    return transformExercises(data);
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return [];
  }
}

/**
 * Fetch a single exercise by ID
 */
export async function fetchExerciseById(id: string): Promise<Exercise | null> {
  try {
    const response = await fetch(`${FREE_DEMO_URL}/exercises/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const transformed = transformExercises([data]);
    return transformed[0] || null;
  } catch (error) {
    console.error("Error fetching exercise:", error);
    return null;
  }
}

/**
 * Get available body parts for filtering
 */
export async function fetchBodyParts(): Promise<string[]> {
  try {
    const response = await fetch(`${FREE_DEMO_URL}/bodyParts`, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching body parts:", error);
    return [];
  }
}

/**
 * Get available equipment types for filtering
 */
export async function fetchEquipmentTypes(): Promise<string[]> {
  try {
    const response = await fetch(`${FREE_DEMO_URL}/equipments`, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching equipment types:", error);
    return [];
  }
}

/**
 * Transform ExerciseDB format to our internal format
 */
function transformExercises(exercises: any[]): Exercise[] {
  return exercises.map((ex) => {
    // Determine PCOS safety based on impact level
    // High-impact exercises may not be suitable for PCOS
    const equipment = Array.isArray(ex.equipments) ? ex.equipments : ex.equipment ? [ex.equipment] : [];
    const bodyParts = Array.isArray(ex.bodyParts) ? ex.bodyParts : ex.bodyPart ? [ex.bodyPart] : [];

    // Determine impact level based on exercise type and body parts
    let impactLevel: "low" | "moderate" | "high" = "moderate";
    const lowImpactKeywords = ["yoga", "stretching", "mobility", "seated", "lying", "plank", "bridge"];
    const highImpactKeywords = ["jump", "sprint", "burpee", "box jump", "plyometric"];

    const exerciseName = ex.name?.toLowerCase() || "";
    if (lowImpactKeywords.some(keyword => exerciseName.includes(keyword))) {
      impactLevel = "low";
    } else if (highImpactKeywords.some(keyword => exerciseName.includes(keyword))) {
      impactLevel = "high";
    }

    return {
      id: ex.exerciseId || ex.id || `ex-${Math.random().toString(36).substr(2, 9)}`,
      name: ex.name || "Unknown Exercise",
      description: ex.overview || ex.description,
      instructions: Array.isArray(ex.instructions) ? ex.instructions : [],
      imageUrl: ex.imageUrl || ex.image,
      videoUrl: ex.videoUrl || ex.video,
      gifUrl: ex.gifUrl || ex.gif,
      equipment,
      bodyParts,
      targetMuscles: Array.isArray(ex.targetMuscles) ? ex.targetMuscles : ex.target ? [ex.target] : [],
      secondaryMuscles: Array.isArray(ex.secondaryMuscles) ? ex.secondaryMuscles : [],
      exerciseType: ex.exerciseType || "weight_reps",
      isPcosSafe: impactLevel !== "high", // High-impact exercises are not PCOS-safe
      impactLevel,
    };
  });
}

/**
 * Search exercises by name or keyword
 */
export async function searchExercises(query: string): Promise<Exercise[]> {
  try {
    const allExercises = await fetchExercises();
    const lowerQuery = query.toLowerCase();

    return allExercises.filter(exercise =>
      exercise.name.toLowerCase().includes(lowerQuery) ||
      exercise.description?.toLowerCase().includes(lowerQuery) ||
      exercise.bodyParts.some(bp => bp.toLowerCase().includes(lowerQuery)) ||
      exercise.targetMuscles.some(tm => tm.toLowerCase().includes(lowerQuery))
    );
  } catch (error) {
    console.error("Error searching exercises:", error);
    return [];
  }
}
