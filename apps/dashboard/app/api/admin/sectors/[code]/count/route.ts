export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { sectorCodeSchema } from '@nest/validation';

// Cache TTL: 1 year in milliseconds
const CACHE_TTL_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * GET /api/admin/sectors/{code}/count
 * Get property count for a specific sector
 *
 * Feature: 008-postcode-sector-territories
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { code } = await params;

    // Decode URL-encoded sector code (e.g., "TA1%201" -> "TA1 1")
    const sectorCode = decodeURIComponent(code);

    // Validate sector code format
    const validationResult = sectorCodeSchema.safeParse(sectorCode);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid sector code format',
            details: validationResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Check cache first
    const { data: cached, error: cacheError } = await supabase
      .from('sector_property_counts')
      .select('total_count, residential_count, commercial_count, mixed_count, cached_at')
      .eq('sector_code', sectorCode)
      .maybeSingle();

    if (cacheError) {
      console.error('Cache lookup error:', cacheError);
    }

    // Check if cache is valid (less than 1 year old)
    if (cached?.cached_at) {
      const cacheAge = Date.now() - new Date(cached.cached_at).getTime();
      if (cacheAge < CACHE_TTL_MS) {
        return NextResponse.json({
          sector: sectorCode,
          count: cached.total_count,
          residential: cached.residential_count,
          commercial: cached.commercial_count,
          mixed: cached.mixed_count,
          cached: true,
          cached_at: cached.cached_at,
        });
      }
    }

    // Fetch from OS Data Hub API
    const osApiKey = process.env.OS_DATA_HUB_API_KEY;
    if (!osApiKey) {
      console.warn('OS Data Hub API key not configured');
      return NextResponse.json({
        sector: sectorCode,
        count: 0,
        cached: false,
        error: 'Property count service not configured',
      });
    }

    // Call OS Data Hub Places API with postcode filter
    // The postcode parameter accepts sector-level prefixes
    const encodedSector = encodeURIComponent(sectorCode);
    const osUrl = `https://api.os.uk/search/places/v1/postcode?postcode=${encodedSector}&dataset=DPA&maxresults=1&key=${osApiKey}`;

    let totalCount = 0;
    let residentialCount = 0;
    let commercialCount = 0;
    let mixedCount = 0;

    try {
      // Get total count from header
      const response = await fetch(osUrl);

      if (response.ok) {
        const data = await response.json();
        totalCount = data.header?.totalresults || 0;

        // For breakdown, we need additional queries
        // Residential: CLASSIFICATION_CODE starts with R
        const resUrl = `${osUrl}&fq=CLASSIFICATION_CODE:R*`;
        const resResponse = await fetch(resUrl);
        if (resResponse.ok) {
          const resData = await resResponse.json();
          residentialCount = resData.header?.totalresults || 0;
        }

        // Commercial: CLASSIFICATION_CODE starts with C
        const comUrl = `${osUrl}&fq=CLASSIFICATION_CODE:C*`;
        const comResponse = await fetch(comUrl);
        if (comResponse.ok) {
          const comData = await comResponse.json();
          commercialCount = comData.header?.totalresults || 0;
        }

        // Mixed: Calculate remainder
        mixedCount = Math.max(0, totalCount - residentialCount - commercialCount);
      }
    } catch (osError: any) {
      console.error('OS Data Hub API error:', osError);
      // Continue with zero count - non-fatal
    }

    // Update cache
    const { error: upsertError } = await supabase
      .from('sector_property_counts')
      .upsert(
        {
          sector_code: sectorCode,
          total_count: totalCount,
          residential_count: residentialCount,
          commercial_count: commercialCount,
          mixed_count: mixedCount,
          cached_at: new Date().toISOString(),
        },
        { onConflict: 'sector_code' }
      );

    if (upsertError) {
      console.error('Cache update error:', upsertError);
      // Non-fatal - continue with response
    }

    return NextResponse.json({
      sector: sectorCode,
      count: totalCount,
      residential: residentialCount,
      commercial: commercialCount,
      mixed: mixedCount,
      cached: false,
    });
  } catch (error: any) {
    console.error('GET /api/admin/sectors/[code]/count error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
