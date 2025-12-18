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
 * List all postcode-based territory assignments with agent information
 *
 * Updated for Feature 008: Now queries agent_postcodes table instead of territories
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

    // Fetch all postcode assignments with agent details
    const { data: assignments, error } = await supabase
      .from('agent_postcodes')
      .select(`
        id,
        agent_id,
        postcode_code,
        sector_code,
        assigned_at,
        agent:agents!agent_postcodes_agent_id_fkey(
          id,
          subdomain,
          profile:profiles!agents_user_id_fkey(
            first_name,
            last_name
          )
        )
      `)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching assignments:', error);
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    // Group assignments by agent to create "territory" summaries
    const agentTerritories: Record<string, {
      id: string;
      agent_id: string;
      postcodes: string[];
      sectors: string[];
      agent: any;
      assigned_at: string;
    }> = {};

    for (const assignment of assignments || []) {
      const agentId = assignment.agent_id;

      if (!agentTerritories[agentId]) {
        agentTerritories[agentId] = {
          id: agentId, // Use agent_id as territory id for grouping
          agent_id: agentId,
          postcodes: [],
          sectors: [],
          agent: assignment.agent,
          assigned_at: assignment.assigned_at,
        };
      }

      if (assignment.sector_code) {
        // Sector-level assignment
        if (!agentTerritories[agentId].sectors.includes(assignment.sector_code)) {
          agentTerritories[agentId].sectors.push(assignment.sector_code);
        }
      } else {
        // Full district assignment
        if (!agentTerritories[agentId].postcodes.includes(assignment.postcode_code)) {
          agentTerritories[agentId].postcodes.push(assignment.postcode_code);
        }
      }
    }

    // Collect all postcodes and sectors to look up counts
    const allPostcodes = new Set<string>();
    const allSectors = new Set<string>();

    for (const territory of Object.values(agentTerritories)) {
      territory.postcodes.forEach((p) => allPostcodes.add(p));
      territory.sectors.forEach((s) => allSectors.add(s));
    }

    // Fetch cached property counts for districts
    const postcodeCountMap: Record<string, number> = {};
    if (allPostcodes.size > 0) {
      const { data: postcodeCounts } = await supabase
        .from('postcode_property_counts')
        .select('postcode_code, residential_count')
        .in('postcode_code', Array.from(allPostcodes));

      (postcodeCounts || []).forEach((pc) => {
        postcodeCountMap[pc.postcode_code] = pc.residential_count || 0;
      });
    }

    // Fetch cached property counts for sectors
    const sectorCountMap: Record<string, number> = {};
    if (allSectors.size > 0) {
      const { data: sectorCounts } = await supabase
        .from('sector_property_counts')
        .select('sector_code, residential_count')
        .in('sector_code', Array.from(allSectors));

      (sectorCounts || []).forEach((sc) => {
        sectorCountMap[sc.sector_code] = sc.residential_count || 0;
      });
    }

    // Convert to array and format for UI
    const territories = Object.values(agentTerritories).map((territory, index) => {
      // Build territory name from postcodes and sectors
      const parts: string[] = [];
      if (territory.postcodes.length > 0) {
        parts.push(territory.postcodes.join(', '));
      }
      if (territory.sectors.length > 0) {
        // Group sectors by district for cleaner display
        const sectorsByDistrict: Record<string, string[]> = {};
        for (const sector of territory.sectors) {
          const match = sector.match(/^([A-Z]+\d+)/);
          if (match) {
            const district = match[1];
            if (!sectorsByDistrict[district]) {
              sectorsByDistrict[district] = [];
            }
            sectorsByDistrict[district].push(sector);
          }
        }
        for (const [district, districtSectors] of Object.entries(sectorsByDistrict)) {
          parts.push(`${district} (${districtSectors.length} sectors)`);
        }
      }

      // Calculate total property count from cached values
      let propertyCount = 0;
      territory.postcodes.forEach((p) => {
        propertyCount += postcodeCountMap[p] || 0;
      });
      territory.sectors.forEach((s) => {
        propertyCount += sectorCountMap[s] || 0;
      });

      return {
        id: territory.id,
        name: parts.join(' + ') || 'No postcodes',
        agent_id: territory.agent_id,
        agent: territory.agent,
        property_count: propertyCount,
        created_at: territory.assigned_at,
        color: getAgentColor(territory.agent_id, index),
        // Additional data for the UI
        postcodes: territory.postcodes,
        sectors: territory.sectors,
      };
    });

    return NextResponse.json({ data: territories });
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
    console.log('📍 [TERRITORIES-API] Calling OS Data Hub for property count...', {
      boundaryType: boundary?.type,
      coordinatesCount: boundary?.coordinates?.[0]?.length,
      timestamp: new Date().toISOString(),
    });

    const { count: osPropertyCount, error: osError, details, metadata } = await countPropertiesInBoundary(boundary);

    console.log('📍 [TERRITORIES-API] OS Data Hub response:', {
      count: osPropertyCount,
      error: osError,
      details,
      metadata,
      timestamp: new Date().toISOString(),
    });

    if (osError) {
      console.warn('OS Data Hub error:', osError);
    }

    // Convert GeoJSON to WKT for storage
    // PostGIS will use the trigger to calculate property count from database

    // Prepare metadata for storage
    const territoryMetadata = metadata ? {
      postcodes: metadata.postcodes || [],
      area_km2: metadata.areaKm2,
      radius_meters: metadata.radiusMeters,
      commercial_count: details?.commercial || 0,
      mixed_count: details?.mixed || 0,
    } : null;

    // Create territory
    const { data: territory, error: createError } = await supabase
      .from('territories')
      .insert({
        name,
        agent_id,
        boundary: boundaryWKT,
        property_count: osPropertyCount || 0, // Use OS count, will be updated by trigger
        metadata: territoryMetadata,
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
