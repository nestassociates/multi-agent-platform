-- Migration: Add branch_name column to agents table
-- Feature: 004-agent-lifecycle-management
-- Task: T003

-- Add branch_name column
ALTER TABLE agents ADD COLUMN branch_name TEXT;

-- Add comment
COMMENT ON COLUMN agents.branch_name IS 'Human-readable branch name from Apex27 (e.g., "Manchester City Centre")';

-- Add index for searching by branch name
CREATE INDEX idx_agents_branch_name ON agents(branch_name);
