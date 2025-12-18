/**
 * Agent Analytics API - Overview Only
 * GET /api/agent/analytics/overview
 *
 * Returns overview metrics only (lighter query)
 * Query params:
 *   - range: '7d' | '30d' | '90d' (default: '30d')
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAgentAnalyticsOverview } from '@/lib/ga4';
import type { DateRange } from '@/lib/ga4';

export async function GET(request: NextRequest) {
  try {
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

    // Get agent profile
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, subdomain, status')
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Agent profile not found' } },
        { status: 404 }
      );
    }

    // Agent must be active to view analytics
    if (agent.status !== 'active') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Analytics available for active agents only' } },
        { status: 403 }
      );
    }

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const rangeParam = searchParams.get('range') || '30d';
    const validRanges = ['7d', '30d', '90d'];
    const range: DateRange = validRanges.includes(rangeParam)
      ? (rangeParam as DateRange)
      : '30d';

    // Fetch overview data
    const overview = await getAgentAnalyticsOverview(agent.subdomain, range);

    return NextResponse.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error('[Analytics Overview API] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch analytics overview' } },
      { status: 500 }
    );
  }
}
