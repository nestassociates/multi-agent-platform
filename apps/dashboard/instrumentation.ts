/**
 * Next.js Instrumentation
 * Runs once when the server starts
 *
 * Note: Sentry initialization happens automatically via:
 * - sentry.client.config.ts (browser)
 * - sentry.server.config.ts (Node.js server)
 * - sentry.edge.config.ts (Edge Runtime)
 */

export async function register() {
  // Sentry auto-initializes from config files
  // No manual initialization needed

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('Server runtime initialized');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    console.log('Edge runtime initialized');
  }
}
