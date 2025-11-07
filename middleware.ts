import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { AuthApiError } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env/public";

const SUPABASE_COOKIE_PREFIX = "sb-";

function transferCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
}

function clearSupabaseCookies(request: NextRequest, response: NextResponse) {
  const supabaseCookies = request.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith(SUPABASE_COOKIE_PREFIX));

  for (const cookie of supabaseCookies) {
    request.cookies.delete(cookie.name);
    response.cookies.set({
      name: cookie.name,
      value: "",
      path: "/",
      expires: new Date(0),
      maxAge: 0,
    });
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/plan", "/progress", "/settings", "/workout", "/onboarding"];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  let response = NextResponse.next();

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          response.cookies.set({
            name,
            value: "",
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (
    sessionError &&
    sessionError instanceof AuthApiError &&
    sessionError.code === "refresh_token_not_found"
  ) {
    const redirectResponse = NextResponse.redirect(new URL("/", request.url));
    clearSupabaseCookies(request, redirectResponse);
    transferCookies(response, redirectResponse);
    return redirectResponse;
  }

  if (!isProtectedRoute) {
    return response;
  }

  if (!session?.user) {
    const redirectResponse = NextResponse.redirect(new URL("/", request.url));
    transferCookies(response, redirectResponse);
    return redirectResponse;
  }

  // Check if user has a profile using Supabase (Edge-compatible)
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", session.user.id)
      .single();

    // Redirect to onboarding if no profile exists
    if (error || !profile) {
      const redirectResponse = NextResponse.redirect(new URL("/onboarding", request.url));
      transferCookies(response, redirectResponse);
      return redirectResponse;
    }
  } catch (error) {
    console.error("Error checking profile:", error);
    // On error, allow the request to proceed (auth layout will handle it)
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
