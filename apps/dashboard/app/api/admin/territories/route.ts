import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { countPropertiesInBoundary } from '@/lib/os-datahub-client';
import { getAgentColor } from '@/lib/color-generator';

// Helper function to convert GeoJSON to WKT (copied from spatial-queries)
function geojsonPolygonToWKT(polygon: any): string {
  if (!polygon || polygon.type !== 'Polygon') {
    throw new Error('Invalid polygon geometry');
  }
  const coordinates = polygon.coordinates[0];
  const points = coordinates
    .map((coord: [number, number]) => `${coord[0]} ${coord[1]}`)
    .join(', ');
  return `POLYGON((${points}))`;
}

/**
 * GET /api/admin/territories
 * List all territories with agent information
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Fetch all territories with agent details
    const { data: territories, error } = await supabase
      .from('territories')
      .select(`
        *,
        agent:agents!territories_agent_id_fkey(
          id,
          subdomain,
          profile:profiles!agents_user_id_fkey(
            first_name,
            last_name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching territories:', error);
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    // Add colors to territories
    const territoriesWithColors = (territories || []).map((territory, index) => ({
      ...territory,
      color: getAgentColor(territory.agent_id, index),
    }));

    return NextResponse.json({ data: territoriesWithColors });
  } catch (error: any) {
    console.error('GET /api/admin/territories error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/territories
 * Create new territory with overlap detection and property count
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, agent_id, boundary } = body;

    // Validate required fields
    if (!name || !agent_id || !boundary) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Missing required fields: name, agent_id, boundary' } },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agent_id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      );
    }

    // T164: Check for overlaps using PostGIS function
    const boundaryWKT = geojsonPolygonToWKT(boundary);

    const { data: overlaps, error: overlapError } = await supabase.rpc(
      'get_overlapping_territories',
      { new_boundary_wkt: boundaryWKT }
    );

    if (overlapError) {
      console.error('Error checking overlaps:', overlapError);
    }

    // T162: Get property count from OS Data Hub
    console.log('Calling OS Data Hub for property count...');
    const { count: osPropertyCount, error: osError, details } = await countPropertiesInBoundary(boundary);

    console.log('OS Data Hub response:', { count: osPropertyCount, error: osError, details });

    if (osError) {
      console.warn('OS Data Hub error:', osError);
    }

    // Convert GeoJSON to WKT for storage
    // PostGIS will use the trigger to calculate property count from database

    // Create territory
    const { data: territory, error: createError } = await supabase
      .from('territories')
      .insert({
        name,
        agent_id,
        boundary: boundaryWKT,
        property_count: osPropertyCount || 0, // Use OS count, will be updated by trigger
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating territory:', createError);
      return NextResponse.json(
        { error: { code: 'CREATE_ERROR', message: createError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      territory,
      overlaps: overlaps || [],
      os_property_count: osPropertyCount,
    });
  } catch (error: any) {
    console.error('POST /api/admin/territories error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
