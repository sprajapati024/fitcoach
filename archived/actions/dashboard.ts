'use server';

import { createSupabaseServerClient } from '@/lib/supabaseServerClient';
import { db } from '@/lib/db';
import { workouts } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function getTodayWorkout() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Find workout scheduled for today
  const [workout] = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, user.id),
        eq(workouts.sessionDate, today)
      )
    )
    .limit(1);

  return workout || null;
}
