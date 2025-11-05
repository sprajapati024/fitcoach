import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDailyNutrition, getWeeklyNutritionTrends } from "@/lib/nutritionService";

/**
 * GET /api/nutrition/summary
 * Get nutrition summary (daily or weekly)
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'daily' or 'weekly'
    const date = searchParams.get("date"); // For daily: specific date, For weekly: start date
    const endDate = searchParams.get("endDate"); // For weekly: end date

    if (type === "weekly" && date && endDate) {
      // Get weekly trends
      const trends = await getWeeklyNutritionTrends(user.id, date, endDate);
      return NextResponse.json({ trends });
    }

    // Default: get daily nutrition
    const targetDate = date || new Date().toISOString().split("T")[0];
    const dailyData = await getDailyNutrition(user.id, targetDate);

    return NextResponse.json({
      date: targetDate,
      summary: dailyData.summary,
      meals: dailyData.meals,
    });
  } catch (error) {
    console.error("Error fetching nutrition summary:", error);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}
