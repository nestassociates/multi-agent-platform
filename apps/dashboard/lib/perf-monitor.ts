/**
 * Performance Monitoring Utilities
 *
 * Track database query performance and API response times
 */

import { captureMessage } from '@/lib/sentry';

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: number;
  result_count?: number;
}

// In-memory store for recent queries (last 100)
const recentQueries: QueryMetrics[] = [];
const MAX_STORED_QUERIES = 100;

// Slow query threshold (milliseconds)
const SLOW_QUERY_THRESHOLD = 1000; // 1 second

/**
 * Measure database query performance
 * Wraps a Supabase query and tracks execution time
 */
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - startTime;

    // Store metrics
    const metrics: QueryMetrics = {
      query: queryName,
      duration,
      timestamp: Date.now(),
    };

    // Add to recent queries (keep last 100)
    recentQueries.push(metrics);
    if (recentQueries.length > MAX_STORED_QUERIES) {
      recentQueries.shift();
    }

    // Log slow queries
    if (duration > SLOW_QUERY_THRESHOLD) {
      console.warn(`[SLOW QUERY] ${queryName} took ${duration.toFixed(2)}ms`);

      // Report to Sentry if configured
      captureMessage(
        `Slow query detected: ${queryName} (${duration.toFixed(2)}ms)`,
        'warning'
      );
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    console.error(`[QUERY ERROR] ${queryName} failed after ${duration.toFixed(2)}ms`, error);

    throw error;
  }
}

/**
 * Get recent query metrics
 * Useful for debugging and monitoring
 */
export function getRecentQueryMetrics(): QueryMetrics[] {
  return [...recentQueries];
}

/**
 * Get query performance statistics
 */
export function getQueryStats() {
  if (recentQueries.length === 0) {
    return null;
  }

  const durations = recentQueries.map((q) => q.duration);

  return {
    total_queries: recentQueries.length,
    average_duration: durations.reduce((a, b) => a + b, 0) / durations.length,
    min_duration: Math.min(...durations),
    max_duration: Math.max(...durations),
    slow_queries: recentQueries.filter((q) => q.duration > SLOW_QUERY_THRESHOLD).length,
    p95: percentile(durations, 0.95),
    p99: percentile(durations, 0.99),
  };
}

/**
 * Calculate percentile of array
 */
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;

  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * p) - 1;

  return sorted[index];
}

/**
 * Clear query metrics
 * Useful for testing or resetting stats
 */
export function clearQueryMetrics(): void {
  recentQueries.length = 0;
}

/**
 * API Response Time Tracker
 */

interface ApiMetrics {
  endpoint: string;
  method: string;
  status: number;
  duration: number;
  timestamp: number;
}

const recentApiCalls: ApiMetrics[] = [];
const MAX_STORED_API_CALLS = 100;
const SLOW_API_THRESHOLD = 2000; // 2 seconds

/**
 * Measure API endpoint performance
 * Use in API route handlers
 */
export async function measureApiCall<T>(
  endpoint: string,
  method: string,
  handler: () => Promise<Response>
): Promise<Response> {
  const startTime = performance.now();

  try {
    const response = await handler();
    const duration = performance.now() - startTime;

    // Store metrics
    const metrics: ApiMetrics = {
      endpoint,
      method,
      status: response.status,
      duration,
      timestamp: Date.now(),
    };

    recentApiCalls.push(metrics);
    if (recentApiCalls.length > MAX_STORED_API_CALLS) {
      recentApiCalls.shift();
    }

    // Log slow API calls
    if (duration > SLOW_API_THRESHOLD) {
      console.warn(`[SLOW API] ${method} ${endpoint} took ${duration.toFixed(2)}ms (${response.status})`);

      captureMessage(
        `Slow API endpoint: ${method} ${endpoint} (${duration.toFixed(2)}ms)`,
        'warning'
      );
    }

    // Add performance headers
    response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);
    response.headers.set('X-Timestamp', String(Date.now()));

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;

    console.error(`[API ERROR] ${method} ${endpoint} failed after ${duration.toFixed(2)}ms`, error);

    throw error;
  }
}

/**
 * Get recent API call metrics
 */
export function getRecentApiMetrics(): ApiMetrics[] {
  return [...recentApiCalls];
}

/**
 * Get API performance statistics
 */
export function getApiStats() {
  if (recentApiCalls.length === 0) {
    return null;
  }

  const durations = recentApiCalls.map((call) => call.duration);
  const byEndpoint: Record<string, number[]> = {};

  // Group by endpoint
  recentApiCalls.forEach((call) => {
    if (!byEndpoint[call.endpoint]) {
      byEndpoint[call.endpoint] = [];
    }
    byEndpoint[call.endpoint].push(call.duration);
  });

  // Calculate stats per endpoint
  const endpointStats = Object.entries(byEndpoint).map(([endpoint, times]) => ({
    endpoint,
    count: times.length,
    average: times.reduce((a, b) => a + b, 0) / times.length,
    p95: percentile(times, 0.95),
  }));

  return {
    total_calls: recentApiCalls.length,
    average_duration: durations.reduce((a, b) => a + b, 0) / durations.length,
    min_duration: Math.min(...durations),
    max_duration: Math.max(...durations),
    slow_calls: recentApiCalls.filter((call) => call.duration > SLOW_API_THRESHOLD).length,
    p95: percentile(durations, 0.95),
    p99: percentile(durations, 0.99),
    by_endpoint: endpointStats.sort((a, b) => b.p95 - a.p95), // Slowest first
  };
}

/**
 * Export metrics for admin dashboard
 */
export function getPerformanceReport() {
  return {
    queries: getQueryStats(),
    api: getApiStats(),
    timestamp: new Date().toISOString(),
  };
}
