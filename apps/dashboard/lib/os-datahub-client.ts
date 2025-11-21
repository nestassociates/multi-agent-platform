/**
 * OS Data Hub API Client
 *
 * Query residential property counts and data within geographic boundaries
 * Uses OS Places API with Polygon endpoint
 */

const OS_API_KEY = process.env.OS_DATA_HUB_API_KEY || '';
const OS_PLACES_API_URL = 'https://api.os.uk/search/places/v1/polygon';

interface PropertyCountResult {
  count: number;
  error?: string;
  details?: {
    residential: number;
    commercial: number;
    mixed: number;
    other: number;
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
 * Uses OS Places API Polygon endpoint
 * @param polygon - GeoJSON polygon geometry
 * @returns Property count with breakdown by type
 */
export async function countPropertiesInBoundary(polygon: any): Promise<PropertyCountResult> {
  try {
    if (!OS_API_KEY) {
      console.warn('OS Data Hub API key not configured');
      return { count: 0, error: 'API key not configured' };
    }

    // Query for all addresses (up to 100 at a time)
    const data = await queryOSPlacesPolygon(polygon, 100);

    if (!data) {
      return { count: 0, error: 'Failed to fetch data' };
    }

    // Count by classification
    const counts = {
      residential: 0,
      commercial: 0,
      mixed: 0,
      other: 0,
    };

    data.addresses.forEach((address: any) => {
      const classCode = address.CLASSIFICATION_CODE || '';

      if (classCode.startsWith('R')) {
        counts.residential++;
      } else if (classCode.startsWith('C')) {
        counts.commercial++;
      } else if (classCode.startsWith('M')) {
        counts.mixed++;
      } else {
        counts.other++;
      }
    });

    return {
      count: counts.residential,
      details: counts,
    };
  } catch (error: any) {
    console.error('Error querying OS Data Hub:', error);
    return { count: 0, error: error.message };
  }
}

/**
 * Query OS Places API with polygon
 * @param polygon - GeoJSON polygon
 * @param maxResults - Max results per request (1-100)
 * @returns Property data
 */
async function queryOSPlacesPolygon(
  polygon: any,
  maxResults: number = 100
): Promise<PropertyData | null> {
  try {
    console.log('📍 Querying OS Places API with polygon:', JSON.stringify(polygon).substring(0, 100) + '...');

    const url = `${OS_PLACES_API_URL}?key=${OS_API_KEY}&maxresults=${maxResults}&fq=CLASSIFICATION_CODE:R*`;
    console.log('📍 API URL:', url.replace(OS_API_KEY, 'KEY_HIDDEN'));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(polygon),
    });

    console.log('📍 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ OS Places API error:', error);
      return null;
    }

    const data = await response.json();
    console.log('✅ OS Places API response:', {
      totalResults: data.header?.totalresults,
      returnedResults: data.results?.length || 0,
    });

    // Extract results
    const addresses = data.results || [];
    const header = data.header || {};

    const result = {
      residential_count: addresses.filter((a: any) => a.CLASSIFICATION_CODE?.startsWith('R')).length,
      commercial_count: addresses.filter((a: any) => a.CLASSIFICATION_CODE?.startsWith('C')).length,
      mixed_count: addresses.filter((a: any) => a.CLASSIFICATION_CODE?.startsWith('M')).length,
      other_count: addresses.filter((a: any) => !['R', 'C', 'M'].includes(a.CLASSIFICATION_CODE?.[0])).length,
      total_count: header.totalresults || addresses.length,
      addresses,
    };

    console.log('📊 Property breakdown:', {
      residential: result.residential_count,
      commercial: result.commercial_count,
      total: result.total_count,
    });

    return result;
  } catch (error: any) {
    console.error('❌ Error in queryOSPlacesPolygon:', error);
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
