import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env/public";

type SupabaseClient = ReturnType<typeof createBrowserClient>;

declare global {
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
