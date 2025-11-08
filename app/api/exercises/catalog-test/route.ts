import { NextResponse } from "next/server";
import { listExercises } from "@/lib/exerciseLibrary";

/**
 * GET /api/exercises/catalog-test
 * Test endpoint to verify exercise catalog count
 */
export async function GET() {
  try {
    const exercises = listExercises();

    return NextResponse.json({
      count: exercises.length,
      exercises: exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        movement: ex.movement,
        equipment: ex.equipment,
      })),
    });
  } catch (error) {
    console.error("Error listing exercises:", error);
    return NextResponse.json(
      { error: "Failed to list exercises", details: String(error) },
      { status: 500 }
    );
  }
}
