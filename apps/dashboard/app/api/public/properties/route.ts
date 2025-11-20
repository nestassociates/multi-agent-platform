import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/public/properties
 * Public endpoint for WordPress site to search properties across all agents
 * No authentication required - public data only
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // T298: Parse query parameters
    const transactionType = searchParams.get('transaction_type'); // 'sale' or 'let'
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const bedrooms = searchParams.get('bedrooms');
    const postcode = searchParams.get('postcode');
    const location = searchParams.get('location');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const supabase = createServiceRoleClient();

    // Build query - only properties from active agents
    let query = supabase
      .from('properties')
      .select(
        `
        id,
        apex27_id,
        title,
        slug,
        description,
        transaction_type,
        price,
        bedrooms,
        bathrooms,
        status,
        is_featured,
        featured_image_url,
        address_line1,
        address_line2,
        town,
        county,
        postcode,
        latitude,
        longitude,
        created_at,
        updated_at,
        agent:agents!inner(
          id,
          subdomain,
          status,
          profile:profiles!agents_user_id_fkey(
            first_name,
            last_name,
            email,
            phone
          )
        )
      `
      )
      .eq('agent.status', 'active')
      .eq('status', 'available')
      .order('updated_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (transactionType && ['sale', 'let'].includes(transactionType)) {
      query = query.eq('transaction_type', transactionType);
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    if (bedrooms) {
      query = query.eq('bedrooms', parseInt(bedrooms));
    }

    if (postcode) {
      query = query.ilike('postcode', `${postcode}%`);
    }

    if (location) {
      query = query.or(`town.ilike.%${location}%,county.ilike.%${location}%`);
    }

    const { data: properties, error } = await query;

    if (error) {
      console.error('Error fetching public properties:', error);
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: 'Failed to fetch properties' } },
        { status: 500 }
      );
    }

    // T301: Format response with agent info and property link URL
    const formattedProperties = (properties || []).map((property: any) => ({
      id: property.id,
      apex27_id: property.apex27_id,
      title: property.title,
      slug: property.slug,
      description: property.description,
      transaction_type: property.transaction_type,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      status: property.status,
      is_featured: property.is_featured,
      featured_image_url: property.featured_image_url,
      address: {
        line1: property.address_line1,
        line2: property.address_line2,
        town: property.town,
        county: property.county,
        postcode: property.postcode,
      },
      location: {
        latitude: property.latitude,
        longitude: property.longitude,
      },
      agent: {
        id: property.agent?.id,
        name: `${property.agent?.profile?.first_name} ${property.agent?.profile?.last_name}`,
        email: property.agent?.profile?.email,
        phone: property.agent?.profile?.phone,
        subdomain: property.agent?.subdomain,
        microsite_url: `https://${property.agent?.subdomain}.agents.nestassociates.com`,
      },
      property_url: `https://${property.agent?.subdomain}.agents.nestassociates.com/properties/${property.slug}`,
      updated_at: property.updated_at,
    }));

    // Create response with CORS and caching headers
    const response = NextResponse.json(formattedProperties);

    // T299: CORS headers for WordPress domain
    response.headers.set('Access-Control-Allow-Origin', '*'); // Allow all origins for public API
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    // T300: 5-minute cache headers
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return response;
  } catch (error: any) {
    console.error('GET /api/public/properties error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/public/properties
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
