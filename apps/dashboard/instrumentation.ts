/**
 * Next.js Instrumentation
 * Runs once when the server starts
 */

export async function register() {
  // Initialize Sentry on server startup
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initSentry } = await import('@/lib/sentry');
    initSentry();
  }

  // Edge runtime initialization
  if (process.env.NEXT_RUNTIME === 'edge') {
    const { initSentry } = await import('@/lib/sentry');
    initSentry();
  }
}
