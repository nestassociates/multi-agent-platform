-- Add metadata column to territories table
-- Stores statistics from OS Data Hub API (postcodes, area, radius, property breakdown)

ALTER TABLE territories
ADD COLUMN metadata JSONB;

COMMENT ON COLUMN territories.metadata IS 'Territory statistics from OS Data Hub: postcodes, area_km2, radius_meters, commercial_count, mixed_count';

-- Example metadata structure:
-- {
--   "postcodes": ["M15", "M16", "M20"],
--   "area_km2": 3.14,
--   "radius_meters": 1000,
--   "commercial_count": 234,
--   "mixed_count": 12
-- }
