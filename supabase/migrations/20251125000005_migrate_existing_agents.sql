-- Migration: Migrate existing 16 agents to 'active' status with checklists
-- Feature: 004-agent-lifecycle-management
-- Task: T005

-- Update existing agents to 'active' status
-- (Agents with NULL status or already 'active'/'inactive')
UPDATE agents
SET status = 'active'
WHERE status IS NULL OR status IN ('active', 'inactive');

-- Create checklist records for all existing agents
-- Mark everything as complete since they're already live
INSERT INTO agent_onboarding_checklist (
  agent_id,
  user_created,
  welcome_email_sent,
  profile_completed,
  profile_completion_pct,
  admin_approved,
  site_deployed,
  activated_at,
  activated_by_user_id
)
SELECT
  a.id,
  true,  -- user_id exists, so user was created
  true,  -- assumed welcome email was sent
  true,  -- profile exists, assumed complete
  100,   -- 100% complete
  true,  -- implicitly approved (already live)
  true,  -- site already deployed
  a.created_at,  -- use agent creation time as activation time
  (SELECT user_id FROM profiles WHERE role = 'super_admin' LIMIT 1)  -- system activation
FROM agents a
WHERE NOT EXISTS (
  SELECT 1 FROM agent_onboarding_checklist WHERE agent_id = a.id
)
AND a.user_id IS NOT NULL;  -- Only for agents with users

-- For any agents without users (shouldn't exist, but just in case)
-- Mark as draft
UPDATE agents
SET status = 'draft'
WHERE user_id IS NULL AND status != 'draft';
