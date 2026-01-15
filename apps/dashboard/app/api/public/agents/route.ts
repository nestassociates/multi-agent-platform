import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { geocodeLocation, milesToMeters, metersToMiles } from '@/lib/geocoding';

// 30 mile radius for agent search
const AGENT_SEARCH_RADIUS_MILES = 30;

/**
 * GET /api/public/agents
 * Public endpoint for WordPress site to fetch active agents
 * Supports geo-location search with 30-mile radius
 * No authentication required - public data only
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters for geo-search
    const location = searchParams.get('location');
    const providedLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const providedLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;

    const supabase = createServiceRoleClient();

    // Variables for geo-search
    let searchLat: number | null = null;
    let searchLng: number | null = null;
    let geocodeSource: string | null = null;
    let geocodeDisplayName: string | null = null;

    // If lat/lng provided, use directly
    if (providedLat !== null && providedLng !== null) {
      searchLat = providedLat;
      searchLng = providedLng;
      geocodeSource = 'provided';
    }
    // Otherwise, geocode the location if provided
    else if (location) {
      const geocodeResult = await geocodeLocation(location);
      if (geocodeResult) {
        searchLat = geocodeResult.lat;
        searchLng = geocodeResult.lng;
        geocodeSource = geocodeResult.source;
        geocodeDisplayName = geocodeResult.displayName || location;
      }
    }

    let agents: any[] = [];
    let searchMetadata: any = null;

    // If we have coordinates, use geo-search with 30-mile radius
    if (searchLat !== null && searchLng !== null) {
      const radiusMeters = milesToMeters(AGENT_SEARCH_RADIUS_MILES);

      const { data: spatialAgents, error: spatialError } = await supabase.rpc(
        'search_agents_within_radius',
        {
          search_lat: searchLat,
          search_lng: searchLng,
          radius_meters: radiusMeters,
        }
      );

      if (spatialError) {
        console.error('Error in agent geo-search:', spatialError);
        // Fall back to listing all agents
      } else {
        // Fetch profile info for spatial results (RPC doesn't join)
        const agentIds = (spatialAgents || []).map((a: any) => a.id);

        if (agentIds.length > 0) {
          const { data: profileData } = await supabase
            .from('agents')
            .select(`
              id,
              profile:profiles!agents_user_id_fkey(
                first_name,
                last_name,
                email,
                phone,
                avatar_url
              )
            `)
            .in('id', agentIds);

          const profileMap = new Map((profileData || []).map((a: any) => [a.id, a.profile]));

          // Merge profile data with spatial results
          agents = (spatialAgents || []).map((agent: any) => ({
            ...agent,
            profile: profileMap.get(agent.id) || null,
          }));
        }

        searchMetadata = {
          type: 'spatial',
          center: {
            latitude: searchLat,
            longitude: searchLng,
          },
          radius_miles: AGENT_SEARCH_RADIUS_MILES,
          geocode_source: geocodeSource,
          geocode_display_name: geocodeDisplayName,
        };
      }
    }

    // Fallback: fetch all active agents if no geo-search or geo-search failed
    if (agents.length === 0 && !searchMetadata) {
      const { data: allAgents, error } = await supabase
        .from('agents')
        .select(
          `
          id,
          subdomain,
          branch_name,
          bio,
          qualifications,
          social_media_links,
          profile:profiles!agents_user_id_fkey(
            first_name,
            last_name,
            email,
            phone,
            avatar_url
          )
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

      agents = allAgents || [];
    }

    // Format response for WordPress consumption
    const formattedAgents = agents.map((agent: any) => ({
      id: agent.id,
      name: `${agent.profile?.first_name || ''} ${agent.profile?.last_name || ''}`.trim(),
      first_name: agent.profile?.first_name,
      last_name: agent.profile?.last_name,
      email: agent.profile?.email,
      phone: agent.profile?.phone,
      bio: agent.bio,
      subdomain: agent.subdomain,
      avatar_url: agent.profile?.avatar_url,
      qualifications: agent.qualifications || [],
      social_media_links: agent.social_media_links || {},
      territory: agent.branch_name || null,
      microsite_url: `https://${agent.subdomain}.nestassociates.co.uk`,
      // Include distance if from geo-search
      ...(agent.distance_meters !== undefined && {
        distance_miles: metersToMiles(agent.distance_meters),
        distance_meters: agent.distance_meters,
      }),
    }));

    // Build response object
    const responseData: any = {
      data: formattedAgents,
    };

    // Add search metadata if geo-search was performed
    if (searchMetadata) {
      responseData.search = searchMetadata;
    }

    // Create response with CORS and caching headers
    const response = NextResponse.json(responseData);

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
