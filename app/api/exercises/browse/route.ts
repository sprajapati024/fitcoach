import { NextResponse } from "next/server";
import {
  fetchExercises,
  searchExercises,
  fetchBodyParts,
  fetchEquipmentTypes,
} from "@/lib/exercisedb";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/exercises/browse
 * Browse exercises from ExerciseDB with filters
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const bodyPart = searchParams.get("bodyPart");
    const equipment = searchParams.get("equipment");
    const limit = searchParams.get("limit");

    let exercises;

    if (query) {
      exercises = await searchExercises(query);
    } else {
      exercises = await fetchExercises({
        bodyPart: bodyPart || undefined,
        equipment: equipment || undefined,
        limit: limit ? parseInt(limit) : undefined,
      });
    }

    return NextResponse.json({ exercises });
  } catch (error) {
    console.error("Error browsing exercises:", error);
    return NextResponse.json(
      { error: "Failed to browse exercises" },
      { status: 500 }
    );
  }
}
