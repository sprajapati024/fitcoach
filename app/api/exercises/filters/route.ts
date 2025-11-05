import { NextResponse } from "next/server";
import { fetchBodyParts, fetchEquipmentTypes } from "@/lib/exercisedb";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/exercises/filters
 * Get available filter options (body parts and equipment)
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [bodyParts, equipmentTypes] = await Promise.all([
      fetchBodyParts(),
      fetchEquipmentTypes(),
    ]);

    return NextResponse.json({
      bodyParts,
      equipmentTypes,
    });
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { error: "Failed to fetch filters" },
      { status: 500 }
    );
  }
}
