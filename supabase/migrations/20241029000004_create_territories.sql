-- Create territories table
-- Stores geographic territories assigned to agents

CREATE TABLE territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  boundary GEOGRAPHY(POLYGON, 4326) NOT NULL, -- PostGIS polygon in WGS84
  property_count INTEGER,
  property_count_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_territories_agent_id ON territories(agent_id);

-- Spatial index for boundary queries (overlap detection, point-in-polygon)
CREATE INDEX idx_territories_boundary ON territories USING GIST(boundary);

-- Comments
COMMENT ON TABLE territories IS 'Geographic territories assigned to agents for market coverage';
COMMENT ON COLUMN territories.boundary IS 'PostGIS polygon boundary in WGS84 (SRID 4326)';
COMMENT ON COLUMN territories.property_count IS 'Cached residential property count from OS Data Hub API';
