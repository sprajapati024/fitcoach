'use server';

import { createSupabaseServerClient } from '@/lib/supabaseServerClient';
import { getDailyNutrition, getNutritionGoals } from '@/lib/nutritionService';

export async function getTodayNutrition() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const [nutrition, goals] = await Promise.all([
    getDailyNutrition(user.id, today),
    getNutritionGoals(user.id),
  ]);

  return {
    summary: nutrition.summary,
    goals,
  };
}
