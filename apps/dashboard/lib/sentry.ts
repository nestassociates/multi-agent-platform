import * as Sentry from '@sentry/nextjs';

/**
 * Sentry utilities for error tracking and logging
 *
 * Configuration is in:
 * - sentry.client.config.ts (browser)
 * - sentry.server.config.ts (Node.js)
 * - sentry.edge.config.ts (Edge Runtime)
 *
 * To enable Sentry:
 * 1. Create account at https://sentry.io
 * 2. Create Next.js project
 * 3. Copy DSN
 * 4. Add to Vercel: NEXT_PUBLIC_SENTRY_DSN=your-dsn
 */

// Get Sentry logger
const { logger } = Sentry;

/**
 * Manually capture exception to Sentry
 * Use this to log errors that are caught but important to track
 */
export function captureException(error: Error | unknown, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });

  // Also log with structured logger
  if (context) {
    logger.error('Exception captured', context);
  }
}

/**
 * Manually capture message to Sentry
 * Use for tracking important events that aren't errors
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Structured logging helpers using Sentry logger
 */
export { logger };

/**
 * Log helpers for common scenarios
 */
export const log = {
  trace: (message: string, data?: Record<string, any>) => logger.trace(message, data),
  debug: (message: string, data?: Record<string, any>) => logger.debug(message, data),
  info: (message: string, data?: Record<string, any>) => logger.info(message, data),
  warn: (message: string, data?: Record<string, any>) => logger.warn(message, data),
  error: (message: string, data?: Record<string, any>) => logger.error(message, data),
  fatal: (message: string, data?: Record<string, any>) => logger.fatal(message, data),
};

/**
 * Set user context for error reports
 * Call this after user logs in
 */
export function setUserContext(user: { id: string; email: string; role: string }) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }
}

/**
 * Clear user context
 * Call this when user logs out
 */
export function clearUserContext() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 * Breadcrumbs show the sequence of events leading to an error
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
}
