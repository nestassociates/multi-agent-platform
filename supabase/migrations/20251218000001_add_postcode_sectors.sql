-- Migration: Add Postcode Sectors for Territory Subdivision
-- Feature: 008-postcode-sector-territories
-- Date: 2025-12-18
--
-- This migration adds support for postcode sector-level territory assignments,
-- enabling agents to be assigned to finer-grained areas (e.g., TA1 1, TA1 2)
-- rather than just districts (TA1).

-- ============================================
-- 1. Create postcode_sectors table
-- ============================================

CREATE TABLE IF NOT EXISTS postcode_sectors (
  code TEXT PRIMARY KEY,
  district_code TEXT NOT NULL REFERENCES postcodes(code) ON DELETE CASCADE,
  boundary GEOGRAPHY(POLYGON, 4326),
  center_point GEOGRAPHY(POINT, 4326),
  area_km2 NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE postcode_sectors IS 'UK postcode sectors (subdivisions of districts) with geographic boundaries. Data source: Geolytix 2012 via Edinburgh DataShare';
COMMENT ON COLUMN postcode_sectors.code IS 'Postcode sector code (e.g., TA1 1, BS10 5)';
COMMENT ON COLUMN postcode_sectors.district_code IS 'Parent postcode district code (e.g., TA1, BS10)';
COMMENT ON COLUMN postcode_sectors.boundary IS 'Geographic polygon boundary (SRID 4326)';
COMMENT ON COLUMN postcode_sectors.center_point IS 'Centroid point for label placement';
COMMENT ON COLUMN postcode_sectors.area_km2 IS 'Area in square kilometers';

-- ============================================
-- 2. Create indexes for postcode_sectors
-- ============================================

CREATE INDEX IF NOT EXISTS idx_postcode_sectors_district
  ON postcode_sectors(district_code);

CREATE INDEX IF NOT EXISTS idx_postcode_sectors_boundary
  ON postcode_sectors USING GIST(boundary);

-- ============================================
-- 3. Create agent_postcodes table (if not exists)
-- This is the junction table for territory assignments
-- ============================================

CREATE TABLE IF NOT EXISTS agent_postcodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  postcode_code TEXT NOT NULL REFERENCES postcodes(code) ON DELETE CASCADE,
  sector_code TEXT REFERENCES postcode_sectors(code) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Unique constraint to prevent duplicate assignments
-- Uses COALESCE to treat NULL sector_code as empty string for uniqueness
-- This allows: (agent1, TA1, NULL) and (agent1, TA1, 'TA1 1') to coexist
-- But prevents: two (agent1, TA1, NULL) or two (agent1, TA1, 'TA1 1')
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_postcodes_unique
  ON agent_postcodes(agent_id, postcode_code, COALESCE(sector_code, ''));

COMMENT ON TABLE agent_postcodes IS 'Junction table for agent territory assignments at district or sector level';
COMMENT ON COLUMN agent_postcodes.agent_id IS 'Agent being assigned to territory';
COMMENT ON COLUMN agent_postcodes.postcode_code IS 'District code (required for all assignments)';
COMMENT ON COLUMN agent_postcodes.sector_code IS 'Sector code - NULL means full district, non-NULL means specific sector';
COMMENT ON COLUMN agent_postcodes.assigned_at IS 'When the assignment was created';

-- Index for querying by district
CREATE INDEX IF NOT EXISTS idx_agent_postcodes_district
  ON agent_postcodes(postcode_code);

-- Index for querying by agent
CREATE INDEX IF NOT EXISTS idx_agent_postcodes_agent
  ON agent_postcodes(agent_id);

-- Index for querying by sector
CREATE INDEX IF NOT EXISTS idx_agent_postcodes_sector
  ON agent_postcodes(sector_code)
  WHERE sector_code IS NOT NULL;

-- ============================================
-- 4. Create sector_property_counts cache table
-- ============================================

CREATE TABLE IF NOT EXISTS sector_property_counts (
  sector_code TEXT PRIMARY KEY REFERENCES postcode_sectors(code) ON DELETE CASCADE,
  residential_count INTEGER DEFAULT 0,
  commercial_count INTEGER DEFAULT 0,
  mixed_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  cached_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE sector_property_counts IS 'Cached property counts from OS Data Hub API (1-year TTL)';
COMMENT ON COLUMN sector_property_counts.sector_code IS 'Postcode sector code';
COMMENT ON COLUMN sector_property_counts.total_count IS 'Total properties (residential + commercial + mixed)';
COMMENT ON COLUMN sector_property_counts.cached_at IS 'When the count was last fetched';

-- ============================================
-- 5. Enable RLS on new tables
-- ============================================

ALTER TABLE postcode_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_postcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sector_property_counts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS Policies - postcode_sectors (public read)
-- ============================================

DROP POLICY IF EXISTS "Allow public read access to postcode_sectors" ON postcode_sectors;
CREATE POLICY "Allow public read access to postcode_sectors"
  ON postcode_sectors FOR SELECT
  USING (true);

-- Service role can insert/update (for data import)
DROP POLICY IF EXISTS "Allow service role full access to postcode_sectors" ON postcode_sectors;
CREATE POLICY "Allow service role full access to postcode_sectors"
  ON postcode_sectors FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 7. RLS Policies - agent_postcodes
-- ============================================

-- Admins can read all assignments
DROP POLICY IF EXISTS "Allow authenticated read on agent_postcodes" ON agent_postcodes;
CREATE POLICY "Allow authenticated read on agent_postcodes"
  ON agent_postcodes FOR SELECT
  TO authenticated
  USING (true);

-- Service role can manage assignments
DROP POLICY IF EXISTS "Allow service role full access to agent_postcodes" ON agent_postcodes;
CREATE POLICY "Allow service role full access to agent_postcodes"
  ON agent_postcodes FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 8. RLS Policies - sector_property_counts (public read)
-- ============================================

DROP POLICY IF EXISTS "Allow public read access to sector_property_counts" ON sector_property_counts;
CREATE POLICY "Allow public read access to sector_property_counts"
  ON sector_property_counts FOR SELECT
  USING (true);

-- Service role can update counts
DROP POLICY IF EXISTS "Allow service role full access to sector_property_counts" ON sector_property_counts;
CREATE POLICY "Allow service role full access to sector_property_counts"
  ON sector_property_counts FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 9. Helper function: get_sector_geojson
-- Returns a sector with its boundary as GeoJSON
-- ============================================

CREATE OR REPLACE FUNCTION get_sector_geojson(sector_code_param TEXT)
RETURNS JSON AS $$
SELECT json_build_object(
  'code', code,
  'district_code', district_code,
  'boundary', ST_AsGeoJSON(boundary)::json,
  'center_point', ST_AsGeoJSON(center_point)::json,
  'area_km2', area_km2
)
FROM postcode_sectors
WHERE code = sector_code_param;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_sector_geojson IS 'Returns a postcode sector with its boundary as GeoJSON';

-- ============================================
-- 10. Helper function: get_sectors_for_district
-- Returns all sectors within a district as GeoJSON
-- ============================================

CREATE OR REPLACE FUNCTION get_sectors_for_district(district_code_param TEXT)
RETURNS JSON AS $$
SELECT json_agg(
  json_build_object(
    'code', code,
    'district_code', district_code,
    'boundary', ST_AsGeoJSON(boundary)::json,
    'center_point', ST_AsGeoJSON(center_point)::json,
    'area_km2', area_km2
  )
)
FROM postcode_sectors
WHERE district_code = district_code_param;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_sectors_for_district IS 'Returns all sectors within a district as GeoJSON array';

-- ============================================
-- 11. Helper function: get_district_assignment_status
-- Returns assignment status for a district
-- ============================================

CREATE OR REPLACE FUNCTION get_district_assignment_status(district_code_param TEXT)
RETURNS TABLE (
  assignment_status TEXT,
  agent_id UUID,
  sector_count BIGINT,
  assigned_sector_count BIGINT
) AS $$
DECLARE
  total_sectors BIGINT;
  assigned_sectors BIGINT;
  full_assignment_agent UUID;
BEGIN
  -- Count total sectors for this district
  SELECT COUNT(*) INTO total_sectors
  FROM postcode_sectors
  WHERE district_code = district_code_param;

  -- Check for full district assignment (sector_code IS NULL)
  SELECT ap.agent_id INTO full_assignment_agent
  FROM agent_postcodes ap
  WHERE ap.postcode_code = district_code_param
    AND ap.sector_code IS NULL
  LIMIT 1;

  IF full_assignment_agent IS NOT NULL THEN
    -- Full district assigned
    RETURN QUERY SELECT
      'full'::TEXT,
      full_assignment_agent,
      total_sectors,
      total_sectors;
    RETURN;
  END IF;

  -- Count sector-level assignments
  SELECT COUNT(DISTINCT ap.sector_code) INTO assigned_sectors
  FROM agent_postcodes ap
  WHERE ap.postcode_code = district_code_param
    AND ap.sector_code IS NOT NULL;

  IF assigned_sectors = 0 THEN
    -- No assignments
    RETURN QUERY SELECT
      'unassigned'::TEXT,
      NULL::UUID,
      total_sectors,
      0::BIGINT;
  ELSIF assigned_sectors = total_sectors AND total_sectors > 0 THEN
    -- All sectors assigned (could be to different agents)
    RETURN QUERY SELECT
      'full'::TEXT,
      NULL::UUID,
      total_sectors,
      assigned_sectors;
  ELSE
    -- Partial assignment
    RETURN QUERY SELECT
      'partial'::TEXT,
      NULL::UUID,
      total_sectors,
      assigned_sectors;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_district_assignment_status IS 'Returns assignment status (unassigned/partial/full) for a district';

-- ============================================
-- 12. Helper function: check_assignment_conflicts
-- Checks for conflicts before creating an assignment
-- ============================================

CREATE OR REPLACE FUNCTION check_assignment_conflicts(
  target_agent_id UUID,
  target_postcode_code TEXT,
  target_sector_codes TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  conflict_type TEXT,
  conflict_code TEXT,
  conflict_agent_id UUID
) AS $$
BEGIN
  -- If assigning to full district (no sectors specified)
  IF target_sector_codes IS NULL OR array_length(target_sector_codes, 1) IS NULL THEN
    -- Check if any sectors are assigned to OTHER agents
    RETURN QUERY
    SELECT
      'sector_assigned'::TEXT,
      ap.sector_code,
      ap.agent_id
    FROM agent_postcodes ap
    WHERE ap.postcode_code = target_postcode_code
      AND ap.sector_code IS NOT NULL
      AND ap.agent_id != target_agent_id;
  ELSE
    -- Assigning specific sectors
    -- Check if full district is assigned to OTHER agent
    RETURN QUERY
    SELECT
      'district_assigned'::TEXT,
      ap.postcode_code,
      ap.agent_id
    FROM agent_postcodes ap
    WHERE ap.postcode_code = target_postcode_code
      AND ap.sector_code IS NULL
      AND ap.agent_id != target_agent_id;

    -- Check if any target sectors are assigned to OTHER agents
    RETURN QUERY
    SELECT
      'sector_assigned'::TEXT,
      ap.sector_code,
      ap.agent_id
    FROM agent_postcodes ap
    WHERE ap.postcode_code = target_postcode_code
      AND ap.sector_code = ANY(target_sector_codes)
      AND ap.agent_id != target_agent_id;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_assignment_conflicts IS 'Checks for assignment conflicts before creating a territory assignment';

-- ============================================
-- 13. Grant permissions
-- ============================================

GRANT EXECUTE ON FUNCTION get_sector_geojson TO authenticated;
GRANT EXECUTE ON FUNCTION get_sectors_for_district TO authenticated;
GRANT EXECUTE ON FUNCTION get_district_assignment_status TO authenticated;
GRANT EXECUTE ON FUNCTION check_assignment_conflicts TO authenticated;

-- ============================================
-- 14. Updated_at trigger for postcode_sectors
-- ============================================

DROP TRIGGER IF EXISTS update_postcode_sectors_updated_at ON postcode_sectors;
CREATE TRIGGER update_postcode_sectors_updated_at
  BEFORE UPDATE ON postcode_sectors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
