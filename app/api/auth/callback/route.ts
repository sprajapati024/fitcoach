import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { db } from "@/lib/db";
import { profiles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);

    // Check if user has completed onboarding
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Query for user's profile
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, user.id),
      });

      // Redirect to onboarding if no profile exists, otherwise to intended destination
      const next = profile
        ? (searchParams.get("next") ?? "/dashboard")
        : "/onboarding";

      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // Fallback if no code or user
  const fallbackNext = searchParams.get("next") ?? "/dashboard";
  return NextResponse.redirect(new URL(fallbackNext, origin));
}
