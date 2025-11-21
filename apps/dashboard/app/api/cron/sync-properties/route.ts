/**
 * Property Sync Cron Job
 * Runs every 6 hours to perform full reconciliation sync
 *
 * Purpose: Catch any missed webhook events and ensure data consistency
 * Triggered by: Vercel Cron (configured in vercel.json)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllListings } from '@/lib/apex27/client';
import { syncPropertiesFromApex27 } from '@/lib/services/property-service';

export async function POST(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET not configured');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('[Cron] Invalid authorization header');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('[Cron] Starting property sync...');

  try {
    // Fetch all listings from Apex27 Main API
    console.log('[Cron] Fetching listings from Apex27...');
    const listings = await getAllListings();
    console.log(`[Cron] Fetched ${listings.length} listings from Apex27`);

    // Sync to database
    console.log('[Cron] Syncing properties to database...');
    const result = await syncPropertiesFromApex27(listings);

    const duration = Date.now() - startTime;

    console.log('[Cron] Sync complete:', {
      duration: `${duration}ms`,
      ...result,
    });

    return NextResponse.json(
      {
        success: true,
        summary: {
          totalListings: result.total,
          synced: result.synced,
          filtered: result.filtered, // T009: Include filtered count
          skipped: result.skipped,
          errors: result.errors,
          duration: `${duration}ms`,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Cron] Error during property sync:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for manual testing
 * Allows admins to trigger sync manually from dashboard
 */
export async function GET(request: NextRequest) {
  console.log('[Manual Sync] Triggered by admin');

  // For manual triggers, we'll add a quick incremental sync option
  // by checking for a 'since' query parameter
  const searchParams = request.nextUrl.searchParams;
  const since = searchParams.get('since'); // ISO datetime

  const startTime = Date.now();

  try {
    console.log('[Manual Sync] Fetching listings from Apex27...');
    const listings = await getAllListings(since || undefined);
    console.log(`[Manual Sync] Fetched ${listings.length} listings`);

    console.log('[Manual Sync] Syncing to database...');
    const result = await syncPropertiesFromApex27(listings);

    const duration = Date.now() - startTime;

    console.log('[Manual Sync] Complete:', result);

    return NextResponse.json(
      {
        success: true,
        summary: {
          totalListings: result.total,
          synced: result.synced,
          filtered: result.filtered,
          skipped: result.skipped,
          errors: result.errors,
          duration: `${duration}ms`,
          incrementalSync: !!since,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Manual Sync] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
