export const dynamic = 'force-dynamic';
/**
 * Agent Properties API
 * GET endpoint for agents to view their own properties
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get agent record for current user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, apex27_branch_id')
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Agent profile not found' } },
        { status: 404 }
      );
    }

    // Get properties for this agent
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .eq('agent_id', agent.id)
      .order('updated_at', { ascending: false });

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: propertiesError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: properties || [],
      meta: {
        total: properties?.length || 0,
        agentBranchId: agent.apex27_branch_id,
      },
    });
  } catch (error: any) {
    console.error('Error in agent properties API:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
