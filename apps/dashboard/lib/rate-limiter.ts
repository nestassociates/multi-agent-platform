/**
 * Rate Limiter Utility
 * Distributed rate limiting using Upstash Redis
 * Falls back to in-memory if Redis unavailable (fail-open)
 *
 * FR-001: Distributed storage for rate limiting
 * FR-004: Graceful degradation if Redis unavailable
 * FR-005: Backwards-compatible interface
 */

import { loginRateLimiter, contactRateLimiter, isRedisConfigured } from './redis';
import type { Ratelimit } from '@upstash/ratelimit';

// In-memory fallback store
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const fallbackStore = new Map<string, RateLimitEntry>();

// Cleanup fallback store every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of fallbackStore.entries()) {
      if (entry.resetAt < now) {
        fallbackStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp in milliseconds
}

/**
 * In-memory fallback rate limit check
 */
function checkFallback(
  key: string,
  maxAttempts: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = fallbackStore.get(key);

  if (!entry || entry.resetAt < now) {
    // First attempt or window expired
    fallbackStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      limited: false,
      remaining: maxAttempts - 1,
      resetAt: now + windowMs,
    };
  }

  // Increment count
  entry.count++;

  return {
    limited: entry.count > maxAttempts,
    remaining: Math.max(0, maxAttempts - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Check rate limit using Redis, with fallback to in-memory
 */
async function checkRateLimit(
  limiter: Ratelimit,
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (!isRedisConfigured()) {
    console.warn('Redis not configured, using in-memory rate limiting');
    return checkFallback(key, maxAttempts, windowMs);
  }

  try {
    const result = await limiter.limit(key);
    return {
      limited: !result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    };
  } catch (error) {
    // Fail-open: allow request if Redis is unavailable
    console.error('Rate limit check failed, allowing request (fail-open):', error);
    return {
      limited: false,
      remaining: -1, // Indicates unknown
      resetAt: 0,
    };
  }
}

/**
 * Check if login attempt is rate limited
 * FR-002: 5 attempts per email per 15 minutes
 *
 * @param email - Email address to check
 * @returns Rate limit result
 */
export async function checkLoginRateLimit(email: string): Promise<RateLimitResult> {
  const normalizedEmail = email.toLowerCase().trim();
  return checkRateLimit(
    loginRateLimiter,
    normalizedEmail,
    5, // maxAttempts
    15 * 60 * 1000 // 15 minutes
  );
}

/**
 * Check if contact form submission is rate limited
 * FR-003: 5 requests per IP per hour
 *
 * @param ip - IP address to check
 * @returns Rate limit result
 */
export async function checkContactRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(
    contactRateLimiter,
    ip,
    5, // maxAttempts
    60 * 60 * 1000 // 1 hour
  );
}

// ============================================================
// BACKWARDS COMPATIBLE INTERFACE
// These functions maintain the original sync-like API for existing code
// ============================================================

/**
 * @deprecated Use checkLoginRateLimit() for async rate limiting
 * Check if request is rate limited (sync wrapper)
 */
export function isRateLimited(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): boolean {
  // For backwards compatibility, use fallback store synchronously
  // New code should use async checkLoginRateLimit/checkContactRateLimit
  const result = checkFallback(key, maxAttempts, windowMs);
  return result.limited;
}

/**
 * Reset rate limit for a key
 * @param key - Unique identifier
 */
export function resetRateLimit(key: string): void {
  fallbackStore.delete(key);
  // Note: Redis rate limits auto-expire, no explicit reset needed
}

/**
 * @deprecated Use checkLoginRateLimit() for async rate limiting
 * Get remaining attempts (sync wrapper)
 */
export function getRemainingAttempts(
  key: string,
  maxAttempts: number = 5
): number {
  const entry = fallbackStore.get(key);

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
 * @deprecated Use checkLoginRateLimit() for async rate limiting
 * Get time until rate limit resets
 */
export function getResetTime(key: string): number {
  const entry = fallbackStore.get(key);

  if (!entry) {
    return 0;
  }

  const now = Date.now();
  return Math.max(0, entry.resetAt - now);
}

/**
 * Format reset time as human-readable string
 */
export function formatResetTime(resetAt: number): string {
  const now = Date.now();
  const diffMs = resetAt - now;

  if (diffMs <= 0) {
    return 'now';
  }

  const diffMinutes = Math.ceil(diffMs / (60 * 1000));

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
  }

  const diffHours = Math.ceil(diffMinutes / 60);
  return `${diffHours} hour${diffHours === 1 ? '' : 's'}`;
}
