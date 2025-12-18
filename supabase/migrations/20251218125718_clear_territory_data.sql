-- Clear all territory assignments and cached property counts
-- This is a data cleanup migration

-- Clear all territory assignments
DELETE FROM agent_postcodes;

-- Clear sector property counts cache
DELETE FROM sector_property_counts;

-- Clear postcode property counts cache
DELETE FROM postcode_property_counts;
