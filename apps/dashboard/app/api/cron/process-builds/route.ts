import { NextRequest, NextResponse } from 'next/server';
import { processBuildQueue, getQueueStats } from '@nest/build-system';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max for build processing

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Verify cron authentication
 * In development, allows access without secret for testing
 */
function verifyCronAuth(request: NextRequest): boolean {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) return true;

  const authHeader = request.headers.get('authorization');
  const cronSecret = authHeader?.replace('Bearer ', '');
  return Boolean(CRON_SECRET && cronSecret === CRON_SECRET);
}

/**
 * POST /api/cron/process-builds
 * Process pending builds in the queue
 *
 * Security: Validates CRON_SECRET header (skipped in development)
 * Schedule: Every 2 minutes via vercel.json
 */
export async function POST(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    console.warn('[Cron] Unauthorized build queue access attempt');
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }

  try {
    const startTime = Date.now();
    console.log('[Cron] Starting build queue processing...');

    // Get queue stats before processing
    const statsBefore = await getQueueStats();

    if (statsBefore.queued === 0) {
      console.log('[Cron] No pending builds in queue');
      return NextResponse.json({
        success: true,
        message: 'No pending builds',
        stats: statsBefore,
        processingTime: Date.now() - startTime,
      });
    }

    console.log(`[Cron] Found ${statsBefore.queued} pending builds`);

    // Process up to 20 builds in parallel
    const results = await processBuildQueue(20);

    // Get queue stats after processing
    const statsAfter = await getQueueStats();

    const summary = {
      total: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      timestamp: new Date().toISOString(),
    };

    const processingTime = Date.now() - startTime;
    console.log(`[Cron] Build processing complete in ${processingTime}ms:`, summary);

    return NextResponse.json({
      success: true,
      message: 'Build queue processed',
      summary,
      results: results.map((r) => ({
        success: r.success,
        deploymentId: r.deploymentId,
        deploymentUrl: r.deploymentUrl,
        error: r.errorMessage,
      })),
      stats: {
        before: statsBefore,
        after: statsAfter,
      },
      processingTime,
    });
  } catch (error: any) {
    console.error('[Cron] Error processing build queue:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process build queue',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/process-builds
 * Returns current queue stats without processing
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }

  try {
    const stats = await getQueueStats();

    return NextResponse.json({
      success: true,
      message: 'Cron endpoint is active. Use POST to process builds.',
      endpoint: '/api/cron/process-builds',
      schedule: 'Every 2 minutes',
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get queue stats',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}
