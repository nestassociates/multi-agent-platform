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

    // Spatial search parameters
    const radiusMiles = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : null;
    const providedLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const providedLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;

    const supabase = createServiceRoleClient();

    // Determine if we should use spatial search
    let useSpatialSearch = false;
    let searchLat: number | null = null;
    let searchLng: number | null = null;
    let searchRadiusMeters: number | null = null;
    let geocodeSource: string | null = null;
    let geocodeDisplayName: string | null = null;

    // If lat/lng provided, use directly
    if (providedLat !== null && providedLng !== null && radiusMiles !== null) {
      useSpatialSearch = true;
      searchLat = providedLat;
      searchLng = providedLng;
      searchRadiusMeters = milesToMeters(radiusMiles);
      geocodeSource = 'provided';
    }
    // Otherwise, try to geocode the location if radius is specified
    else if (location && radiusMiles !== null) {
      const geocodeResult = await geocodeLocation(location);
      if (geocodeResult) {
        useSpatialSearch = true;
        searchLat = geocodeResult.lat;
        searchLng = geocodeResult.lng;
        searchRadiusMeters = milesToMeters(radiusMiles);
        geocodeSource = geocodeResult.source;
        geocodeDisplayName = geocodeResult.displayName || location;
      }
    }

    // Variables for results
    let properties: any[] | null = null;
    let queryError: any = null;
    let total = 0;

    // Use spatial search if we have coordinates and radius
    if (useSpatialSearch && searchLat !== null && searchLng !== null && searchRadiusMeters !== null) {
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
    } else {
      // Fall back to standard query (text-based search)

      // Build query - only properties from active agents
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
          status,
          is_featured,
          address,
          postcode,
          location,
          images,
          features,
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
        .eq('agent.status', 'active');

      // Apply sorting
      if (sort === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (sort === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else if (sort === 'date_asc') {
        query = query.order('updated_at', { ascending: true });
      } else {
        // Default: date_desc (newest first)
        query = query.order('updated_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      // Filter by status (default to 'available' if not specified)
      // Use 'all' to include all statuses (available, sold, under_offer, let, let_agreed)
      if (status && status !== 'all') {
        query = query.eq('status', status);
      } else if (!status) {
        // Default to available only
        query = query.eq('status', 'available');
      }
      // If status === 'all', don't filter by status at all

      // Apply filters
      if (transactionType) {
        // Map 'rental' to 'let' for backwards compatibility
        const mappedType = transactionType === 'rental' ? 'let' : transactionType;
        if (['sale', 'let'].includes(mappedType)) {
          query = query.eq('transaction_type', mappedType);
        }
      }

      if (minPrice) {
        query = query.gte('price', parseFloat(minPrice));
      }

      if (maxPrice) {
        query = query.lte('price', parseFloat(maxPrice));
      }

      // Bedrooms filter - support min/max range or exact match
      if (minBedrooms) {
        query = query.gte('bedrooms', parseInt(minBedrooms));
      }
      if (maxBedrooms) {
        query = query.lte('bedrooms', parseInt(maxBedrooms));
      }
      if (bedrooms && !minBedrooms && !maxBedrooms) {
        // Legacy single value filter
        query = query.eq('bedrooms', parseInt(bedrooms));
      }

      // Property type filter (case-insensitive, partial match)
      if (propertyType) {
        query = query.ilike('property_type', `%${propertyType}%`);
      }

      if (postcode) {
        query = query.ilike('postcode', `${postcode}%`);
      }

      if (location) {
        // Search in title, postcode, or JSONB address fields
        // Note: For JSONB, use address->key (single arrow returns JSONB, ->> returns text)
        // PostgREST syntax requires escaping special characters
        const searchTerm = `%${location}%`;
        query = query.or(
          `title.ilike.${searchTerm},postcode.ilike.${searchTerm},address->>city.ilike.${searchTerm},address->>town.ilike.${searchTerm},address->>county.ilike.${searchTerm}`
        );
      }

      const { data, error } = await query;
      properties = data;
      queryError = error;

      // Get total count for pagination (separate query without pagination)
      let countQuery = supabase
        .from('properties')
        .select('id, agent:agents!inner(status)', { count: 'exact', head: true })
        .eq('agent.status', 'active');

      // Re-apply same filters for count
      if (status && status !== 'all') {
        countQuery = countQuery.eq('status', status);
      } else if (!status) {
        countQuery = countQuery.eq('status', 'available');
      }
      // If status === 'all', don't filter by status
      if (transactionType) {
        const mappedType = transactionType === 'rental' ? 'let' : transactionType;
        if (['sale', 'let'].includes(mappedType)) {
          countQuery = countQuery.eq('transaction_type', mappedType);
        }
      }
      if (minPrice) countQuery = countQuery.gte('price', parseFloat(minPrice));
      if (maxPrice) countQuery = countQuery.lte('price', parseFloat(maxPrice));
      if (minBedrooms) countQuery = countQuery.gte('bedrooms', parseInt(minBedrooms));
      if (maxBedrooms) countQuery = countQuery.lte('bedrooms', parseInt(maxBedrooms));
      if (bedrooms && !minBedrooms && !maxBedrooms) countQuery = countQuery.eq('bedrooms', parseInt(bedrooms));
      if (propertyType) countQuery = countQuery.ilike('property_type', `%${propertyType}%`);
      if (postcode) countQuery = countQuery.ilike('postcode', `${postcode}%`);
      if (location) {
        const searchTerm = `%${location}%`;
        countQuery = countQuery.or(
          `title.ilike.${searchTerm},postcode.ilike.${searchTerm},address->>city.ilike.${searchTerm},address->>town.ilike.${searchTerm},address->>county.ilike.${searchTerm}`
        );
      }

      const { count: totalCount } = await countQuery;
      total = totalCount || 0;
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
        // Include distance when using spatial search
        ...(useSpatialSearch && property.distance_meters !== undefined && {
          distance_miles: metersToMiles(property.distance_meters),
          distance_meters: property.distance_meters,
        }),
      };
    });

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

    // Add search metadata when using spatial search
    if (useSpatialSearch && searchLat !== null && searchLng !== null && radiusMiles !== null) {
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
    }

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
