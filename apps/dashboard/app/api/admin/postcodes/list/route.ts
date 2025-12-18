export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';

/**
 * GET /api/admin/postcodes/list
 * Fetch postcodes filtered by area prefix
 *
 * Returns postcodes with assignment status:
 * - assignment_status: 'unassigned' | 'full' | 'partial'
 * - sector_count: Total sectors in the district
 * - assigned_sector_count: Number of sectors assigned
 * - assigned_agent: Agent info if full assignment (sector_code IS NULL)
 *
 * Feature: 008-postcode-sector-territories
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get area filter from query params (e.g., ?area=TA to load only TA postcodes)
    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area');

    let query = supabase
      .from('postcodes')
      .select('code, area_km2');

    // Filter by area prefix if provided
    if (area) {
      query = query.ilike('code', `${area}%`);
    }

    const { data: postcodesRaw, error } = await query.order('code').limit(100);

    if (error) {
      throw new Error(error.message);
    }

    const districtCodes = postcodesRaw?.map((pc) => pc.code) || [];

    // Get sector counts for each district
    const { data: sectorCounts } = await supabase
      .from('postcode_sectors')
      .select('district_code')
      .in('district_code', districtCodes);

    const sectorCountMap: Record<string, number> = {};
    (sectorCounts || []).forEach((s) => {
      sectorCountMap[s.district_code] = (sectorCountMap[s.district_code] || 0) + 1;
    });

    // Get all assignments for these districts (both full and sector-level)
    const { data: assignments } = await supabase
      .from('agent_postcodes')
      .select(`
        postcode_code,
        sector_code,
        agent_id,
        agents!inner (
          id,
          subdomain,
          profiles (
            first_name,
            last_name
          )
        )
      `)
      .in('postcode_code', districtCodes);

    // Build assignment maps per district
    const districtAssignments: Record<string, {
      fullAgent: any;
      sectorAssignments: Set<string>;
    }> = {};

    (assignments || []).forEach((a) => {
      if (!districtAssignments[a.postcode_code]) {
        districtAssignments[a.postcode_code] = {
          fullAgent: null,
          sectorAssignments: new Set(),
        };
      }

      if (a.sector_code === null) {
        // Full district assignment
        districtAssignments[a.postcode_code].fullAgent = {
          id: a.agent_id,
          subdomain: (a.agents as any)?.subdomain,
          first_name: (a.agents as any)?.profiles?.first_name,
          last_name: (a.agents as any)?.profiles?.last_name,
        };
      } else {
        // Sector-level assignment
        districtAssignments[a.postcode_code].sectorAssignments.add(a.sector_code);
      }
    });

    // Get boundaries and calculate assignment status for each postcode
    const postcodes = await Promise.all((postcodesRaw || []).map(async (pc) => {
      const { data } = await supabase.rpc('get_postcode_geojson', { postcode_code: pc.code });

      const assignment = districtAssignments[pc.code];
      const sectorCount = sectorCountMap[pc.code] || 0;
      const assignedSectorCount = assignment?.sectorAssignments?.size || 0;

      let assignmentStatus: 'unassigned' | 'full' | 'partial' = 'unassigned';
      let assignedAgent = null;

      if (assignment?.fullAgent) {
        // Full district assignment takes precedence
        assignmentStatus = 'full';
        assignedAgent = assignment.fullAgent;
      } else if (assignedSectorCount > 0) {
        // Some sectors assigned
        assignmentStatus = 'partial';
      }

      return {
        code: pc.code,
        area_km2: pc.area_km2,
        boundary: data?.boundary || null,
        assignment_status: assignmentStatus,
        sector_count: sectorCount,
        assigned_sector_count: assignedSectorCount,
        assigned_agent: assignedAgent,
      };
    }));

    return NextResponse.json({ postcodes });
  } catch (error: any) {
    console.error('Error fetching postcodes:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
