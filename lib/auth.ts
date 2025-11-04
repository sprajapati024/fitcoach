import { AuthApiError, type Session } from '@supabase/supabase-js';
import { createSupabaseServerComponentClient } from '@/lib/supabaseServerClient';

export async function getSession(): Promise<Session | null> {
  const supabase = await createSupabaseServerComponentClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    if (error instanceof AuthApiError && error.code === 'refresh_token_not_found') {
      return null;
    }
    console.error('Failed to fetch session', error.message);
    return null;
  }
  return data.session ?? null;
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerComponentClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    if (error instanceof AuthApiError && error.code === 'refresh_token_not_found') {
      return null;
    }
    console.error('Failed to fetch user', error.message);
    return null;
  }
  return data.user ?? null;
}
