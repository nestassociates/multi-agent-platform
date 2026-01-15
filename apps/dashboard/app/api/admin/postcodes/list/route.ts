export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';

/**
 * GET /api/admin/postcodes/list
 * Fetch SECTORS filtered by area prefix (simplified from districts)
 *
 * Returns sectors with assignment status for the given area.
 * Example: ?area=TA returns all sectors like TA1 1, TA1 2, TA2 1, etc.
 *
 * Simplified from Feature 008: Now returns sectors directly, no district layer
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

    // Get area filter from query params (e.g., ?area=TA to load only TA sectors)
    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area');

    if (!area) {
      return NextResponse.json(
        { error: 'Area parameter is required (e.g., ?area=TA)' },
        { status: 400 }
      );
    }

    // Query sectors table filtered by area prefix
    // This will return all sectors like TA1 1, TA1 2, TA2 1, etc. for area=TA
    const { data: sectorsRaw, error } = await supabase
      .from('postcode_sectors')
      .select('code, district_code, area_km2')
      .ilike('code', `${area}%`)
      .order('code')
      .limit(500); // Sectors can be numerous, set reasonable limit

    if (error) {
      throw new Error(error.message);
    }

    if (!sectorsRaw || sectorsRaw.length === 0) {
      return NextResponse.json({
        sectors: [],
        area,
        message: 'No sector data available for this area',
      });
    }

    const sectorCodes = sectorsRaw.map((s) => s.code);

    // Get all assignments for these sectors
    const { data: assignments } = await supabase
      .from('agent_postcodes')
      .select(`
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
      .in('sector_code', sectorCodes);

    // Build assignment lookup by sector code
    const assignmentMap: Record<string, {
      id: string;
      subdomain: string;
      first_name: string | null;
      last_name: string | null;
    }> = {};

    if (assignments) {
      for (const a of assignments) {
        if (a.sector_code && a.agents) {
          assignmentMap[a.sector_code] = {
            id: (a.agents as any).id,
            subdomain: (a.agents as any).subdomain,
            first_name: (a.agents as any).profiles?.first_name || null,
            last_name: (a.agents as any).profiles?.last_name || null,
          };
        }
      }
    }

    // Get boundaries and combine with assignment info
    const sectors = await Promise.all(sectorsRaw.map(async (sector) => {
      const { data: geoData } = await supabase.rpc('get_sector_geojson', {
        sector_code_param: sector.code,
      });

      const assignedAgent = assignmentMap[sector.code] || null;

      return {
        code: sector.code,
        district_code: sector.district_code,
        area_km2: sector.area_km2,
        boundary: geoData?.boundary || null,
        center_point: geoData?.center_point || null,
        assigned_agent: assignedAgent,
      };
    }));

    return NextResponse.json({
      sectors,
      area,
      count: sectors.length,
    });
  } catch (error: any) {
    console.error('Error fetching sectors:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
