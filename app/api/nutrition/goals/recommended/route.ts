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

    console.log("Profile data:", profile);

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found. Please complete onboarding first." },
        { status: 404 }
      );
    }

    // Check required fields and log what's missing
    if (!profile.weightKg) {
      console.error("Missing weightKg");
      return NextResponse.json(
        { error: "Missing weight data. Please update your profile." },
        { status: 400 }
      );
    }

    if (!profile.heightCm) {
      console.error("Missing heightCm");
      return NextResponse.json(
        { error: "Missing height data. Please update your profile." },
        { status: 400 }
      );
    }

    if (!profile.dateOfBirth) {
      console.error("Missing dateOfBirth");
      return NextResponse.json(
        { error: "Missing date of birth. Please update your profile." },
        { status: 400 }
      );
    }

    // Parse values safely
    const weightKg = parseFloat(profile.weightKg.toString());
    const heightCm = parseFloat(profile.heightCm.toString());

    if (isNaN(weightKg) || isNaN(heightCm)) {
      console.error("Invalid numeric values:", { weightKg, heightCm });
      return NextResponse.json(
        { error: "Invalid weight or height data" },
        { status: 400 }
      );
    }

    console.log("Calling calculateRecommendedGoals with:", {
      weightKg,
      heightCm,
      sex: profile.sex,
      dateOfBirth: profile.dateOfBirth,
      goalBias: profile.goalBias,
      hasPcos: profile.hasPcos,
    });

    // Calculate recommended goals
    const recommended = await calculateRecommendedGoals(
      {
        weightKg,
        heightCm,
        sex: profile.sex || "unspecified",
        dateOfBirth: profile.dateOfBirth,
        goalBias: profile.goalBias || "general_fitness",
        hasPcos: profile.hasPcos || false,
      },
      "moderate" // Default activity level
    );

    console.log("Recommended goals:", recommended);

    return NextResponse.json({
      success: true,
      recommended,
      message: "Goals calculated based on your profile",
    });
  } catch (error) {
    console.error("Error calculating recommended goals:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to calculate recommended goals";
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    );
  }
}
