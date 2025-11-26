-- Migration: Add google_place_id to agents table for GMB reviews
-- Feature: 005-separate-reviews-fees
-- Date: 2025-11-26

-- Add google_place_id column to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS google_place_id TEXT;

-- Create partial index for agents with GMB configured
CREATE INDEX IF NOT EXISTS idx_agents_google_place_id
  ON agents(google_place_id)
  WHERE google_place_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN agents.google_place_id IS 'Google My Business Place ID for embedded reviews widget (format: ChIJ...)';
