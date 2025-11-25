/**
 * PostGIS Spatial Query Utilities
 *
 * Helper functions for geographic and spatial database operations
 *
 * NOTE: These functions require a Supabase client to be passed in.
 * The caller is responsible for creating the client with appropriate permissions.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface OverlapResult {
  hasOverlap: boolean;
  overlappingTerritories: Array<{
    id: string;
    name: string;
    agent_id: string;
    overlap_area: number; // Area of overlap in square meters
  }>;
}

/**
 * Check if a polygon overlaps with existing territories
 * Uses PostGIS ST_Intersects and ST_Area functions
 *
 * @param supabase - Supabase client instance
 * @param polygon - GeoJSON Polygon geometry
 * @param excludeTerritoryId - Optional territory ID to exclude (for updates)
 * @returns Overlap result with list of overlapping territories
 */
export async function checkTerritoryOverlap(
  supabase: SupabaseClient,
  polygon: any,
  excludeTerritoryId?: string
): Promise<OverlapResult> {
  try {

    // Convert GeoJSON to WKT for PostGIS
    const wkt = geojsonPolygonToWKT(polygon);

    // Build SQL query to check for overlaps
    // ST_GeomFromText converts WKT to geometry
    // ST_Intersects checks if geometries overlap
    // ST_Area calculates overlap area
    let query = supabase
      .from('territories')
      .select('id, name, agent_id')
      .not('id', 'is', null); // Ensure we get valid records

    // Exclude specific territory (for updates)
    if (excludeTerritoryId) {
      query = query.neq('id', excludeTerritoryId);
    }

    const { data: territories, error } = await query;

    if (error) {
      console.error('Error checking territory overlap:', error);
      return { hasOverlap: false, overlappingTerritories: [] };
    }

    if (!territories || territories.length === 0) {
      return { hasOverlap: false, overlappingTerritories: [] };
    }

    // Check each territory for overlap using PostGIS
    // Note: This is a simplified approach. For production with many territories,
    // consider using a single SQL query with ST_Intersects in the WHERE clause
    const overlapping = [];

    for (const territory of territories) {
      // Use RPC function to check overlap
      const { data: overlapCheck } = await supabase.rpc('check_territory_overlap', {
        new_boundary: wkt,
        existing_territory_id: territory.id,
      });

      if (overlapCheck && overlapCheck.overlaps) {
        overlapping.push({
          ...territory,
          overlap_area: overlapCheck.overlap_area || 0,
        });
      }
    }

    return {
      hasOverlap: overlapping.length > 0,
      overlappingTerritories: overlapping,
    };
  } catch (error: any) {
    console.error('Error in checkTerritoryOverlap:', error);
    return { hasOverlap: false, overlappingTerritories: [] };
  }
}

/**
 * Convert GeoJSON Polygon to WKT (Well-Known Text) format
 * PostGIS uses WKT for geometry operations
 */
export function geojsonPolygonToWKT(polygon: any): string {
  if (!polygon || polygon.type !== 'Polygon') {
    throw new Error('Invalid polygon geometry');
  }

  const coordinates = polygon.coordinates[0]; // Exterior ring

  // Build WKT: POLYGON((lng lat, lng lat, ...))
  const points = coordinates
    .map((coord: [number, number]) => `${coord[0]} ${coord[1]}`)
    .join(', ');

  return `POLYGON((${points}))`;
}

/**
 * Convert WKT to GeoJSON Polygon
 */
export function wktToGeojsonPolygon(wkt: string): any {
  // Remove "POLYGON((" and "))"
  const coordString = wkt.replace('POLYGON((', '').replace('))', '');

  // Split into coordinate pairs
  const coordinates = coordString.split(', ').map((pair) => {
    const [lng, lat] = pair.trim().split(' ');
    return [parseFloat(lng), parseFloat(lat)];
  });

  return {
    type: 'Polygon',
    coordinates: [coordinates],
  };
}

/**
 * Calculate territory statistics
 * @param supabase - Supabase client instance
 * @param polygon - GeoJSON Polygon geometry
 * @returns Territory stats (area, perimeter, center point)
 */
export async function calculateTerritoryStats(
  supabase: SupabaseClient,
  polygon: any
): Promise<{
  area_km2: number;
  area_mi2: number;
  perimeter_km: number;
  center: [number, number];
}> {
  try {

    const wkt = geojsonPolygonToWKT(polygon);

    // Use PostGIS functions to calculate stats
    const { data, error } = await supabase.rpc('calculate_territory_stats', {
      boundary_wkt: wkt,
    });

    if (error || !data) {
      console.error('Error calculating territory stats:', error);
      // Return approximate values from client-side calculation
      return {
        area_km2: 0,
        area_mi2: 0,
        perimeter_km: 0,
        center: getPolygonCenter(polygon),
      };
    }

    return data;
  } catch (error) {
    console.error('Error in calculateTerritoryStats:', error);
    return {
      area_km2: 0,
      area_mi2: 0,
      perimeter_km: 0,
      center: [0, 0],
    };
  }
}

/**
 * Get polygon center (simple centroid calculation)
 */
function getPolygonCenter(polygon: any): [number, number] {
  if (!polygon || polygon.type !== 'Polygon') return [0, 0];

  const coords = polygon.coordinates[0];
  let sumLng = 0;
  let sumLat = 0;
  const count = coords.length - 1; // Exclude duplicate last point

  for (let i = 0; i < count; i++) {
    sumLng += coords[i][0];
    sumLat += coords[i][1];
  }

  return [sumLng / count, sumLat / count];
}

/**
 * Find territories containing a specific point
 * @param supabase - Supabase client instance
 * @param lng - Longitude
 * @param lat - Latitude
 * @returns List of territories containing this point
 */
export async function findTerritoriesAtPoint(
  supabase: SupabaseClient,
  lng: number,
  lat: number
): Promise<any[]> {
  try {

    const { data, error } = await supabase.rpc('find_territories_at_point', {
      point_lng: lng,
      point_lat: lat,
    });

    if (error) {
      console.error('Error finding territories at point:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in findTerritoriesAtPoint:', error);
    return [];
  }
}
