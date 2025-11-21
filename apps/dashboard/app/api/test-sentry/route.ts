import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  // Test log
  Sentry.logger.info('Sentry test log triggered', { log_source: 'sentry_test' });

  // Test error
  try {
    throw new Error('Test error from Sentry - this is intentional for testing!');
  } catch (error) {
    Sentry.captureException(error);
  }

  // Test breadcrumb
  Sentry.addBreadcrumb({
    category: 'test',
    message: 'Sentry test endpoint called',
    level: 'info',
  });

  console.log('✅ Sentry test log sent');
  console.warn('⚠️ Sentry test warning sent');
  console.error('❌ Sentry test error sent');

  return NextResponse.json({
    success: true,
    message: 'Sentry test logs sent! Check your Sentry dashboard.',
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'Configured ✅' : 'Missing ❌',
  });
}
