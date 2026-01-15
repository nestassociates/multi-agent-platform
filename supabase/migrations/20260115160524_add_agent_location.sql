-- Add location field for agent office/branch address
-- This enables geo-location based agent search

-- Add location column (PostGIS geography point)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- Create spatial index for efficient radius queries
CREATE INDEX IF NOT EXISTS agents_location_idx ON agents USING GIST (location);

-- Add comment for documentation
COMMENT ON COLUMN agents.location IS 'Office/branch location for geo-based agent search (PostGIS point)';

-- RPC function to search agents within radius
CREATE OR REPLACE FUNCTION search_agents_within_radius(
  search_lat double precision,
  search_lng double precision,
  radius_meters double precision
)
RETURNS TABLE (
  id uuid,
  subdomain text,
  branch_name text,
  bio text,
  qualifications text[],
  social_media_links jsonb,
  google_place_id text,
  status text,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  location geography,
  distance_meters double precision
) AS $$
  SELECT
    a.id,
    a.subdomain,
    a.branch_name,
    a.bio,
    a.qualifications,
    a.social_media_links,
    a.google_place_id,
    a.status,
    a.user_id,
    a.created_at,
    a.updated_at,
    a.location,
    ST_Distance(
      a.location,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography
    ) as distance_meters
  FROM agents a
  WHERE a.location IS NOT NULL
    AND a.status = 'active'
    AND ST_DWithin(
      a.location,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_meters ASC
$$ LANGUAGE sql STABLE;

-- Comment on function
COMMENT ON FUNCTION search_agents_within_radius IS 'Search for active agents within a given radius of a location';

-- RPC function to update agent location (for admin UI)
CREATE OR REPLACE FUNCTION update_agent_location(
  agent_id uuid,
  lat double precision,
  lng double precision
)
RETURNS void AS $$
  UPDATE agents
  SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      updated_at = NOW()
  WHERE id = agent_id
$$ LANGUAGE sql VOLATILE;

-- Comment on function
COMMENT ON FUNCTION update_agent_location IS 'Update agent office location for geo-based search';
