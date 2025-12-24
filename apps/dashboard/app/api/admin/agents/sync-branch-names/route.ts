import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getListings } from '@/lib/apex27/client';

// Allow this to be called from cron jobs or admin scripts
export const runtime = 'nodejs';

/**
 * POST /api/admin/agents/sync-branch-names
 * Sync branch names from Apex27 API to agents table
 * This populates the territory/area name for each agent
 *
 * Requires X-Admin-Secret header matching ADMIN_SECRET env var
 */
export async function POST(request: NextRequest) {
  // Simple secret-based auth for admin operations
  const adminSecret = request.headers.get('X-Admin-Secret');
  const expectedSecret = process.env.ADMIN_SECRET || 'dev-secret-change-in-prod';

  if (adminSecret !== expectedSecret) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid admin secret' } },
      { status: 401 }
    );
  }

  try {
    const supabase = createServiceRoleClient();

    // Fetch all agents with apex27_branch_id but missing branch_name
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, apex27_branch_id, branch_name')
      .not('apex27_branch_id', 'is', null);

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: 'Failed to fetch agents' } },
        { status: 500 }
      );
    }

    // Fetch listings from Apex27 to get branch info
    console.log('[Sync] Fetching branch data from Apex27...');
    const { listings } = await getListings({ page: 1, pageSize: 250 });

    // Build a map of branch ID -> branch name
    const branchMap = new Map<string, string>();
    listings.forEach(listing => {
      if (listing.branch?.id && listing.branch?.name) {
        branchMap.set(String(listing.branch.id), listing.branch.name);
      }
    });

    console.log(`[Sync] Found ${branchMap.size} unique branches in Apex27`);

    // Update agents with missing branch names
    let updated = 0;
    let skipped = 0;
    const updates: Array<{ id: string; branch_name: string }> = [];

    for (const agent of agents || []) {
      if (!agent.apex27_branch_id) {
        skipped++;
        continue;
      }

      const branchName = branchMap.get(agent.apex27_branch_id);

      // Update if we have a branch name and it's different from current
      if (branchName && branchName !== agent.branch_name) {
        updates.push({ id: agent.id, branch_name: branchName });
      } else if (!branchName) {
        skipped++;
      }
    }

    // Apply updates
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('agents')
        .update({ branch_name: update.branch_name })
        .eq('id', update.id);

      if (updateError) {
        console.error(`Failed to update agent ${update.id}:`, updateError);
      } else {
        updated++;
        console.log(`[Sync] Updated agent ${update.id} with branch name: ${update.branch_name}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalAgents: agents?.length || 0,
      updated,
      skipped,
      branchesFound: branchMap.size,
    });
  } catch (error: any) {
    console.error('POST /api/admin/agents/sync-branch-names error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'An error occurred' } },
      { status: 500 }
    );
  }
}
