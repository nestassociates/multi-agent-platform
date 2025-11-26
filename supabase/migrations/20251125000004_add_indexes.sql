-- Migration: Add indexes for agent lifecycle queries
-- Feature: 004-agent-lifecycle-management
-- Task: T004

-- Index for build queue filtering (queries by agent status frequently)
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
COMMENT ON INDEX idx_agents_status IS 'Optimize build queue filtering by agent status (only active agents)';

-- Index for auto-detection lookups (queries by apex27_branch_id on every property webhook)
CREATE INDEX IF NOT EXISTS idx_agents_apex27_branch_id ON agents(apex27_branch_id);
COMMENT ON INDEX idx_agents_apex27_branch_id IS 'Optimize auto-detection lookups during property webhook processing';

-- Unique constraint to prevent duplicate branch_ids
ALTER TABLE agents ADD CONSTRAINT agents_apex27_branch_id_unique UNIQUE (apex27_branch_id);
