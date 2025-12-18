/**
 * Agent Analytics API - Full Data
 * GET /api/agent/analytics
 *
 * Returns full analytics data for the authenticated agent's site
 * Query params:
 *   - range: '7d' | '30d' | '90d' (default: '30d')
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAgentAnalytics } from '@/lib/ga4';
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

    // Fetch analytics data
    const analytics = await getAgentAnalytics(agent.subdomain, range);

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch analytics' } },
      { status: 500 }
    );
  }
}
