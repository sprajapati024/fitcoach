import { NextResponse } from "next/server";
import { listExercises } from "@/lib/exerciseLibrary";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/exercises/filters
 * Get available filter options from local catalog
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exercises = listExercises();

    // Extract unique movement patterns
    const movements = Array.from(new Set(exercises.map(ex => ex.movement)));

    // Extract unique equipment types
    const equipmentTypes = Array.from(new Set(exercises.map(ex => ex.equipment)));

    // Extract unique primary muscles (for body parts)
    const bodyParts = Array.from(new Set(exercises.map(ex => ex.primaryMuscle)));

    // Extract unique impact levels
    const impactLevels = Array.from(new Set(exercises.map(ex => ex.impact)));

    // Format movement patterns with readable labels
    const movementOptions = movements.map(m => ({
      value: m,
      label: formatMovementLabel(m),
    }));

    return NextResponse.json({
      movements: movementOptions,
      bodyParts: bodyParts.sort(),
      equipmentTypes: equipmentTypes.sort(),
      impactLevels: impactLevels.sort(),
    });
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { error: "Failed to fetch filters" },
      { status: 500 }
    );
  }
}

function formatMovementLabel(movement: string): string {
  const labels: Record<string, string> = {
    squat: "Squat",
    hinge: "Hinge (Deadlift)",
    lunge: "Lunge",
    horizontal_push: "Horizontal Push (Bench)",
    horizontal_pull: "Horizontal Pull (Row)",
    vertical_push: "Vertical Push (Overhead)",
    vertical_pull: "Vertical Pull (Pullup)",
    carry: "Carry",
    core: "Core",
    conditioning: "Conditioning",
    mobility: "Mobility",
  };
  return labels[movement] || movement;
}
