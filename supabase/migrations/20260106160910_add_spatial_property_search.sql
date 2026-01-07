-- Migration: Add spatial property search functions
-- Enables searching properties within a radius of a point using PostGIS

-- Function to search properties within radius of a point
-- Uses ST_DWithin for efficient spatial filtering with existing GIST index
CREATE OR REPLACE FUNCTION search_properties_within_radius(
  p_lng DOUBLE PRECISION,
  p_lat DOUBLE PRECISION,
  p_radius_meters INTEGER,
  p_transaction_type TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'available',
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_bedrooms INTEGER DEFAULT NULL,
  p_max_bedrooms INTEGER DEFAULT NULL,
  p_property_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  apex27_id TEXT,
  title TEXT,
  description TEXT,
  transaction_type TEXT,
  price NUMERIC,
  bedrooms INTEGER,
  bathrooms INTEGER,
  property_type TEXT,
  status TEXT,
  is_featured BOOLEAN,
  address JSONB,
  postcode TEXT,
  location_lng DOUBLE PRECISION,
  location_lat DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION,
  features TEXT[],
  images JSONB,
  agent_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  search_point GEOGRAPHY;
BEGIN
  -- Create search point from coordinates
  search_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;

  RETURN QUERY
  SELECT
    p.id,
    p.apex27_id,
    p.title,
    p.description,
    p.transaction_type,
    p.price,
    p.bedrooms,
    p.bathrooms,
    p.property_type,
    p.status,
    p.is_featured,
    p.address,
    p.postcode,
    ST_X(p.location::geometry) AS location_lng,
    ST_Y(p.location::geometry) AS location_lat,
    ST_Distance(p.location, search_point) AS distance_meters,
    p.features,
    p.images,
    p.agent_id,
    p.created_at,
    p.updated_at
  FROM properties p
  INNER JOIN agents a ON p.agent_id = a.id
  WHERE
    a.status = 'active'
    AND p.location IS NOT NULL
    AND ST_DWithin(p.location, search_point, p_radius_meters)
    AND (p_transaction_type IS NULL OR p.transaction_type =
         CASE WHEN p_transaction_type = 'rental' THEN 'let' ELSE p_transaction_type END)
    AND (p_status = 'all' OR p.status = p_status)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_min_bedrooms IS NULL OR p.bedrooms >= p_min_bedrooms)
    AND (p_max_bedrooms IS NULL OR p.bedrooms <= p_max_bedrooms)
    AND (p_property_type IS NULL OR p.property_type ILIKE '%' || p_property_type || '%')
  ORDER BY ST_Distance(p.location, search_point) ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION search_properties_within_radius IS
  'Searches properties within a radius (meters) of a point, ordered by distance. Uses PostGIS ST_DWithin for efficient spatial filtering.';


-- Function to count properties within radius (for pagination)
CREATE OR REPLACE FUNCTION count_properties_within_radius(
  p_lng DOUBLE PRECISION,
  p_lat DOUBLE PRECISION,
  p_radius_meters INTEGER,
  p_transaction_type TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'available',
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_bedrooms INTEGER DEFAULT NULL,
  p_max_bedrooms INTEGER DEFAULT NULL,
  p_property_type TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  search_point GEOGRAPHY;
  total_count INTEGER;
BEGIN
  search_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;

  SELECT COUNT(*)::INTEGER INTO total_count
  FROM properties p
  INNER JOIN agents a ON p.agent_id = a.id
  WHERE
    a.status = 'active'
    AND p.location IS NOT NULL
    AND ST_DWithin(p.location, search_point, p_radius_meters)
    AND (p_transaction_type IS NULL OR p.transaction_type =
         CASE WHEN p_transaction_type = 'rental' THEN 'let' ELSE p_transaction_type END)
    AND (p_status = 'all' OR p.status = p_status)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_min_bedrooms IS NULL OR p.bedrooms >= p_min_bedrooms)
    AND (p_max_bedrooms IS NULL OR p.bedrooms <= p_max_bedrooms)
    AND (p_property_type IS NULL OR p.property_type ILIKE '%' || p_property_type || '%');

  RETURN total_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION count_properties_within_radius IS
  'Counts properties within a radius (meters) of a point for pagination purposes.';


-- Helper function to get postcode center coordinates
-- Used by geocoding utility to get lat/lng from postcode district
CREATE OR REPLACE FUNCTION get_postcode_center(postcode_code TEXT)
RETURNS TABLE (
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ST_Y(p.center_point::geometry) AS lat,
    ST_X(p.center_point::geometry) AS lng
  FROM postcodes p
  WHERE p.code = UPPER(postcode_code);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_postcode_center IS
  'Returns lat/lng coordinates for a postcode district center point.';


-- Grant execute permissions to all roles that need access
GRANT EXECUTE ON FUNCTION search_properties_within_radius TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION count_properties_within_radius TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_postcode_center TO anon, authenticated, service_role;
