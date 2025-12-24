import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getListingImages, getListingFloorplans, getListingEpc } from '@/lib/apex27/client';

/**
 * GET /api/public/properties/[slug]
 * Public endpoint to get a single property by slug
 * No authentication required - public data only
 * Fetches images from Apex27 API if not stored locally
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Property slug is required' } },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Query property directly by slug for efficient lookup
    // Falls back to title-based slug matching if slug column not populated
    const { data: property, error } = await supabase
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
        property_type,
        status,
        is_featured,
        address,
        postcode,
        location,
        images,
        features,
        floor_plan_url,
        virtual_tour_url,
        raw_data,
        created_at,
        updated_at,
        agent:agents!inner(
          id,
          subdomain,
          status,
          social_media_links,
          google_place_id,
          profile:profiles!agents_user_id_fkey(
            first_name,
            last_name,
            email,
            phone,
            avatar_url
          )
        )
      `
      )
      .eq('slug', slug)
      .eq('agent.status', 'active')
      .single();

    if (error) {
      // If not found by slug, could be legacy URL - try fallback
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Property not found' } },
          { status: 404 }
        );
      }
      console.error('Error fetching property:', error.message, error.code, error.details);
      return NextResponse.json(
        { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch property', details: error.message } },
        { status: 500 }
      );
    }

    if (!property) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Property not found' } },
        { status: 404 }
      );
    }

    // Fetch images from Apex27 API if not stored locally
    let images: { url: string; thumbnail: string | null; alt: string; order: number }[] = [];
    let floorplanUrl: string | null = property.floor_plan_url;
    let epcImages: { url: string; caption?: string }[] = [];

    if (property.apex27_id) {
      try {
        // Fetch images, floorplans, and EPC in parallel for better performance
        const [apex27Images, apex27Floorplans, apex27Epcs] = await Promise.all([
          getListingImages(property.apex27_id),
          floorplanUrl ? Promise.resolve([]) : getListingFloorplans(property.apex27_id),
          getListingEpc(property.apex27_id),
        ]);

        // Process images - include thumbnail URLs for gallery optimization
        images = apex27Images.map((img, index) => ({
          url: img.url,
          thumbnail: img.thumbnail || img.thumbnailUrl || null, // 320x240 thumbnail
          alt: img.caption || property.title,
          order: img.order ?? index,
        }));

        // Set floorplan if not already set
        if (!floorplanUrl && apex27Floorplans.length > 0) {
          floorplanUrl = apex27Floorplans[0].url;
        }

        // Process EPC images
        epcImages = apex27Epcs.map((epc) => ({
          url: epc.url,
          caption: epc.caption || undefined,
        }));
      } catch (imgError) {
        console.error('Error fetching images from Apex27:', imgError);
        // Continue with empty images - non-fatal error
      }
    }

    // Format the response with all detail fields
    const formattedProperty = formatPropertyDetail(property, images, floorplanUrl, epcImages);

    // Create response with CORS and aggressive caching headers
    // Cache for 5 minutes, serve stale for 1 hour while revalidating
    const response = NextResponse.json(formattedProperty);

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    response.headers.set('CDN-Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');

    return response;
  } catch (error: any) {
    console.error('GET /api/public/properties/[slug] error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}

/**
 * Format a property for the detail response
 */
function formatPropertyDetail(
  property: any,
  images: { url: string; thumbnail: string | null; alt: string; order: number }[] = [],
  floorplanUrl: string | null = null,
  epcImages: { url: string; caption?: string }[] = []
) {
  // Use stored slug or generate from title
  const slug = property.slug || property.title
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || property.id;

  // Extract address fields from JSONB
  const address = property.address || {};

  // Extract EPC data from raw_data if available
  const rawData = property.raw_data || {};

  // Extract coordinates from PostGIS location, fallback to Apex27 raw_data
  let latitude = null;
  let longitude = null;
  if (property.location?.coordinates) {
    longitude = property.location.coordinates[0];
    latitude = property.location.coordinates[1];
  } else if (rawData.latitude && rawData.longitude) {
    // Fallback to Apex27 coordinates from raw_data
    latitude = rawData.latitude;
    longitude = rawData.longitude;
  }
  const epc = extractEpcData(rawData);
  const utilities = extractUtilitiesData(rawData);
  const additionalDetails = extractAdditionalDetails(rawData);

  // Use passed images (from Apex27 API) or fallback to database
  const formattedImages = images.length > 0
    ? images
    : (property.images || []).map((img: any, index: number) => ({
        url: img.url || img,
        thumbnail: img.thumbnail || img.thumbnailUrl || null,
        alt: img.alt || property.title,
        order: img.order ?? index,
      }));

  // Get featured image
  const featuredImageUrl = formattedImages[0]?.url || null;

  // Use passed floorplan URL or fallback to database
  const finalFloorplanUrl = floorplanUrl || property.floor_plan_url;

  return {
    // Identifiers
    id: property.id,
    apex27_id: property.apex27_id,
    slug,

    // Core Details
    title: property.title,
    description: property.description,
    price: property.price,
    transaction_type: property.transaction_type === 'let' ? 'rental' : property.transaction_type,
    status: property.status,
    property_type: property.property_type,

    // Specifications
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    size_sqft: additionalDetails.size_sqft,
    tenure: additionalDetails.tenure,

    // Property Details Grid
    council_tax_band: additionalDetails.council_tax_band,
    parking: additionalDetails.parking,
    garden: additionalDetails.garden,
    accessibility: additionalDetails.accessibility,

    // Location
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

    // Media
    images: formattedImages,
    featured_image_url: featuredImageUrl,
    floorplan_url: finalFloorplanUrl,
    virtual_tour_url: property.virtual_tour_url,

    // Features
    features: property.features || [],

    // EPC Data
    epc,
    epc_images: epcImages,

    // Utilities
    utilities,

    // Agent Info
    agent: {
      id: property.agent?.id,
      name: `${property.agent?.profile?.first_name || ''} ${property.agent?.profile?.last_name || ''}`.trim(),
      email: property.agent?.profile?.email,
      phone: property.agent?.profile?.phone,
      avatar_url: property.agent?.profile?.avatar_url,
      subdomain: property.agent?.subdomain,
      microsite_url: `https://${property.agent?.subdomain}.nestassociates.co.uk`,
      social_media: property.agent?.social_media_links || null,
      google_place_id: property.agent?.google_place_id || null,
    },

    // URLs
    property_url: `https://${property.agent?.subdomain}.nestassociates.co.uk/properties/${slug}`,

    // Timestamps
    created_at: property.created_at,
    updated_at: property.updated_at,
  };
}

/**
 * Extract EPC data from raw Apex27 data
 * Apex27 uses: epcEeCurrent, epcEePotential (Energy Efficiency)
 *              epcEiCurrent, epcEiPotential (Environmental Impact)
 */
function extractEpcData(rawData: any): {
  current_rating: string | null;
  potential_rating: string | null;
  current_efficiency: number | null;
  potential_efficiency: number | null;
  current_environmental: number | null;
  potential_environmental: number | null;
} | null {
  // Apex27 field names for EPC - Energy Efficiency (Ee) and Environmental Impact (Ei)
  const currentEfficiency = rawData.epcEeCurrent || rawData.epc_current_efficiency || null;
  const potentialEfficiency = rawData.epcEePotential || rawData.epc_potential_efficiency || null;
  const currentEnvironmental = rawData.epcEiCurrent || rawData.epc_current_environmental || null;
  const potentialEnvironmental = rawData.epcEiPotential || rawData.epc_potential_environmental || null;

  // Derive rating from efficiency score (A-G bands)
  const getEpcRating = (score: number | null): string | null => {
    if (!score) return null;
    if (score >= 92) return 'A';
    if (score >= 81) return 'B';
    if (score >= 69) return 'C';
    if (score >= 55) return 'D';
    if (score >= 39) return 'E';
    if (score >= 21) return 'F';
    return 'G';
  };

  const currentRating = rawData.epcCurrentRating || getEpcRating(currentEfficiency);
  const potentialRating = rawData.epcPotentialRating || getEpcRating(potentialEfficiency);

  // Return null if no EPC data available
  if (!currentEfficiency && !potentialEfficiency && !currentEnvironmental) {
    return null;
  }

  return {
    current_rating: currentRating,
    potential_rating: potentialRating,
    current_efficiency: currentEfficiency ? parseInt(currentEfficiency) : null,
    potential_efficiency: potentialEfficiency ? parseInt(potentialEfficiency) : null,
    current_environmental: currentEnvironmental ? parseInt(currentEnvironmental) : null,
    potential_environmental: potentialEnvironmental ? parseInt(potentialEnvironmental) : null,
  };
}

/**
 * Extract utilities data from raw Apex27 data
 * Apex27 uses: heatingFeatures, waterSupplyFeatures, electricitySupplyFeatures,
 *              sewerageSupplyFeatures, broadbandSupplyFeatures (as arrays)
 */
function extractUtilitiesData(rawData: any): {
  electricity: string | null;
  water: string | null;
  sewerage: string | null;
  heating: string | null;
  broadband: string | null;
  mobile_coverage: string | null;
} | null {
  // Helper to convert array of features to string
  const arrayToString = (arr: any): string | null => {
    if (Array.isArray(arr) && arr.length > 0) {
      return arr.join(', ');
    }
    if (typeof arr === 'string' && arr) {
      return arr;
    }
    return null;
  };

  // Apex27 field names (arrays) with fallbacks to simple strings
  const electricity = arrayToString(rawData.electricitySupplyFeatures) || rawData.electricity || null;
  const water = arrayToString(rawData.waterSupplyFeatures) || rawData.water || null;
  const sewerage = arrayToString(rawData.sewerageSupplyFeatures) || rawData.sewerage || null;
  const heating = arrayToString(rawData.heatingFeatures) || rawData.heating || rawData.central_heating || null;
  const broadband = arrayToString(rawData.broadbandSupplyFeatures) || rawData.broadband || null;
  const mobileCoverage = rawData.mobile_coverage || rawData.mobileSignal || null;

  // Return null if no utilities data available
  if (!electricity && !water && !sewerage && !heating && !broadband && !mobileCoverage) {
    return null;
  }

  return {
    electricity,
    water,
    sewerage,
    heating,
    broadband,
    mobile_coverage: mobileCoverage,
  };
}

/**
 * Extract additional property details from raw Apex27 data
 */
function extractAdditionalDetails(rawData: any): {
  size_sqft: number | null;
  tenure: string | null;
  council_tax_band: string | null;
  parking: string | null;
  garden: string | null;
  accessibility: string | null;
} {
  // Determine parking value from Apex27 fields
  let parking = null;
  if (rawData.parkingSpaces && rawData.parkingSpaces > 0) {
    parking = `${rawData.parkingSpaces} space${rawData.parkingSpaces > 1 ? 's' : ''}`;
  } else if (rawData.parkingFeatures && rawData.parkingFeatures.length > 0) {
    parking = 'Yes';
  } else if (rawData.parking) {
    parking = rawData.parking;
  }

  // Determine garden value from Apex27 fields
  let garden = null;
  if (rawData.outsideSpaceFeatures && rawData.outsideSpaceFeatures.length > 0) {
    garden = 'Yes';
  } else if (rawData.garden) {
    garden = rawData.garden;
  }

  return {
    size_sqft: rawData.size_sqft || rawData.floorarea || rawData.floor_area || rawData.floorArea || null,
    tenure: rawData.tenure || rawData.tenureType || null,
    council_tax_band: rawData.councilTaxBand || rawData.council_tax_band || null,
    parking,
    garden,
    accessibility: rawData.accessibility || rawData.accessibilityFeatures || null,
  };
}

/**
 * OPTIONS /api/public/properties/[slug]
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
