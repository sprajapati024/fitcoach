/**
 * JWT Cache for Offline Authentication
 *
 * Caches Supabase session JWT in localStorage for offline access.
 * Allows users to access the app offline if they have a valid cached session (< 24h old).
 */

'use client';

const CACHE_KEY = 'fitcoach_jwt_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedSession {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string | undefined;
  };
  expires_at: number;
  cached_at: number;
}

/**
 * Cache the current session for offline access
 */
export function cacheSession(session: {
  access_token: string;
  refresh_token: string;
  user: { id: string; email?: string };
  expires_at?: number;
}): void {
  if (typeof window === 'undefined') return;

  try {
    const cached: CachedSession = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user: {
        id: session.user.id,
        email: session.user.email,
      },
      expires_at: session.expires_at || Date.now() + CACHE_TTL,
      cached_at: Date.now(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    console.log('[JWT Cache] Session cached for offline access');
  } catch (error) {
    console.error('[JWT Cache] Failed to cache session:', error);
  }
}

/**
 * Get cached session if valid
 */
export function getCachedSession(): CachedSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return null;

    const cached: CachedSession = JSON.parse(stored);

    // Check if cache is still valid (within 24h)
    const age = Date.now() - cached.cached_at;
    if (age > CACHE_TTL) {
      console.log('[JWT Cache] Cache expired, clearing');
      clearSessionCache();
      return null;
    }

    // Check if JWT itself has expired
    if (cached.expires_at && cached.expires_at < Date.now()) {
      console.log('[JWT Cache] JWT expired, clearing');
      clearSessionCache();
      return null;
    }

    return cached;
  } catch (error) {
    console.error('[JWT Cache] Failed to read cache:', error);
    return null;
  }
}

/**
 * Clear the cached session
 */
export function clearSessionCache(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('[JWT Cache] Cache cleared');
  } catch (error) {
    console.error('[JWT Cache] Failed to clear cache:', error);
  }
}

/**
 * Check if we have a valid cached session for offline use
 */
export function hasValidOfflineSession(): boolean {
  const cached = getCachedSession();
  return cached !== null;
}

/**
 * Get user ID from cached session (useful for offline operations)
 */
export function getCachedUserId(): string | null {
  const cached = getCachedSession();
  return cached?.user.id || null;
}

/**
 * Initialize JWT caching (call this after successful auth)
 */
export function initializeJWTCache(session: {
  access_token: string;
  refresh_token: string;
  user: { id: string; email?: string };
  expires_at?: number;
} | null): void {
  if (!session) {
    clearSessionCache();
    return;
  }

  cacheSession(session);
}
