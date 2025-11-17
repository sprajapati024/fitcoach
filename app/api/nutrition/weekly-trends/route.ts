import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getWeeklyNutritionTrends } from "@/lib/nutritionService";

/**
 * GET /api/nutrition/weekly-trends
 * Returns detailed weekly nutrition trends including daily summaries
 * Query params:
 *   - startDate: YYYY-MM-DD format (required)
 *   - endDate: YYYY-MM-DD format (required)
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Fetch weekly trends
    const trends = await getWeeklyNutritionTrends(user.id, startDate, endDate);

    return NextResponse.json(trends);
  } catch (error) {
    console.error("[Weekly Trends API] error", error);
    return NextResponse.json(
      { error: "Unable to fetch weekly trends" },
      { status: 500 }
    );
  }
}
