-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create properties table
-- Stores property listings synced from Apex27 CRM

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  apex27_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'let', 'commercial')),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  property_type TEXT,
  address JSONB NOT NULL,
  postcode TEXT,
  location GEOGRAPHY(POINT, 4326), -- PostGIS point (latitude, longitude)
  images JSONB DEFAULT '[]',
  features TEXT[] DEFAULT '{}',
  floor_plan_url TEXT,
  virtual_tour_url TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'under_offer', 'sold', 'let')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  raw_data JSONB, -- Full JSON from Apex27 for debugging
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_agent_property UNIQUE (agent_id, apex27_id)
);

-- Indexes
CREATE INDEX idx_properties_agent_id ON properties(agent_id);
CREATE INDEX idx_properties_apex27_id ON properties(apex27_id);
CREATE INDEX idx_properties_postcode ON properties(postcode);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_transaction_type ON properties(transaction_type);
CREATE INDEX idx_properties_is_featured ON properties(is_featured) WHERE is_featured = true;
CREATE INDEX idx_properties_status ON properties(status);

-- Spatial index for location queries (radius searches, point-in-polygon)
CREATE INDEX idx_properties_location ON properties USING GIST(location);

-- Comments
COMMENT ON TABLE properties IS 'Property listings synced from Apex27 CRM';
COMMENT ON COLUMN properties.location IS 'PostGIS point in WGS84 (SRID 4326)';
COMMENT ON COLUMN properties.address IS 'JSON object with line1, line2, city, county, postcode, country';
COMMENT ON COLUMN properties.images IS 'JSON array of image objects with url, alt, order';
