/**
 * Admin Agent Analytics API
 * GET /api/admin/agents/[id]/analytics
 *
 * Returns analytics for any agent (admin only)
 * Query params:
 *   - range: '7d' | '30d' | '90d' (default: '30d')
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAgentAnalytics } from '@/lib/ga4';
import type { DateRange } from '@/lib/ga4';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Get target agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, subdomain, status, name')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      );
    }

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const rangeParam = searchParams.get('range') || '30d';
    const validRanges = ['7d', '30d', '90d'];
    const range: DateRange = validRanges.includes(rangeParam)
      ? (rangeParam as DateRange)
      : '30d';

    // Fetch analytics data
    const analytics = await getAgentAnalytics(agent.subdomain, range);

    return NextResponse.json({
      success: true,
      data: {
        ...analytics,
        agent: {
          id: agent.id,
          name: agent.name,
          subdomain: agent.subdomain,
          status: agent.status,
        },
      },
    });
  } catch (error) {
    console.error('[Admin Analytics API] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch analytics' } },
      { status: 500 }
    );
  }
}
