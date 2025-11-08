import { NextResponse } from "next/server";
import { listExercises } from "@/lib/exerciseLibrary";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/exercises/browse
 * Browse exercises from local catalog with filters
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const movement = searchParams.get("movement");
    const equipment = searchParams.get("equipment");
    const impact = searchParams.get("impact");

    // Get all exercises from local catalog
    let exercises = listExercises();

    // Apply filters
    if (movement && movement !== "all") {
      exercises = exercises.filter(ex => ex.movement === movement);
    }

    if (equipment && equipment !== "all") {
      exercises = exercises.filter(ex =>
        ex.equipment.toLowerCase().includes(equipment.toLowerCase())
      );
    }

    if (impact && impact !== "all") {
      exercises = exercises.filter(ex => ex.impact === impact);
    }

    // Apply search query
    if (query) {
      const searchLower = query.toLowerCase();
      exercises = exercises.filter(ex =>
        ex.name.toLowerCase().includes(searchLower) ||
        ex.primaryMuscle.toLowerCase().includes(searchLower) ||
        ex.secondaryMuscles.some(m => m.toLowerCase().includes(searchLower)) ||
        ex.aliases.some(a => a.toLowerCase().includes(searchLower))
      );
    }

    // Map to format expected by frontend
    const formattedExercises = exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      bodyPart: ex.primaryMuscle,
      target: ex.primaryMuscle,
      secondaryMuscles: ex.secondaryMuscles,
      equipment: ex.equipment,
      gifUrl: null, // No GIFs for local exercises
      instructions: ex.notes ? [ex.notes] : [],
    }));

    return NextResponse.json({ exercises: formattedExercises });
  } catch (error) {
    console.error("Error browsing exercises:", error);
    return NextResponse.json(
      { error: "Failed to browse exercises" },
      { status: 500 }
    );
  }
}
