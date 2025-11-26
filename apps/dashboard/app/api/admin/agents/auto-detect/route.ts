/**
 * POST /api/admin/agents/auto-detect
 * Manually trigger auto-detection scan of all properties
 *
 * Feature: 004-agent-lifecycle-management
 * Tasks: T021-T022
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scanPropertiesForNewAgents } from '@/lib/services/agent-detection';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: { message: 'Forbidden - admin access required' } }, { status: 403 });
    }

    // Run auto-detection scan
    console.log('[Auto-Detect] Starting manual auto-detection scan...');

    const results = await scanPropertiesForNewAgents();

    console.log('[Auto-Detect] Scan complete:', {
      scannedProperties: results.scannedProperties,
      newAgentsCreated: results.newAgentsCreated,
      agents: results.agents.map(a => a.subdomain),
    });

    return NextResponse.json({
      success: true,
      results: {
        scanned_properties: results.scannedProperties,
        new_agents_created: results.newAgentsCreated,
        agents: results.agents.map(agent => ({
          id: agent.id,
          branch_id: agent.apex27_branch_id,
          branch_name: agent.branch_name,
          subdomain: agent.subdomain,
        })),
      },
    });
  } catch (error: any) {
    console.error('[Auto-Detect] Error:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Internal server error',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}
