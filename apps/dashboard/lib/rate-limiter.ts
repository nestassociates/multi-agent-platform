/**
 * Rate Limiter Utility
 * Simple in-memory rate limiting for login attempts
 * FR-004: Maximum 5 attempts per 15 minutes per email address
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting
// In production, this should use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if request is rate limited
 * @param key - Unique identifier (e.g., email address)
 * @param maxAttempts - Maximum attempts allowed (default: 5)
 * @param windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns True if rate limited, false if allowed
 */
export function isRateLimited(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    // First attempt
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return false;
  }

  // Check if window has expired
  if (entry.resetAt < now) {
    // Reset the counter
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return false;
  }

  // Increment count
  entry.count++;

  // Check if over limit
  if (entry.count > maxAttempts) {
    return true;
  }

  return false;
}

/**
 * Reset rate limit for a key
 * @param key - Unique identifier
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Get remaining attempts
 * @param key - Unique identifier
 * @param maxAttempts - Maximum attempts allowed (default: 5)
 * @returns Number of remaining attempts
 */
export function getRemainingAttempts(
  key: string,
  maxAttempts: number = 5
): number {
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return maxAttempts;
  }

  const now = Date.now();
  if (entry.resetAt < now) {
    return maxAttempts;
  }

  return Math.max(0, maxAttempts - entry.count);
}

/**
 * Get time until rate limit resets
 * @param key - Unique identifier
 * @returns Milliseconds until reset, or 0 if not rate limited
 */
export function getResetTime(key: string): number {
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return 0;
  }

  const now = Date.now();
  return Math.max(0, entry.resetAt - now);
}
