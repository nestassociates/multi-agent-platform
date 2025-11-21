/**
 * OS Data Hub API Client
 *
 * Query residential property counts and data within geographic boundaries
 * Uses OS Places API Radius endpoint (Polygon endpoint requires BNG coordinates)
 */

import proj4 from 'proj4';

const OS_API_KEY = process.env.OS_DATA_HUB_API_KEY || '';
const OS_PLACES_POLYGON_URL = 'https://api.os.uk/search/places/v1/polygon';
const OS_PLACES_RADIUS_URL = 'https://api.os.uk/search/places/v1/radius';

// Define coordinate systems for conversion
// WGS84 (GPS coordinates) - EPSG:4326
const WGS84 = 'EPSG:4326';
// British National Grid - EPSG:27700
const BNG = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs';

/**
 * Convert WGS84 (lat/lng) coordinates to British National Grid (BNG)
 * @param lng - Longitude
 * @param lat - Latitude
 * @returns [easting, northing] in meters
 */
function wgs84ToBNG(lng: number, lat: number): [number, number] {
  const [easting, northing] = proj4(WGS84, BNG, [lng, lat]);
  return [easting, northing];
}

interface PropertyCountResult {
  count: number;
  error?: string;
  details?: {
    residential: number;
    commercial: number;
    mixed: number;
    other: number;
  };
  metadata?: {
    areaKm2: number;
    radiusMeters: number;
    centerPoint: [number, number];
    postcodes?: string[];
  };
}

interface PropertyData {
  residential_count: number;
  commercial_count: number;
  mixed_count: number;
  other_count: number;
  total_count: number;
  addresses: any[];
}

/**
 * Count residential properties within a polygon boundary
 * Uses OS Places API Radius endpoint (Polygon endpoint not available on all plans)
 * Approximates polygon area with radius search from center point
 * @param polygon - GeoJSON polygon geometry
 * @returns Property count with breakdown by type
 */
export async function countPropertiesInBoundary(polygon: any): Promise<PropertyCountResult> {
  try {
    if (!OS_API_KEY) {
      console.warn('OS Data Hub API key not configured');
      return { count: 0, error: 'API key not configured' };
    }

    // Calculate polygon center and approximate radius
    const center = getPolygonCenter(polygon);
    const area = calculatePolygonArea(polygon);
    // Approximate radius: r = sqrt(area / π)
    const radiusKm = Math.sqrt(area / Math.PI);
    const radiusMeters = Math.min(Math.round(radiusKm * 1000), 1000); // Max 1000m per API limit

    console.log('📍 Polygon approximation:', {
      center,
      areaKm2: area.toFixed(3),
      radiusMeters,
    });

    // Query for residential properties (with pagination to get more postcodes)
    const residentialData = await queryOSPlacesRadius(center, radiusMeters, 100, 'R*', true);

    // Query for commercial properties (with pagination for postcodes)
    const commercialData = await queryOSPlacesRadius(center, radiusMeters, 100, 'C*', true);

    // Query for mixed use properties (with pagination for postcodes)
    const mixedData = await queryOSPlacesRadius(center, radiusMeters, 100, 'M*', true);

    if (!residentialData) {
      return { count: 0, error: 'Failed to fetch data' };
    }

    const residentialCount = residentialData.total_count || 0;
    const commercialCount = commercialData?.total_count || 0;
    const mixedCount = mixedData?.total_count || 0;

    // Extract unique postcode districts (e.g., "M15", "M16") from residential data
    // We only get first 100 addresses, so we'll also query with larger maxResults to get more variety
    const postcodeDistricts = new Set<string>();

    // Collect postcodes from the initial residential query
    residentialData.addresses.forEach((address: any) => {
      const postcode = address.DPA?.POSTCODE || address.LPI?.POSTCODE_LOCATOR;
      if (postcode) {
        // Extract district (before the space) - e.g., "M15 6LE" -> "M15"
        const district = postcode.split(' ')[0];
        postcodeDistricts.add(district);
      }
    });

    // Also collect from commercial and mixed data
    commercialData?.addresses.forEach((address: any) => {
      const postcode = address.DPA?.POSTCODE || address.LPI?.POSTCODE_LOCATOR;
      if (postcode) {
        const district = postcode.split(' ')[0];
        postcodeDistricts.add(district);
      }
    });

    mixedData?.addresses.forEach((address: any) => {
      const postcode = address.DPA?.POSTCODE || address.LPI?.POSTCODE_LOCATOR;
      if (postcode) {
        const district = postcode.split(' ')[0];
        postcodeDistricts.add(district);
      }
    });

    const postcodeList = Array.from(postcodeDistricts).sort();

    console.log('📊 Complete property breakdown:', {
      residential: residentialCount,
      commercial: commercialCount,
      mixed: mixedCount,
      total: residentialCount + commercialCount + mixedCount,
      uniquePostcodes: postcodeList.length,
    });

    // Return the counts from the radius queries
    return {
      count: residentialCount,
      details: {
        residential: residentialCount,
        commercial: commercialCount,
        mixed: mixedCount,
        other: 0,
      },
      metadata: {
        areaKm2: area,
        radiusMeters,
        centerPoint: center,
        postcodes: postcodeList,
      },
    };
  } catch (error: any) {
    console.error('Error querying OS Data Hub:', error);
    return { count: 0, error: error.message };
  }
}

/**
 * Query OS Places API with radius (center point + distance)
 * @param center - Center point [lng, lat]
 * @param radiusMeters - Search radius in meters (max 1000)
 * @param maxResults - Max results per request (1-100)
 * @param classificationFilter - Classification code filter (e.g., 'R*' for residential, 'C*' for commercial)
 * @param getAllForPostcodes - If true, paginate to get ALL results for postcode extraction
 * @returns Property data
 */
async function queryOSPlacesRadius(
  center: [number, number],
  radiusMeters: number,
  maxResults: number = 100,
  classificationFilter: string = 'R*',
  getAllForPostcodes: boolean = false
): Promise<PropertyData | null> {
  try {
    const [lng, lat] = center;

    // Convert WGS84 to British National Grid
    const [easting, northing] = wgs84ToBNG(lng, lat);
    const point = `${easting.toFixed(2)},${northing.toFixed(2)}`;

    console.log(`📍 Querying OS Places API with radius (filter: ${classificationFilter}):`, {
      centerWGS84: `${lng},${lat}`,
      centerBNG: point,
      radiusMeters,
      pagination: getAllForPostcodes ? 'ALL results' : 'First 100 only',
    });

    // If we need all results for postcode extraction, paginate
    let allAddresses: any[] = [];
    let totalCount = 0;
    let offset = 0;

    if (getAllForPostcodes) {
      // Make multiple requests to get all addresses (for postcode diversity)
      // Limit to 5 requests max (500 addresses) to avoid excessive API calls
      const maxRequests = 5;
      let requestCount = 0;

      while (requestCount < maxRequests) {
        const url = `${OS_PLACES_RADIUS_URL}?key=${OS_API_KEY}&point=${point}&radius=${radiusMeters}&dataset=DPA,LPI&maxresults=100&offset=${offset}&fq=CLASSIFICATION_CODE:${classificationFilter}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          console.error('❌ OS Places Radius API error at offset', offset);
          break;
        }

        const data = await response.json();
        const addresses = data.results || [];
        totalCount = data.header?.totalresults || 0;

        allAddresses = allAddresses.concat(addresses);

        console.log(`📍 Fetched page ${requestCount + 1}: ${addresses.length} addresses (total: ${totalCount})`);

        // Stop if we got fewer than 100 (no more results)
        if (addresses.length < 100 || allAddresses.length >= totalCount) {
          break;
        }

        offset += 100;
        requestCount++;
      }

      console.log(`✅ Collected ${allAddresses.length} of ${totalCount} total addresses for postcode extraction`);

      return {
        residential_count: totalCount,
        commercial_count: 0,
        mixed_count: 0,
        other_count: 0,
        total_count: totalCount,
        addresses: allAddresses,
      };
    }

    // Single request for count only (original behavior)
    const url = `${OS_PLACES_RADIUS_URL}?key=${OS_API_KEY}&point=${point}&radius=${radiusMeters}&dataset=DPA,LPI&maxresults=${maxResults}&fq=CLASSIFICATION_CODE:${classificationFilter}`;
    console.log('📍 Radius API URL:', url.replace(OS_API_KEY, 'KEY_HIDDEN'));

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('📍 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ OS Places Radius API error:', error);
      return null;
    }

    const data = await response.json();
    console.log('✅ OS Places Radius API response:', {
      totalResults: data.header?.totalresults,
      returnedResults: data.results?.length || 0,
    });

    // Extract results
    const addresses = data.results || [];
    const header = data.header || {};

    const totalResidential = header.totalresults || 0;

    const result = {
      residential_count: totalResidential,
      commercial_count: 0,
      mixed_count: 0,
      other_count: 0,
      total_count: totalResidential,
      addresses,
    };

    console.log('📊 Property breakdown:', {
      residential: result.residential_count,
      commercial: result.commercial_count,
      total: result.total_count,
      note: `Showing ${addresses.length} of ${totalResidential} results`,
    });

    return result;
  } catch (error: any) {
    console.error('❌ Error in queryOSPlacesRadius:', error);
    return null;
  }
}

/**
 * Convert GeoJSON polygon to WKT coordinate string
 * @param polygon - GeoJSON Polygon geometry
 * @returns WKT coordinate string (space-separated lng,lat pairs)
 */
function geojsonToWKT(polygon: any): string {
  if (!polygon || polygon.type !== 'Polygon') {
    throw new Error('Invalid polygon geometry');
  }

  // Get exterior ring (first array of coordinates)
  const coordinates = polygon.coordinates[0];

  // Convert to WKT format: "lng,lat lng,lat lng,lat"
  const wktCoords = coordinates
    .map((coord: [number, number]) => `${coord[0]},${coord[1]}`)
    .join(' ');

  return wktCoords;
}

/**
 * Validate polygon for OS Data Hub query
 * @param polygon - GeoJSON Polygon geometry
 * @returns Validation result
 */
export function validatePolygon(polygon: any): { valid: boolean; error?: string } {
  if (!polygon) {
    return { valid: false, error: 'No polygon provided' };
  }

  if (polygon.type !== 'Polygon') {
    return { valid: false, error: 'Geometry must be a Polygon' };
  }

  if (!polygon.coordinates || polygon.coordinates.length === 0) {
    return { valid: false, error: 'Polygon has no coordinates' };
  }

  const ring = polygon.coordinates[0];

  if (ring.length < 4) {
    return { valid: false, error: 'Polygon must have at least 4 points' };
  }

  // Check if polygon is closed (first and last points are the same)
  const first = ring[0];
  const last = ring[ring.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    return { valid: false, error: 'Polygon is not closed' };
  }

  // Check coordinate bounds (UK boundaries approx)
  const UK_BOUNDS = {
    minLng: -8.5,
    maxLng: 2.0,
    minLat: 49.5,
    maxLat: 61.0,
  };

  for (const coord of ring) {
    const [lng, lat] = coord;

    if (lng < UK_BOUNDS.minLng || lng > UK_BOUNDS.maxLng || lat < UK_BOUNDS.minLat || lat > UK_BOUNDS.maxLat) {
      return { valid: false, error: 'Polygon extends outside UK boundaries' };
    }
  }

  return { valid: true };
}

/**
 * Calculate polygon area (approximate, in square kilometers)
 * Uses Spherical Law of Cosines
 */
export function calculatePolygonArea(polygon: any): number {
  if (!polygon || polygon.type !== 'Polygon') return 0;

  const coords = polygon.coordinates[0];
  if (coords.length < 4) return 0;

  let area = 0;
  const EARTH_RADIUS = 6371; // km

  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];

    area += toRadians(lng2 - lng1) * (2 + Math.sin(toRadians(lat1)) + Math.sin(toRadians(lat2)));
  }

  area = (Math.abs(area) * EARTH_RADIUS * EARTH_RADIUS) / 2;

  return area;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Get polygon center point (centroid)
 * Useful for displaying labels or zooming to territory
 */
export function getPolygonCenter(polygon: any): [number, number] {
  if (!polygon || polygon.type !== 'Polygon') return [0, 0];

  const coords = polygon.coordinates[0];
  let sumLng = 0;
  let sumLat = 0;
  let count = coords.length - 1; // Exclude last point (duplicate of first)

  for (let i = 0; i < count; i++) {
    sumLng += coords[i][0];
    sumLat += coords[i][1];
  }

  return [sumLng / count, sumLat / count];
}
