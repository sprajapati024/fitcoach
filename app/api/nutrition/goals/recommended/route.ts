import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { calculateRecommendedGoals } from "@/lib/nutritionService";

/**
 * GET /api/nutrition/goals/recommended
 * Calculate recommended nutrition goals based on user profile
 */
export async function GET() {
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
      return NextResponse.json(
        { error: "User profile not found. Please complete onboarding first." },
        { status: 404 }
      );
    }

    // Check required fields
    if (!profile.weightKg || !profile.heightCm || !profile.dateOfBirth) {
      return NextResponse.json(
        { error: "Missing required profile data (weight, height, or date of birth)" },
        { status: 400 }
      );
    }

    // Calculate recommended goals
    const recommended = await calculateRecommendedGoals(
      {
        weightKg: parseFloat(profile.weightKg),
        heightCm: parseFloat(profile.heightCm),
        sex: profile.sex || "unspecified",
        dateOfBirth: profile.dateOfBirth,
        goalBias: profile.goalBias || "general_fitness",
        hasPcos: profile.hasPcos || false,
      },
      "moderate" // Default activity level
    );

    return NextResponse.json({
      success: true,
      recommended,
      message: "Goals calculated based on your profile",
    });
  } catch (error) {
    console.error("Error calculating recommended goals:", error);
    return NextResponse.json(
      { error: "Failed to calculate recommended goals" },
      { status: 500 }
    );
  }
}
