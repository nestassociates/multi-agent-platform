-- Create postcodes system for territory assignment
-- Replaces polygon-based territories with postcode-based assignment

-- T004: Postcodes table - stores UK postcode districts with boundaries
CREATE TABLE postcodes (
  code TEXT PRIMARY KEY,                        -- e.g., 'TA1', 'BS1', 'SW1'
  boundary GEOGRAPHY(POLYGON, 4326),            -- PostGIS polygon boundary
  center_point GEOGRAPHY(POINT, 4326),          -- Center coordinates for display
  area_km2 DECIMAL,                             -- Area size in square kilometers
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- T005: Property count cache - avoids repeated OS Places API calls
CREATE TABLE postcode_property_counts (
  postcode_code TEXT PRIMARY KEY,
  residential_count INTEGER NOT NULL DEFAULT 0,
  commercial_count INTEGER NOT NULL DEFAULT 0,
  mixed_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_postcode FOREIGN KEY (postcode_code)
    REFERENCES postcodes(code) ON DELETE CASCADE
);

-- T006: Agent-Postcode junction table - many-to-many relationship
CREATE TABLE agent_postcodes (
  agent_id UUID NOT NULL,
  postcode_code TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (agent_id, postcode_code),
  CONSTRAINT fk_agent FOREIGN KEY (agent_id)
    REFERENCES agents(id) ON DELETE CASCADE,
  CONSTRAINT fk_postcode FOREIGN KEY (postcode_code)
    REFERENCES postcodes(code) ON DELETE CASCADE
);

-- T007: Spatial indexes for fast queries
CREATE INDEX idx_postcodes_boundary ON postcodes USING GIST(boundary);
CREATE INDEX idx_postcodes_center ON postcodes USING GIST(center_point);
CREATE INDEX idx_agent_postcodes_agent ON agent_postcodes(agent_id);
CREATE INDEX idx_agent_postcodes_postcode ON agent_postcodes(postcode_code);

-- Comments for documentation
COMMENT ON TABLE postcodes IS 'UK postcode districts from OS Open Data with geographic boundaries';
COMMENT ON COLUMN postcodes.code IS 'Postcode district code (e.g., TA1, BS1, SW1)';
COMMENT ON COLUMN postcodes.boundary IS 'PostGIS polygon boundary in WGS84 (SRID 4326)';
COMMENT ON COLUMN postcodes.center_point IS 'Center point for map display and nearest-neighbor queries';

COMMENT ON TABLE postcode_property_counts IS 'Cached property counts from OS Places API (24-hour TTL)';
COMMENT ON COLUMN postcode_property_counts.cached_at IS 'Timestamp of last API query - refresh after 24 hours';

COMMENT ON TABLE agent_postcodes IS 'Many-to-many relationship between agents and assigned postcodes';
