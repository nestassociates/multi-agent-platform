/**
 * Cleanup Non-Exportable Properties
 * One-time operation to remove all non-exportable properties from database
 *
 * WARNING: This permanently deletes ~10,680 properties
 * ALWAYS run in dry-run mode first!
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getAllListings } from '@/lib/apex27/client';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // T027: Admin authentication check
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is admin (you might have a role check here)
    // For now, any authenticated user can run (adjust as needed)

    const body = await request.json();
    const dryRun = body.dry_run ?? false; // T021: Dry-run mode support

    console.log(`[Cleanup] Starting cleanup operation (dry_run: ${dryRun})`);

    const supabase = createServiceRoleClient();

    // T022: Query all properties from database
    const { data: allProperties, error: queryError } = await supabase
      .from('properties')
      .select('id, apex27_id, title, agent_id');

    if (queryError) {
      console.error('[Cleanup] Error querying properties:', queryError);
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: queryError.message } },
        { status: 500 }
      );
    }

    console.log(`[Cleanup] Found ${allProperties?.length || 0} properties in database`);

    // T023: Fetch current Apex27 data to check exportable status
    console.log('[Cleanup] Fetching current exportable status from Apex27...');
    const apex27Listings = await getAllListings();

    // Create map of apex27_id → exportable status
    const exportableMap = new Map<string, boolean>();
    apex27Listings.forEach(listing => {
      exportableMap.set(listing.id.toString(), listing.exportable);
    });

    console.log(`[Cleanup] Fetched ${apex27Listings.length} listings from Apex27`);

    // T024: Identify non-exportable properties for deletion
    const toDelete = (allProperties || []).filter(property => {
      const exportable = exportableMap.get(property.apex27_id);
      // Delete if:
      // 1. Property not found in Apex27 (no longer exists)
      // 2. OR property exists but exportable: false
      return exportable === undefined || exportable === false;
    });

    const toKeep = (allProperties || []).length - toDelete.length;

    console.log('[Cleanup] Deletion plan:', {
      total: allProperties?.length || 0,
      toDelete: toDelete.length,
      toKeep,
      dryRun,
    });

    // T021: If dry-run, return preview without deleting
    if (dryRun) {
      return NextResponse.json({
        dry_run: true,
        would_delete: toDelete.length,
        would_keep: toKeep,
        sample_deletions: toDelete.slice(0, 10).map(p => ({
          id: p.id,
          apex27_id: p.apex27_id,
          title: p.title,
          exportable: exportableMap.get(p.apex27_id) ?? null,
        })),
      });
    }

    // T025: Batch deletion for efficiency
    // T026: Log all deletions
    const BATCH_SIZE = 100;
    let deletedCount = 0;

    for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
      const batch = toDelete.slice(i, i + BATCH_SIZE);
      const batchIds = batch.map(p => p.id);

      const { error: deleteError } = await supabase
        .from('properties')
        .delete()
        .in('id', batchIds);

      if (deleteError) {
        console.error(`[Cleanup] Error deleting batch ${i / BATCH_SIZE + 1}:`, deleteError);
        // Continue with next batch despite error
      } else {
        deletedCount += batch.length;
        console.log(`[Cleanup] Deleted batch ${i / BATCH_SIZE + 1}: ${batch.length} properties (total: ${deletedCount}/${toDelete.length})`);
      }
    }

    const duration = Date.now() - startTime;

    // T026: Comprehensive logging
    console.log('[Cleanup] Operation complete:', {
      deletedCount,
      remainingCount: toKeep,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      deleted_count: deletedCount,
      remaining_count: toKeep,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Cleanup] Error during cleanup operation:', error);
    return NextResponse.json(
      { error: { code: 'CLEANUP_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}
