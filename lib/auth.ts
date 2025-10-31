import type { Session } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabaseServerClient';

export async function getSession(): Promise<Session | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Failed to fetch session', error.message);
    return null;
  }
  return data.session ?? null;
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Failed to fetch user', error.message);
    return null;
  }
  return data.user ?? null;
}
