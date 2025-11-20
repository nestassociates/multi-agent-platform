import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/public/agents
 * Public endpoint for WordPress site to fetch all active agents
 * No authentication required - public data only
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();

    // Fetch only active agents with their profiles
    const { data: agents, error } = await supabase
      .from('agents')
      .select(
        `
        id,
        subdomain,
        bio,
        qualifications,
        social_media_links,
        profile:profiles!agents_user_id_fkey(
          first_name,
          last_name,
          email,
          phone,
          avatar_url
        ),
        territories(name)
      `
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching public agents:', error);
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: 'Failed to fetch agents' } },
        { status: 500 }
      );
    }

    // Format response for WordPress consumption
    const formattedAgents = (agents || []).map((agent: any) => ({
      id: agent.id,
      name: `${agent.profile?.first_name} ${agent.profile?.last_name}`,
      first_name: agent.profile?.first_name,
      last_name: agent.profile?.last_name,
      email: agent.profile?.email,
      phone: agent.profile?.phone,
      bio: agent.bio,
      subdomain: agent.subdomain,
      avatar_url: agent.profile?.avatar_url,
      qualifications: agent.qualifications || [],
      social_media_links: agent.social_media_links || {},
      territory: agent.territories?.[0]?.name || null,
      microsite_url: `https://${agent.subdomain}.agents.nestassociates.com`,
    }));

    // Create response with CORS and caching headers
    const response = NextResponse.json(formattedAgents);

    // T294: CORS headers for WordPress domain
    response.headers.set('Access-Control-Allow-Origin', '*'); // Allow all origins for public API
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    // T295: 5-minute cache headers
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return response;
  } catch (error: any) {
    console.error('GET /api/public/agents error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/public/agents
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
