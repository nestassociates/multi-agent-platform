export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { sectorCodeSchema } from '@nest/validation';

// Cache TTL: 30 days in milliseconds
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * GET /api/admin/sectors/{code}/count
 * Get property count for a specific sector from OS Data Hub API (with caching)
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
      .select('total_count, cached_at')
      .eq('sector_code', sectorCode)
      .maybeSingle();

    if (cacheError) {
      console.error('Cache lookup error:', cacheError);
    }

    // Check if cache is valid (less than 30 days old)
    if (cached?.cached_at) {
      const cacheAge = Date.now() - new Date(cached.cached_at).getTime();
      if (cacheAge < CACHE_TTL_MS) {
        return NextResponse.json({
          sector: sectorCode,
          count: cached.total_count || 0,
          cached: true,
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
        error: 'Property count service not configured',
      });
    }

    // Call OS Data Hub Places API - just get total count (1 request, not 3)
    const encodedSector = encodeURIComponent(sectorCode);
    const osUrl = `https://api.os.uk/search/places/v1/postcode?postcode=${encodedSector}&dataset=DPA&maxresults=1&key=${osApiKey}`;

    let totalCount = 0;

    try {
      // Add 10 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(osUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        totalCount = data.header?.totalresults || 0;
      }
    } catch (osError: any) {
      if (osError.name === 'AbortError') {
        console.error('OS Data Hub API timeout for sector:', sectorCode);
      } else {
        console.error('OS Data Hub API error:', osError);
      }
      // Return cached value if available, even if expired
      if (cached?.total_count) {
        return NextResponse.json({
          sector: sectorCode,
          count: cached.total_count,
          cached: true,
          stale: true,
        });
      }
    }

    // Update cache if we got a result
    if (totalCount > 0) {
      const { error: upsertError } = await supabase
        .from('sector_property_counts')
        .upsert(
          {
            sector_code: sectorCode,
            total_count: totalCount,
            cached_at: new Date().toISOString(),
          },
          { onConflict: 'sector_code' }
        );

      if (upsertError) {
        console.error('Cache update error:', upsertError);
      }
    }

    return NextResponse.json({
      sector: sectorCode,
      count: totalCount,
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
