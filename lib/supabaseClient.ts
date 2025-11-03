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
      {
        cookies: {
          get(name: string) {
            const cookie = document.cookie
              .split('; ')
              .find((row) => row.startsWith(`${name}=`));
            return cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined;
          },
          set(name: string, value: string, options) {
            let cookieString = `${name}=${encodeURIComponent(value)}`;
            if (options?.maxAge) {
              cookieString += `; max-age=${options.maxAge}`;
            }
            if (options?.path) {
              cookieString += `; path=${options.path}`;
            }
            if (options?.sameSite) {
              cookieString += `; samesite=${options.sameSite}`;
            }
            if (options?.domain) {
              cookieString += `; domain=${options.domain}`;
            }
            if (options?.secure) {
              cookieString += `; secure`;
            }
            document.cookie = cookieString;
          },
          remove(name: string, options) {
            document.cookie = `${name}=; path=${options?.path ?? '/'}; max-age=0`;
          },
        },
      }
    );
  }

  return globalThis.__supabase__;
};
