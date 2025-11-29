import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * T018-T019: GET /api/public/agents/[id]/info
 * Public endpoint for agent microsites to get basic agent info
 * Returns only public-safe fields (id, name, avatarUrl, phone, subdomain)
 * No authentication required - public data only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;

    // Validate agent ID is UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(agentId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMS', message: 'Invalid agent ID format' } },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Fetch agent with profile - only active agents
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select(
        `
        id,
        subdomain,
        status,
        profile:profiles!agents_user_id_fkey(
          first_name,
          last_name,
          phone,
          avatar_url
        )
      `
      )
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found or inactive' } },
        { status: 404 }
      );
    }

    if (agent.status !== 'active') {
      return NextResponse.json(
        { error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found or inactive' } },
        { status: 404 }
      );
    }

    // T019: Return only public-safe fields
    const profile = agent.profile as any;
    const responseData = {
      id: agent.id,
      name: profile ? `${profile.first_name} ${profile.last_name}` : 'Agent',
      avatarUrl: profile?.avatar_url || null,
      phone: profile?.phone || null,
      subdomain: agent.subdomain,
    };

    // Create response with caching headers
    const response = NextResponse.json(responseData);

    // CORS headers for agent microsites
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    // Cache headers - 10 minute cache (agent info changes less frequently)
    response.headers.set('Cache-Control', 'public, max-age=600, s-maxage=600, stale-while-revalidate=1200');

    return response;
  } catch (error: any) {
    console.error('GET /api/public/agents/[id]/info error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/public/agents/[id]/info
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
