/**
 * OS Data Hub API Client
 *
 * Query residential property counts within geographic boundaries
 * Uses OS Features API with WFS (Web Feature Service)
 */

const OS_API_KEY = process.env.OS_DATAHUB_API_KEY || '';
const OS_BASE_URL = 'https://api.os.uk/features/v1/wfs';

interface PropertyCountResult {
  count: number;
  error?: string;
}

/**
 * Count residential properties within a polygon boundary
 * @param polygon - GeoJSON polygon geometry
 * @returns Property count or error
 */
export async function countPropertiesInBoundary(polygon: any): Promise<PropertyCountResult> {
  try {
    if (!OS_API_KEY) {
      console.warn('OS Data Hub API key not configured');
      return { count: 0, error: 'API key not configured' };
    }

    // Convert GeoJSON polygon to WKT (Well-Known Text) format
    const wkt = geojsonToWKT(polygon);

    // Build WFS query parameters
    const params = new URLSearchParams({
      service: 'WFS',
      request: 'GetFeature',
      version: '2.0.0',
      typeNames: 'Zoomstack_Sites', // OS Zoomstack Sites layer (includes residential)
      outputFormat: 'application/json',
      srsName: 'EPSG:4326', // WGS84 coordinate system
      filter: `<Filter>
        <And>
          <Intersects>
            <PropertyName>geometry</PropertyName>
            <gml:Polygon srsName="EPSG:4326">
              <gml:exterior>
                <gml:LinearRing>
                  <gml:coordinates>${wkt}</gml:coordinates>
                </gml:LinearRing>
              </gml:exterior>
            </gml:Polygon>
          </Intersects>
          <PropertyIsEqualTo>
            <PropertyName>DistinctiveName1</PropertyName>
            <Literal>Residential</Literal>
          </PropertyIsEqualTo>
        </And>
      </Filter>`,
      key: OS_API_KEY,
    });

    const response = await fetch(`${OS_BASE_URL}?${params.toString()}`);

    if (!response.ok) {
      const error = await response.text();
      console.error('OS Data Hub API error:', error);
      return { count: 0, error: `API error: ${response.status}` };
    }

    const data = await response.json();

    // Count features in response
    const count = data.features?.length || 0;

    return { count };
  } catch (error: any) {
    console.error('Error querying OS Data Hub:', error);
    return { count: 0, error: error.message };
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
