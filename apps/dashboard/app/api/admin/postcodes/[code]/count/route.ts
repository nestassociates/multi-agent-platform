import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const postcodeCode = params.code;

    // Check cache first
    const supabase = createServiceRoleClient();
    const { data: cached } = await supabase
      .from('postcode_property_counts')
      .select('*')
      .eq('postcode_code', postcodeCode)
      .single();

    // If cached and less than 1 year old, return it
    if (cached) {
      const cacheAge = Date.now() - new Date(cached.cached_at).getTime();
      const CACHE_TTL = 365 * 24 * 60 * 60 * 1000; // 1 year

      if (cacheAge < CACHE_TTL) {
        return NextResponse.json({
          count: cached.residential_count,
          cached: true,
          postcode: postcodeCode,
        });
      }
    }

    // Fetch from OS Places API
    // Use the "find" endpoint with quoted search to get exact district match
    // This prevents "TA1" from matching "TA10", "TA11", etc.
    const OS_API_KEY = process.env.OS_DATA_HUB_API_KEY;

    // Quote the district code with a trailing space for exact matching
    const searchQuery = `"${postcodeCode} "`;
    const url = `https://api.os.uk/search/places/v1/find?query=${encodeURIComponent(searchQuery)}&key=${OS_API_KEY}&dataset=DPA&fq=CLASSIFICATION_CODE:R*&maxresults=1`;

    const response = await fetch(url);
    const data = await response.json();

    const count = data.header?.totalresults || 0;

    // Cache the result
    await supabase
      .from('postcode_property_counts')
      .upsert({
        postcode_code: postcodeCode,
        residential_count: count,
        commercial_count: 0,
        mixed_count: 0,
        total_count: count,
        cached_at: new Date().toISOString(),
      });

    return NextResponse.json({
      count,
      cached: false,
      postcode: postcodeCode,
    });

  } catch (error: any) {
    console.error('Error counting properties:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
