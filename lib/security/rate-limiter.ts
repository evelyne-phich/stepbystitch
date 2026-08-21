/**
 * In-memory sliding window Rate Limiter for Next.js AI endpoints and Server Actions.
 *
 * Provides sub-millisecond, zero-dependency rate limiting per user ID or IP address
 * to prevent automated scraping, bot attacks, and AI quota exhaustion.
 */

interface RateLimitEntry {
  timestamps: number[];
}

// Global in-memory storage for rate limiting across requests in the current node process
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      // Keep entries that have timestamps within the last 10 minutes
      const validTimestamps = entry.timestamps.filter((ts) => now - ts < 600_000);
      if (validTimestamps.length === 0) {
        rateLimitStore.delete(key);
      } else {
        entry.timestamps = validTimestamps;
      }
    }
  }, 300_000);
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Checks if a given identifier exceeds the allowed request rate.
 *
 * @param identifier Unique key (e.g. `user_${userId}` or `ip_${clientIp}`)
 * @param limit Maximum number of requests allowed within the window (default: 5)
 * @param windowMs Time window in milliseconds (default: 60,000 ms / 1 minute)
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier) || { timestamps: [] };

  // Filter out timestamps outside the sliding window
  const windowStart = now - windowMs;
  const recentTimestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (recentTimestamps.length >= limit) {
    // Oldest timestamp in the active window determines when the user can retry
    const oldestInWindow = recentTimestamps[0];
    const retryAfterMs = Math.max(0, oldestInWindow + windowMs - now);
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  // Record this request
  recentTimestamps.push(now);
  rateLimitStore.set(identifier, { timestamps: recentTimestamps });

  return {
    allowed: true,
    limit,
    remaining: limit - recentTimestamps.length,
    retryAfterSeconds: 0,
  };
}
