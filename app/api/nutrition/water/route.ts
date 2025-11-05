import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { waterLogs } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, and, gte, lte } from "drizzle-orm";
import { logWaterRequestSchema } from "@/lib/nutritionValidation";
import { updateDailyNutritionSummary } from "@/lib/nutritionService";

/**
 * GET /api/nutrition/water
 * Fetch user's water logs within a date range
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
    const logDate = searchParams.get("date");

    let query = db.select().from(waterLogs).where(eq(waterLogs.userId, user.id));

    if (logDate) {
      // Get water logs for a specific date
      const dayLogs = await query.where(eq(waterLogs.logDate, logDate)).orderBy(waterLogs.loggedAt);
      const totalMl = dayLogs.reduce((sum, log) => sum + (log.amountMl || 0), 0);
      return NextResponse.json({ logs: dayLogs, totalMl });
    }

    if (startDate && endDate) {
      // Get water logs within date range
      const rangeLogs = await query
        .where(
          and(
            eq(waterLogs.userId, user.id),
            gte(waterLogs.logDate, startDate),
            lte(waterLogs.logDate, endDate),
          ),
        )
        .orderBy(waterLogs.logDate, waterLogs.loggedAt);
      return NextResponse.json({ logs: rangeLogs });
    }

    // Default: get today's water logs
    const today = new Date().toISOString().split("T")[0];
    const todayLogs = await query.where(eq(waterLogs.logDate, today)).orderBy(waterLogs.loggedAt);
    const totalMl = todayLogs.reduce((sum, log) => sum + (log.amountMl || 0), 0);

    return NextResponse.json({ logs: todayLogs, totalMl });
  } catch (error) {
    console.error("Error fetching water logs:", error);
    return NextResponse.json({ error: "Failed to fetch water logs" }, { status: 500 });
  }
}

/**
 * POST /api/nutrition/water
 * Log water intake
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = logWaterRequestSchema.parse(body);

    // Insert water log
    const [insertedLog] = await db
      .insert(waterLogs)
      .values({
        userId: user.id,
        logDate: validatedData.logDate,
        amountMl: validatedData.amountMl,
      })
      .returning();

    // Update daily summary
    await updateDailyNutritionSummary(user.id, validatedData.logDate);

    return NextResponse.json({
      success: true,
      log: insertedLog,
      message: "Water logged successfully",
    });
  } catch (error) {
    console.error("Error logging water:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid water log data", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to log water" }, { status: 500 });
  }
}
