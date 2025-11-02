import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { db } from "@/lib/db";
import { coachCache, profiles, workoutLogs, workouts } from "@/drizzle/schema";
import { buildCoachContext } from "@/lib/ai/buildPrompt";
import { coachSystemPrompt } from "@/lib/ai/prompts";
import { callCoach } from "@/lib/ai/client";
import { coachResponseSchema, type CoachResponse } from "@/lib/validation";

function isoToday(): string {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  return utc.toISOString().split("T")[0]!;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const today = isoToday();

    const cached = await db.query.coachCache.findFirst({
      where: and(
        eq(coachCache.userId, user.id),
        eq(coachCache.context, "today"),
        eq(coachCache.cacheKey, today),
      ),
    });

    if (cached?.payload) {
      return NextResponse.json({
        success: true,
        coach: cached.payload as CoachResponse,
        cached: true,
      });
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.id),
    });

    const [todayWorkout] = await db
      .select()
      .from(workouts)
      .where(and(eq(workouts.userId, user.id), eq(workouts.sessionDate, today)))
      .limit(1);

    const recentLogs = await db
      .select({
        sessionDate: workoutLogs.sessionDate,
        totalDurationMinutes: workoutLogs.totalDurationMinutes,
        rpeLastSet: workoutLogs.rpeLastSet,
        notes: workoutLogs.notes,
      })
      .from(workoutLogs)
      .where(eq(workoutLogs.userId, user.id))
      .orderBy(desc(workoutLogs.sessionDate), desc(workoutLogs.createdAt))
      .limit(3);

    const context = buildCoachContext({
      userProfile: profile ?? {},
      todayWorkout: todayWorkout ? todayWorkout.payload : null,
      recentLogs: recentLogs.map((log) => ({
        sessionDate: log.sessionDate,
        totalDurationMinutes: Number(log.totalDurationMinutes ?? 0),
        skipped: Number(log.totalDurationMinutes ?? 0) === 0,
        rpeLastSet: log.rpeLastSet ? Number(log.rpeLastSet) : null,
        notes: log.notes,
      })),
    });

    const userPrompt = [
      "Provide today's brief for the athlete below.",
      "Use <= 60 words, stay encouraging, reinforce adherence, and keep tone aligned with preferences.",
      "Return JSON only with fields: headline (string), bullets (max 3 strings), prompts (optional array of max 2 strings).",
      "Context:",
      context,
    ].join("\n\n");

    const coachResult = await callCoach({
      systemPrompt: coachSystemPrompt,
      userPrompt,
      schema: coachResponseSchema,
      maxTokens: 400,
    });

    if (!coachResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: coachResult.error,
          fallback: "Ready to train? Focus on steady pacing and crisp movement quality today.",
        },
        { status: 500 },
      );
    }

    const payload = coachResult.data;
    const expires = new Date();
    expires.setHours(23, 59, 59, 999);

    await db
      .insert(coachCache)
      .values({
        userId: user.id,
        planId: todayWorkout?.planId ?? null,
        context: "today",
        cacheKey: today,
        targetDate: today,
        payload,
        expiresAt: expires,
      })
      .onConflictDoUpdate({
        target: [coachCache.userId, coachCache.context, coachCache.cacheKey],
        set: {
          planId: todayWorkout?.planId ?? null,
          targetDate: today,
          payload,
          expiresAt: expires,
        },
      });

    return NextResponse.json({
      success: true,
      coach: payload,
      cached: false,
    });
  } catch (error) {
    console.error("[Coach Today] error", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to load coach brief.",
        fallback: "Ready to train? Focus on steady pacing and crisp movement quality today.",
      },
      { status: 500 },
    );
  }
}
