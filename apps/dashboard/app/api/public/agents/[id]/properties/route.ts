import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getListingImages } from '@/lib/apex27/client';

/**
 * T013-T017: GET /api/public/agents/[id]/properties
 * Public endpoint for agent microsites to fetch property listings client-side
 * Returns all available properties for a specific agent with cursor pagination
 * No authentication required - public data only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const { searchParams } = new URL(request.url);

    // T014: Validate agent ID is UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(agentId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMS', message: 'Invalid agent ID format' } },
        { status: 400 }
      );
    }

    // Parse query parameters
    const marketingType = searchParams.get('marketing_type') || 'all';
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '12'), 1), 50);

    // T015: Validate marketing_type filter
    if (!['sale', 'rent', 'all'].includes(marketingType)) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMS', message: "Invalid marketing_type. Must be 'sale', 'rent', or 'all'" } },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // T014: Check agent exists and is active
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, subdomain, status')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found or inactive' } },
        { status: 404 }
      );
    }

    if (agent.status !== 'active') {
      return NextResponse.json(
        { error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found or inactive' } },
        { status: 404 }
      );
    }

    // T015: Build property query with marketing_type filter
    let query = supabase
      .from('properties')
      .select(
        `
        id,
        apex27_id,
        title,
        description,
        transaction_type,
        price,
        bedrooms,
        bathrooms,
        property_type,
        address,
        postcode,
        images,
        features,
        status,
        is_featured,
        is_hidden,
        created_at
      `,
        { count: 'exact' }
      )
      .eq('agent_id', agentId)
      .eq('status', 'available')
      .eq('is_hidden', false);

    // Apply marketing type filter (mapping rent -> let for transaction_type)
    if (marketingType === 'sale') {
      query = query.eq('transaction_type', 'sale');
    } else if (marketingType === 'rent') {
      query = query.eq('transaction_type', 'let');
    }
    // 'all' returns both sale and let

    // T016: Apply cursor-based pagination
    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
        const { created_at, id } = decoded;

        // Get items created before the cursor, or same time but with smaller ID
        query = query.or(
          `created_at.lt.${created_at},and(created_at.eq.${created_at},id.lt.${id})`
        );
      } catch (e) {
        return NextResponse.json(
          { error: { code: 'INVALID_PARAMS', message: 'Invalid cursor format' } },
          { status: 400 }
        );
      }
    }

    // Order by created_at DESC, id DESC for stable pagination
    query = query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check if there's a next page

    const { data: properties, error: propertiesError, count } = await query;

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: 'Failed to fetch properties' } },
        { status: 500 }
      );
    }

    // Check if there's a next page
    const hasNextPage = (properties?.length || 0) > limit;
    const results = hasNextPage ? properties?.slice(0, limit) : properties;

    // Fetch thumbnails from Apex27 in parallel for all properties
    const imagePromises = (results || []).map(async (property: any) => {
      if (!property.apex27_id) return { id: property.id, thumbnail: null };
      try {
        const images = await getListingImages(property.apex27_id);
        const firstImage = images[0];
        return {
          id: property.id,
          thumbnail: firstImage?.thumbnail || firstImage?.thumbnailUrl || firstImage?.url || null,
        };
      } catch {
        return { id: property.id, thumbnail: null };
      }
    });

    const imageResults = await Promise.all(imagePromises);
    const imageMap = new Map(imageResults.map((r) => [r.id, r.thumbnail]));

    // Generate next cursor if there are more results
    let nextCursor: string | null = null;
    if (hasNextPage && results && results.length > 0) {
      const lastItem = results[results.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({
          id: lastItem.id,
          created_at: lastItem.created_at,
        })
      ).toString('base64');
    }

    // Format response
    const formattedProperties = (results || []).map((property: any) => {
      // Generate slug from title
      const slug = property.title
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || property.id;

      // Extract address from JSONB
      const address = property.address || {};

      return {
        id: property.id,
        apex27_id: property.apex27_id,
        slug,
        title: property.title,
        transaction_type: property.transaction_type === 'let' ? 'rental' : property.transaction_type,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        property_type: property.property_type,
        status: property.status,
        featured_image_url: imageMap.get(property.id) || null,
        address: {
          town: address.city || address.town || '',
          postcode: property.postcode || address.postcode || '',
        },
        property_url: `/property/${slug}`,
      };
    });

    // T017: Create response with Cache-Control headers and ETag
    const responseData = {
      data: formattedProperties,
      pagination: {
        nextCursor,
        hasNextPage,
        total: count || 0,
      },
    };

    const response = NextResponse.json(responseData);

    // CORS headers for agent microsites
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    // T017: Cache headers - 5 minute cache
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600');

    // T017: ETag support for conditional requests
    const etag = `"${Buffer.from(JSON.stringify(responseData)).toString('base64').substring(0, 32)}"`;
    response.headers.set('ETag', etag);

    return response;
  } catch (error: any) {
    console.error('GET /api/public/agents/[id]/properties error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/public/agents/[id]/properties
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
