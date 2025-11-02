import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env/public";

/**
 * Create a Supabase client for Server Actions and Route Handlers.
 * This client can read AND write cookies.
 */
export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    },
  );
};

/**
 * Create a Supabase client for Server Components.
 * This client can ONLY read cookies, not write them.
 * Use this in layouts, pages, and other Server Components.
 */
export const createSupabaseServerComponentClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // No-op: Server Components cannot set cookies
        },
        remove() {
          // No-op: Server Components cannot remove cookies
        },
      },
    },
  );
};
