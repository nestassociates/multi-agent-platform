export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { districtCodeSchema } from '@nest/validation';

/**
 * GET /api/admin/sectors/list?district=TA1
 * Fetch sectors for a specific district with assignment info
 *
 * Feature: 008-postcode-sector-territories
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

    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district');

    // Validate district parameter
    if (!district) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'District parameter is required' } },
        { status: 400 }
      );
    }

    const validationResult = districtCodeSchema.safeParse(district);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid district code format',
            details: validationResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get sectors for the district with their boundaries as GeoJSON
    const { data: sectorsRaw, error: sectorsError } = await supabase
      .from('postcode_sectors')
      .select('code, district_code, area_km2, created_at, updated_at')
      .eq('district_code', district)
      .order('code');

    if (sectorsError) {
      console.error('Error fetching sectors:', sectorsError);
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: sectorsError.message } },
        { status: 500 }
      );
    }

    if (!sectorsRaw || sectorsRaw.length === 0) {
      return NextResponse.json({
        sectors: [],
        district,
        message: 'No sector data available for this district',
      });
    }

    // Get GeoJSON boundaries for each sector
    const sectorsWithBoundaries = await Promise.all(
      sectorsRaw.map(async (sector) => {
        const { data: geoData } = await supabase.rpc('get_sector_geojson', {
          sector_code_param: sector.code,
        });

        return {
          ...sector,
          boundary: geoData?.boundary || null,
          center_point: geoData?.center_point || null,
        };
      })
    );

    // Get assignments for these sectors
    const sectorCodes = sectorsRaw.map((s) => s.code);
    const { data: assignments, error: assignmentError } = await supabase
      .from('agent_postcodes')
      .select(`
        sector_code,
        agent_id,
        agents!inner (
          id,
          subdomain
        )
      `)
      .eq('postcode_code', district)
      .in('sector_code', sectorCodes);

    if (assignmentError) {
      console.error('Error fetching assignments:', assignmentError);
      // Continue without assignments - non-fatal
    }

    // Also check for full district assignment
    const { data: districtAssignment } = await supabase
      .from('agent_postcodes')
      .select(`
        agent_id,
        agents!inner (
          id,
          subdomain
        )
      `)
      .eq('postcode_code', district)
      .is('sector_code', null)
      .maybeSingle();

    // Build assignment lookup
    const assignmentMap: Record<string, { id: string; subdomain: string }> = {};
    if (assignments) {
      for (const a of assignments) {
        if (a.sector_code && a.agents) {
          assignmentMap[a.sector_code] = {
            id: (a.agents as any).id,
            subdomain: (a.agents as any).subdomain,
          };
        }
      }
    }

    // If full district is assigned, all sectors belong to that agent
    const fullDistrictAgent = districtAssignment?.agents
      ? {
          id: (districtAssignment.agents as any).id,
          subdomain: (districtAssignment.agents as any).subdomain,
        }
      : null;

    // Combine data
    const sectors = sectorsWithBoundaries.map((sector) => ({
      ...sector,
      assigned_agent: fullDistrictAgent || assignmentMap[sector.code] || null,
    }));

    return NextResponse.json({
      sectors,
      district,
      full_district_agent: fullDistrictAgent,
    });
  } catch (error: any) {
    console.error('GET /api/admin/sectors/list error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
