import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getListingImages } from '@/lib/apex27/client';
import { geocodeLocation, milesToMeters, metersToMiles } from '@/lib/geocoding';

/**
 * GET /api/public/properties
 * Public endpoint for WordPress site to search properties across all agents
 * No authentication required - public data only
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // T298: Parse query parameters
    const transactionType = searchParams.get('transaction_type'); // 'sale' or 'rental'
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const minBedrooms = searchParams.get('min_bedrooms');
    const maxBedrooms = searchParams.get('max_bedrooms');
    const bedrooms = searchParams.get('bedrooms'); // legacy single value
    const propertyType = searchParams.get('property_type');
    const status = searchParams.get('status');
    const postcode = searchParams.get('postcode');
    const location = searchParams.get('location');
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;
    const sort = searchParams.get('sort'); // price_asc, price_desc, date_asc, date_desc

    // Spatial search parameters - default to 5 mile radius
    const radiusMiles = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : 5;
    const providedLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const providedLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;

    const supabase = createServiceRoleClient();

    // Always use spatial search - geo-location based only
    let searchLat: number | null = null;
    let searchLng: number | null = null;
    let searchRadiusMeters: number | null = milesToMeters(radiusMiles);
    let geocodeSource: string | null = null;
    let geocodeDisplayName: string | null = null;

    // If lat/lng provided, use directly
    if (providedLat !== null && providedLng !== null) {
      searchLat = providedLat;
      searchLng = providedLng;
      geocodeSource = 'provided';
    }
    // Otherwise, geocode the location (required for geo-search)
    else if (location) {
      const geocodeResult = await geocodeLocation(location);
      if (geocodeResult) {
        searchLat = geocodeResult.lat;
        searchLng = geocodeResult.lng;
        geocodeSource = geocodeResult.source;
        geocodeDisplayName = geocodeResult.displayName || location;
      }
    }

    // If no valid coordinates, return empty results
    if (searchLat === null || searchLng === null) {
      return NextResponse.json({
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        search: {
          type: 'spatial',
          error: location ? 'Could not find location. Please try a postcode or place name.' : 'Please enter a location to search.',
        },
      });
    }

    // Variables for results
    let properties: any[] | null = null;
    let queryError: any = null;
    let total = 0;

    // Always use spatial search (geo-location based)
    {
      // Map transaction type for RPC
      const mappedTransactionType = transactionType === 'rental' ? 'let' : transactionType;

      // Determine min/max bedrooms
      const effectiveMinBedrooms = minBedrooms ? parseInt(minBedrooms) : (bedrooms ? parseInt(bedrooms) : null);
      const effectiveMaxBedrooms = maxBedrooms ? parseInt(maxBedrooms) : (bedrooms ? parseInt(bedrooms) : null);

      // Call spatial search RPC
      const { data: spatialData, error: spatialError } = await supabase.rpc(
        'search_properties_within_radius',
        {
          p_lng: searchLng,
          p_lat: searchLat,
          p_radius_meters: Math.round(searchRadiusMeters),
          p_transaction_type: mappedTransactionType || null,
          p_status: status || 'available',
          p_min_price: minPrice ? parseFloat(minPrice) : null,
          p_max_price: maxPrice ? parseFloat(maxPrice) : null,
          p_min_bedrooms: effectiveMinBedrooms,
          p_max_bedrooms: effectiveMaxBedrooms,
          p_property_type: propertyType || null,
          p_limit: limit,
          p_offset: offset,
        }
      );

      if (spatialError) {
        queryError = spatialError;
      } else {
        // Fetch agent details for each property (RPC doesn't join)
        const propertyIds = (spatialData || []).map((p: any) => p.id);

        if (propertyIds.length > 0) {
          const { data: agentData } = await supabase
            .from('properties')
            .select(`
              id,
              agent:agents(
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
            `)
            .in('id', propertyIds);

          const agentMap = new Map((agentData || []).map((p: any) => [p.id, p.agent]));

          // Merge agent data with spatial results
          properties = (spatialData || []).map((p: any) => ({
            ...p,
            location: p.location_lng && p.location_lat
              ? { coordinates: [p.location_lng, p.location_lat] }
              : null,
            agent: agentMap.get(p.id) || null,
            distance_meters: p.distance_meters,
          }));
        } else {
          properties = [];
        }
      }

      // Get count for pagination
      const { data: countData } = await supabase.rpc('count_properties_within_radius', {
        p_lng: searchLng,
        p_lat: searchLat,
        p_radius_meters: Math.round(searchRadiusMeters),
        p_transaction_type: mappedTransactionType || null,
        p_status: status || 'available',
        p_min_price: minPrice ? parseFloat(minPrice) : null,
        p_max_price: maxPrice ? parseFloat(maxPrice) : null,
        p_min_bedrooms: effectiveMinBedrooms,
        p_max_bedrooms: effectiveMaxBedrooms,
        p_property_type: propertyType || null,
      });

      total = countData || 0;
    }

    const error = queryError;

    if (error) {
      console.error('Error fetching public properties:', error);
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: 'Failed to fetch properties' } },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil(total / limit);

    // Fetch thumbnails from Apex27 in parallel for all properties
    const propertiesWithImages = properties || [];
    const imagePromises = propertiesWithImages.map(async (property: any) => {
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

    // T301: Format response with agent info and property link URL
    const formattedProperties = (properties || []).map((property: any) => {
      // Generate slug from title (kebab-case)
      const slug = property.title
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || property.id;

      // Extract address fields from JSONB
      const address = property.address || {};

      // Get thumbnail from Apex27 API (fetched in parallel above)
      const thumbnailUrl = imageMap.get(property.id) || null;

      // Extract coordinates from PostGIS location (if available)
      // PostGIS returns: {"type":"Point","coordinates":[lng,lat]}
      let latitude = null;
      let longitude = null;
      if (property.location?.coordinates) {
        longitude = property.location.coordinates[0];
        latitude = property.location.coordinates[1];
      }

      return {
        id: property.id,
        apex27_id: property.apex27_id,
        title: property.title,
        slug,
        description: property.description,
        transaction_type: property.transaction_type,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        property_type: property.property_type,
        status: property.status,
        is_featured: property.is_featured,
        featured_image_url: thumbnailUrl,
        features: property.features || [],
        address: {
          line1: address.line1 || '',
          line2: address.line2 || '',
          town: address.city || address.town || '',
          county: address.county || '',
          postcode: property.postcode || address.postcode || '',
        },
        location: {
          latitude,
          longitude,
        },
        agent: {
          id: property.agent?.id,
          name: `${property.agent?.profile?.first_name || ''} ${property.agent?.profile?.last_name || ''}`.trim(),
          email: property.agent?.profile?.email,
          phone: property.agent?.profile?.phone,
          subdomain: property.agent?.subdomain,
          microsite_url: `https://${property.agent?.subdomain}.nestassociates.co.uk`,
        },
        property_url: `https://${property.agent?.subdomain}.nestassociates.co.uk/properties/${slug}`,
        updated_at: property.updated_at,
        // Always include distance for spatial search
        ...(property.distance_meters !== undefined && {
          distance_miles: metersToMiles(property.distance_meters),
          distance_meters: property.distance_meters,
        }),
      };
    });

    // Sort results by price (default: highest first)
    if (sort === 'price_asc') {
      formattedProperties.sort((a, b) => a.price - b.price);
    } else if (sort === 'date_asc') {
      formattedProperties.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    } else if (sort === 'date_desc') {
      formattedProperties.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } else {
      // Default: price_desc (most expensive first)
      formattedProperties.sort((a, b) => b.price - a.price);
    }

    // Build response object
    const responseData: any = {
      data: formattedProperties,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    // Add search metadata (always spatial search now)
    responseData.search = {
      type: 'spatial',
      center: {
        latitude: searchLat,
        longitude: searchLng,
      },
      radius_miles: radiusMiles,
      geocode_source: geocodeSource,
      geocode_display_name: geocodeDisplayName,
    };

    // Create response with pagination info, CORS and caching headers
    const response = NextResponse.json(responseData);

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
