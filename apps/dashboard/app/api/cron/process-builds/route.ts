import { NextRequest, NextResponse } from 'next/server';
import { processBuildQueue } from '@nest/build-system';

/**
 * POST /api/cron/process-builds
 * Process pending builds in the queue
 *
 * Security: Validates CRON_SECRET header
 * Schedule: Every 2 minutes via vercel.json
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (security)
    const authHeader = request.headers.get('authorization');
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedSecret) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting build queue processing...');

    // Process up to 20 builds in parallel
    const results = await processBuildQueue(20);

    const summary = {
      total: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      timestamp: new Date().toISOString(),
    };

    console.log('[Cron] Build processing complete:', summary);

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

// Allow GET for manual testing
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedSecret) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }

  // Just return queue status
  return NextResponse.json({
    message: 'Cron endpoint is active. Use POST to process builds.',
    endpoint: '/api/cron/process-builds',
    schedule: 'Every 2 minutes',
  });
}
