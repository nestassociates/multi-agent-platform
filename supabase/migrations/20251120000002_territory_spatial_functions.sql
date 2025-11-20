-- Territory Spatial Functions Migration
-- PostGIS functions for territory overlap detection and property counting

-- ============================================
-- FUNCTION: Check Territory Overlap
-- ============================================

CREATE OR REPLACE FUNCTION check_territory_overlap(
  new_boundary TEXT,
  existing_territory_id UUID
)
RETURNS TABLE (
  overlaps BOOLEAN,
  overlap_area NUMERIC
) AS $$
DECLARE
  existing_boundary GEOGRAPHY;
  new_boundary_geog GEOGRAPHY;
  overlap_geog GEOGRAPHY;
BEGIN
  -- Get existing territory boundary
  SELECT boundary INTO existing_boundary
  FROM territories
  WHERE id = existing_territory_id;

  -- Convert WKT to geography
  new_boundary_geog := ST_GeogFromText(new_boundary);

  -- Check if they intersect
  IF ST_Intersects(existing_boundary, new_boundary_geog) THEN
    -- Calculate overlap area
    overlap_geog := ST_Intersection(existing_boundary, new_boundary_geog);

    RETURN QUERY SELECT
      TRUE as overlaps,
      ST_Area(overlap_geog) as overlap_area;
  ELSE
    RETURN QUERY SELECT
      FALSE as overlaps,
      0::NUMERIC as overlap_area;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Calculate Territory Statistics
-- ============================================

CREATE OR REPLACE FUNCTION calculate_territory_stats(
  boundary_wkt TEXT
)
RETURNS TABLE (
  area_km2 NUMERIC,
  area_mi2 NUMERIC,
  perimeter_km NUMERIC,
  center JSONB
) AS $$
DECLARE
  boundary_geog GEOGRAPHY;
  center_point GEOGRAPHY;
BEGIN
  -- Convert WKT to geography
  boundary_geog := ST_GeogFromText(boundary_wkt);

  -- Calculate center point
  center_point := ST_Centroid(boundary_geog);

  RETURN QUERY SELECT
    -- Area in square kilometers
    (ST_Area(boundary_geog) / 1000000)::NUMERIC as area_km2,
    -- Area in square miles
    (ST_Area(boundary_geog) / 2589988.11)::NUMERIC as area_mi2,
    -- Perimeter in kilometers
    (ST_Perimeter(boundary_geog) / 1000)::NUMERIC as perimeter_km,
    -- Center point as JSON {lng, lat}
    json_build_object(
      'lng', ST_X(center_point::geometry),
      'lat', ST_Y(center_point::geometry)
    )::JSONB as center;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Find Territories at Point
-- ============================================

CREATE OR REPLACE FUNCTION find_territories_at_point(
  point_lng NUMERIC,
  point_lat NUMERIC
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  agent_id UUID,
  property_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.agent_id,
    t.property_count
  FROM territories t
  WHERE ST_Contains(
    t.boundary,
    ST_SetSRID(ST_Point(point_lng, point_lat), 4326)::geography
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get All Overlapping Territories
-- ============================================

CREATE OR REPLACE FUNCTION get_overlapping_territories(
  new_boundary_wkt TEXT,
  exclude_territory_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  agent_id UUID,
  overlap_area_m2 NUMERIC,
  overlap_percentage NUMERIC
) AS $$
DECLARE
  new_geog GEOGRAPHY;
  new_area NUMERIC;
BEGIN
  -- Convert WKT to geography
  new_geog := ST_GeogFromText(new_boundary_wkt);
  new_area := ST_Area(new_geog);

  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.agent_id,
    ST_Area(ST_Intersection(t.boundary, new_geog))::NUMERIC as overlap_area_m2,
    (ST_Area(ST_Intersection(t.boundary, new_geog)) / new_area * 100)::NUMERIC as overlap_percentage
  FROM territories t
  WHERE
    ST_Intersects(t.boundary, new_geog)
    AND (exclude_territory_id IS NULL OR t.id != exclude_territory_id)
    AND ST_Area(ST_Intersection(t.boundary, new_geog)) > 0
  ORDER BY overlap_area_m2 DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Count Properties in Territory
-- ============================================

CREATE OR REPLACE FUNCTION count_properties_in_territory(
  territory_boundary GEOGRAPHY
)
RETURNS INTEGER AS $$
DECLARE
  property_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO property_count
  FROM properties
  WHERE ST_Contains(territory_boundary, location)
    AND status = 'available';

  RETURN property_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Update Territory Property Count
-- ============================================

CREATE OR REPLACE FUNCTION update_territory_property_count(
  territory_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
  boundary GEOGRAPHY;
BEGIN
  -- Get territory boundary
  SELECT t.boundary INTO boundary
  FROM territories t
  WHERE t.id = territory_id;

  -- Count properties
  new_count := count_properties_in_territory(boundary);

  -- Update territory
  UPDATE territories
  SET property_count = new_count,
      updated_at = NOW()
  WHERE id = territory_id;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Auto-update property count on territory changes
-- ============================================

CREATE OR REPLACE FUNCTION trigger_update_territory_property_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate property count when territory is created or boundary changes
  NEW.property_count := count_properties_in_territory(NEW.boundary);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS auto_update_territory_property_count ON territories;

-- Create trigger
CREATE TRIGGER auto_update_territory_property_count
  BEFORE INSERT OR UPDATE OF boundary ON territories
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_territory_property_count();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION check_territory_overlap TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_territory_stats TO authenticated;
GRANT EXECUTE ON FUNCTION find_territories_at_point TO authenticated;
GRANT EXECUTE ON FUNCTION get_overlapping_territories TO authenticated;
GRANT EXECUTE ON FUNCTION count_properties_in_territory TO authenticated;
GRANT EXECUTE ON FUNCTION update_territory_property_count TO authenticated;
