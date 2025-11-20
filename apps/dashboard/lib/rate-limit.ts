/**
 * Rate Limiting Utility
 *
 * Simple in-memory rate limiter for API endpoints
 * Uses IP address as identifier
 *
 * For production with multiple instances, consider:
 * - Redis (Upstash)
 * - Vercel Edge Config
 * - Database-based rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  limit: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Optional: Skip rate limiting for certain IPs
   */
  skipIps?: string[];
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when limit resets
}

/**
 * Check if request is within rate limit
 * @param identifier - Unique identifier (usually IP address)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const { limit, windowMs, skipIps = [] } = config;

  // Skip rate limiting for whitelisted IPs
  if (skipIps.includes(identifier)) {
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Date.now() + windowMs,
    };
  }

  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No existing entry or window expired - create new
  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime,
    });

    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: resetTime,
    };
  }

  // Within window - check if over limit
  if (entry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Get client IP address from request
 * @param request - Next.js request object
 * @returns IP address or 'unknown'
 */
export function getClientIp(request: Request): string {
  // Try Vercel's forwarded IP header first
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Try real IP header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback
  return 'unknown';
}

/**
 * Pre-configured rate limit configs for common use cases
 */
export const RATE_LIMITS = {
  // API endpoints - 100 requests per minute per IP
  API: {
    limit: 100,
    windowMs: 60 * 1000,
  },

  // Authentication - 5 attempts per 15 minutes per IP
  AUTH: {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  },

  // Content submission - 10 per hour per user
  CONTENT_SUBMIT: {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  },

  // Public API - 300 requests per 5 minutes per IP
  PUBLIC_API: {
    limit: 300,
    windowMs: 5 * 60 * 1000,
  },

  // Webhooks - 100 per minute per source
  WEBHOOKS: {
    limit: 100,
    windowMs: 60 * 1000,
  },
} as const;
