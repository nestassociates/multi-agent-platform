export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';

/**
 * GET /api/admin/postcodes/list
 * Fetch postcodes filtered by area prefix
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

    // Get boundaries for the filtered postcodes
    const postcodes = await Promise.all((postcodesRaw || []).map(async (pc) => {
      const { data } = await supabase.rpc('get_postcode_geojson', { postcode_code: pc.code });
      return {
        code: pc.code,
        area_km2: pc.area_km2,
        boundary: data?.boundary || null,
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
