/**
 * AI Response Cache Layer
 *
 * Provides hash-based caching for AI responses with TTL support.
 * Uses IndexedDB for client-side caching via the localDB functions.
 */

import { getCoachCache, saveCoachCache } from '@/lib/db/local';
import type { LocalCoachCache, CoachContext } from '@/lib/db/schema.local';

/**
 * Generate a stable hash for caching AI prompts
 */
export function generatePromptHash(systemPrompt: string, userPrompt: string, context?: string): string {
  const combined = `${systemPrompt}|||${userPrompt}|||${context || ''}`;

  // Simple but stable hash function (djb2)
  let hash = 5381;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 33) ^ combined.charCodeAt(i);
  }

  return `ai_${(hash >>> 0).toString(36)}`;
}

/**
 * Check if cached response is still valid
 */
export function isCacheValid(cachedAt: number, ttlMinutes: number): boolean {
  const now = Date.now();
  const ttlMs = ttlMinutes * 60 * 1000;
  return (now - cachedAt) < ttlMs;
}

/**
 * Get cached AI response from IndexedDB
 */
export async function getCachedResponse<T = unknown>(
  userId: string,
  context: CoachContext,
  cacheKey: string,
  ttlMinutes = 60
): Promise<T | null> {
  try {
    const cached = await getCoachCache(userId, context, cacheKey);

    if (!cached) return null;

    // Check if cache is still valid
    if (!isCacheValid(cached.createdAt, ttlMinutes)) {
      // Cache expired - return null (cleanup happens elsewhere)
      return null;
    }

    return cached.payload as T;
  } catch (error) {
    console.error('[AI Cache] Error reading cache:', error);
    return null;
  }
}

/**
 * Store AI response in IndexedDB cache
 */
export async function setCachedResponse<T = unknown>(
  userId: string,
  planId: string | null,
  context: CoachContext,
  cacheKey: string,
  payload: T,
  targetDate?: string
): Promise<void> {
  try {
    const now = Date.now();
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours from now

    const cache: Omit<LocalCoachCache, '_syncedAt'> = {
      id: `${userId}_${context}_${cacheKey}`,
      userId,
      planId,
      context,
      cacheKey,
      targetDate: targetDate || null,
      payload: payload as Record<string, unknown>,
      expiresAt,
      createdAt: now,
    };

    await saveCoachCache(cache);
  } catch (error) {
    console.error('[AI Cache] Error writing cache:', error);
  }
}

/**
 * Invalidate all caches for a specific context
 *
 * Note: This is a placeholder. Full implementation would require
 * a batch delete function in lib/db/local.ts
 */
export async function invalidateContext(userId: string, context: CoachContext): Promise<void> {
  console.log(`[AI Cache] Invalidate context requested: ${userId}/${context}`);
  // TODO: Implement when batch operations are added to lib/db/local.ts
}

/**
 * Clear expired cache entries (maintenance function)
 *
 * Note: This is a placeholder. Expired cache cleanup happens
 * naturally when getCachedResponse checks TTL.
 */
export async function clearExpiredCache(): Promise<number> {
  console.log('[AI Cache] Clear expired cache requested');
  // TODO: Implement when batch operations are added to lib/db/local.ts
  return 0;
}

/**
 * Get cache statistics
 *
 * Note: This is a placeholder for future analytics.
 */
export async function getCacheStats(userId: string): Promise<{
  total: number;
  byContext: Record<string, number>;
  oldestEntry: number | null;
  newestEntry: number | null;
}> {
  console.log(`[AI Cache] Cache stats requested for user: ${userId}`);
  // TODO: Implement when query operations are added to lib/db/local.ts
  return {
    total: 0,
    byContext: {},
    oldestEntry: null,
    newestEntry: null,
  };
}
