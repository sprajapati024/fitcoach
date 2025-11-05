import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { calculateRecommendedGoals } from "@/lib/nutritionService";

/**
 * POST /api/nutrition/goals/calculate
 * Calculate recommended nutrition goals based on user profile
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Validate required profile fields
    if (!profile.weightKg || !profile.heightCm || !profile.dateOfBirth) {
      return NextResponse.json(
        { error: "Missing required profile information (weight, height, or date of birth)" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const activityLevel = body.activityLevel || "moderate";

    // Calculate recommended goals
    const recommendedGoals = await calculateRecommendedGoals(
      {
        weightKg: parseFloat(profile.weightKg.toString()),
        heightCm: parseFloat(profile.heightCm.toString()),
        sex: profile.sex || "unspecified",
        dateOfBirth: profile.dateOfBirth || "",
        goalBias: profile.goalBias || "balanced",
        hasPcos: profile.hasPcos || false,
      },
      activityLevel as "sedentary" | "moderate" | "active",
    );

    return NextResponse.json({
      success: true,
      recommendedGoals,
      message: "Goals calculated based on your profile",
      note: "These are recommendations. Adjust based on your preferences and consult a professional if needed.",
    });
  } catch (error) {
    console.error("Error calculating nutrition goals:", error);
    return NextResponse.json({ error: "Failed to calculate goals" }, { status: 500 });
  }
}
