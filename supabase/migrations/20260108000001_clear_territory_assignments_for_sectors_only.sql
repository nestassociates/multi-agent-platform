-- Migration: Clear territory assignments for sectors-only system
-- Part of simplification to remove district-level assignments
-- All future assignments will use sector_code (never NULL)

-- Clear all existing territory assignments
TRUNCATE TABLE agent_postcodes;

-- Add a comment to document the change
COMMENT ON TABLE agent_postcodes IS 'Territory assignments using sector codes only. sector_code should always be NOT NULL after 2026-01-08 migration.';
