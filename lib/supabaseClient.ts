import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env/public";

type SupabaseClient = ReturnType<typeof createBrowserClient>;

declare global {
  // eslint-disable-next-line no-var
  var __supabase__: SupabaseClient | undefined;
}

export const createSupabaseBrowserClient = (): SupabaseClient => {
  if (typeof window === "undefined") {
    throw new Error("createSupabaseBrowserClient must be called in the browser");
  }

  if (!globalThis.__supabase__) {
    globalThis.__supabase__ = createBrowserClient(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }

  return globalThis.__supabase__;
};

export const createSupabaseServerClient = () => {
  const cookieStore = cookies();

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
