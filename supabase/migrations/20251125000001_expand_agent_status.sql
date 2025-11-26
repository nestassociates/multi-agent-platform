-- Migration: Expand agent status enum to support lifecycle management
-- Feature: 004-agent-lifecycle-management
-- Task: T001

-- Drop existing CHECK constraint
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_status_check;

-- Add new CHECK constraint with expanded status values
ALTER TABLE agents ADD CONSTRAINT agents_status_check
  CHECK (status IN ('draft', 'pending_profile', 'pending_admin', 'active', 'inactive', 'suspended'));

-- Add comment explaining status values
COMMENT ON COLUMN agents.status IS 'Agent lifecycle status: draft (auto-detected), pending_profile (user created, incomplete), pending_admin (profile complete, awaiting approval), active (approved and deployed), inactive (temp disabled), suspended (banned)';
