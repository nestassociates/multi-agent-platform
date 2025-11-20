import * as Sentry from '@sentry/nextjs';

/**
 * Initialize Sentry for error tracking
 *
 * To enable Sentry:
 * 1. Create a Sentry account at https://sentry.io
 * 2. Create a new Next.js project
 * 3. Copy your DSN
 * 4. Add to .env.local: NEXT_PUBLIC_SENTRY_DSN=your-dsn-here
 * 5. Add to Vercel environment variables
 */

export function initSentry() {
  const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

  // Only initialize if DSN is configured
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

    // Session Replay (optional)
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Release tracking
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

    // Filter sensitive data
    beforeSend(event) {
      // Remove sensitive data from error reports
      if (event.request) {
        // Remove auth tokens from headers
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }

        // Remove sensitive query params
        if (event.request.query_string) {
          const params = new URLSearchParams(event.request.query_string);
          params.delete('token');
          params.delete('password');
          params.delete('secret');
          event.request.query_string = params.toString();
        }
      }

      // Remove sensitive data from extra context
      if (event.extra) {
        delete event.extra.password;
        delete event.extra.token;
        delete event.extra.apiKey;
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',

      // Network errors (user's connection issues)
      'Network request failed',
      'NetworkError',
      'Failed to fetch',

      // Cancelled requests
      'cancelled',
      'AbortError',
    ],

    // Don't send errors from these URLs (bots, scrapers)
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
    ],
  });
}

/**
 * Manually capture exception to Sentry
 * Use this to log errors that are caught but important to track
 */
export function captureException(error: Error | unknown, context?: Record<string, any>) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    // Fallback to console if Sentry not configured
    console.error('Error:', error, context);
  }
}

/**
 * Manually capture message to Sentry
 * Use for tracking important events that aren't errors
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level.toUpperCase()}]`, message);
  }
}

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
