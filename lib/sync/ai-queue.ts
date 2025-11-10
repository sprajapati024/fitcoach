/**
 * AI Prompt Queue for Offline Support
 *
 * Queues AI prompts when offline and retries them when connection returns.
 * Useful for coach requests, plan generation, and substitutions.
 */

interface QueuedPrompt {
  id: string;
  userId: string;
  context: string;
  systemPrompt: string;
  userPrompt: string;
  endpoint: string;
  queuedAt: number;
  retryCount: number;
  maxRetries: number;
}

const QUEUE_KEY = 'fitcoach_ai_queue';
const MAX_QUEUE_SIZE = 20;
const MAX_RETRIES = 3;

/**
 * Get the current queue from localStorage
 */
function getQueue(): QueuedPrompt[] {
  try {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(QUEUE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as QueuedPrompt[];
  } catch (error) {
    console.error('[AI Queue] Error reading queue:', error);
    return [];
  }
}

/**
 * Save the queue to localStorage
 */
function saveQueue(queue: QueuedPrompt[]): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[AI Queue] Error saving queue:', error);
  }
}

/**
 * Add a prompt to the offline queue
 */
export function enqueuePrompt(
  userId: string,
  context: string,
  systemPrompt: string,
  userPrompt: string,
  endpoint: string
): string {
  const queue = getQueue();

  // Check queue size limit
  if (queue.length >= MAX_QUEUE_SIZE) {
    console.warn('[AI Queue] Queue full, removing oldest entry');
    queue.shift();
  }

  const prompt: QueuedPrompt = {
    id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    userId,
    context,
    systemPrompt,
    userPrompt,
    endpoint,
    queuedAt: Date.now(),
    retryCount: 0,
    maxRetries: MAX_RETRIES,
  };

  queue.push(prompt);
  saveQueue(queue);

  console.log(`[AI Queue] Queued prompt: ${context} (${queue.length} in queue)`);
  return prompt.id;
}

/**
 * Remove a prompt from the queue
 */
export function dequeuePrompt(id: string): void {
  const queue = getQueue();
  const filtered = queue.filter(p => p.id !== id);
  saveQueue(filtered);
}

/**
 * Get all queued prompts for a user
 */
export function getQueuedPrompts(userId?: string): QueuedPrompt[] {
  const queue = getQueue();
  if (!userId) return queue;
  return queue.filter(p => p.userId === userId);
}

/**
 * Process the queue by sending all pending prompts
 */
export async function processQueue(): Promise<{
  success: number;
  failed: number;
  remaining: number;
}> {
  const queue = getQueue();
  if (queue.length === 0) {
    return { success: 0, failed: 0, remaining: 0 };
  }

  console.log(`[AI Queue] Processing ${queue.length} queued prompts...`);

  let successCount = 0;
  let failedCount = 0;
  const remainingQueue: QueuedPrompt[] = [];

  for (const prompt of queue) {
    try {
      const response = await fetch(prompt.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt: prompt.systemPrompt,
          userPrompt: prompt.userPrompt,
          context: prompt.context,
        }),
      });

      if (response.ok) {
        successCount++;
        console.log(`[AI Queue] Successfully processed: ${prompt.context}`);
        // Don't add to remaining queue (successfully processed)
      } else {
        // Failed, retry if under max retries
        prompt.retryCount++;
        if (prompt.retryCount < prompt.maxRetries) {
          remainingQueue.push(prompt);
          console.warn(`[AI Queue] Failed, will retry: ${prompt.context} (${prompt.retryCount}/${prompt.maxRetries})`);
        } else {
          failedCount++;
          console.error(`[AI Queue] Max retries reached: ${prompt.context}`);
        }
      }
    } catch (error) {
      // Network error, keep in queue for retry
      prompt.retryCount++;
      if (prompt.retryCount < prompt.maxRetries) {
        remainingQueue.push(prompt);
        console.warn(`[AI Queue] Network error, will retry: ${prompt.context}`);
      } else {
        failedCount++;
        console.error(`[AI Queue] Max retries reached after network error: ${prompt.context}`);
      }
    }
  }

  // Save remaining queue
  saveQueue(remainingQueue);

  console.log(`[AI Queue] Processing complete: ${successCount} success, ${failedCount} failed, ${remainingQueue.length} remaining`);

  return {
    success: successCount,
    failed: failedCount,
    remaining: remainingQueue.length,
  };
}

/**
 * Clear the entire queue
 */
export function clearQueue(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(QUEUE_KEY);
  console.log('[AI Queue] Queue cleared');
}

/**
 * Get queue statistics
 */
export function getQueueStats(): {
  total: number;
  byContext: Record<string, number>;
  oldestQueueTime: number | null;
  avgRetries: number;
} {
  const queue = getQueue();

  if (queue.length === 0) {
    return {
      total: 0,
      byContext: {},
      oldestQueueTime: null,
      avgRetries: 0,
    };
  }

  const byContext: Record<string, number> = {};
  let oldestTime = Infinity;
  let totalRetries = 0;

  for (const prompt of queue) {
    byContext[prompt.context] = (byContext[prompt.context] || 0) + 1;
    oldestTime = Math.min(oldestTime, prompt.queuedAt);
    totalRetries += prompt.retryCount;
  }

  return {
    total: queue.length,
    byContext,
    oldestQueueTime: oldestTime === Infinity ? null : oldestTime,
    avgRetries: totalRetries / queue.length,
  };
}

/**
 * Auto-process queue when coming online
 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[AI Queue] Connection restored, processing queue...');
    void processQueue();
  });
}
