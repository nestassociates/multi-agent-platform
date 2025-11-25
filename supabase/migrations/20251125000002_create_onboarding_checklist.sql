-- Migration: Create agent_onboarding_checklist table
-- Feature: 004-agent-lifecycle-management
-- Task: T002

-- Create onboarding checklist table
CREATE TABLE agent_onboarding_checklist (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- Checklist Items (boolean flags)
  user_created BOOLEAN NOT NULL DEFAULT false,
  welcome_email_sent BOOLEAN NOT NULL DEFAULT false,
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  admin_approved BOOLEAN NOT NULL DEFAULT false,
  site_deployed BOOLEAN NOT NULL DEFAULT false,

  -- Progress Tracking
  profile_completion_pct INTEGER NOT NULL DEFAULT 0 CHECK (profile_completion_pct >= 0 AND profile_completion_pct <= 100),

  -- Activation Metadata
  activated_at TIMESTAMPTZ,
  activated_by_user_id UUID REFERENCES auth.users(id),
  deactivated_at TIMESTAMPTZ,
  deactivated_by_user_id UUID REFERENCES auth.users(id),
  deactivation_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(agent_id)
);

-- Add table comment
COMMENT ON TABLE agent_onboarding_checklist IS 'Tracks agent onboarding progress and deployment approval status';

-- Add column comments
COMMENT ON COLUMN agent_onboarding_checklist.user_created IS 'Admin created user account for agent';
COMMENT ON COLUMN agent_onboarding_checklist.welcome_email_sent IS 'Welcome email sent to agent';
COMMENT ON COLUMN agent_onboarding_checklist.profile_completed IS 'Agent completed all required profile fields';
COMMENT ON COLUMN agent_onboarding_checklist.profile_completion_pct IS 'Percentage of required profile fields completed (0-100)';
COMMENT ON COLUMN agent_onboarding_checklist.admin_approved IS 'Admin approved agent for deployment';
COMMENT ON COLUMN agent_onboarding_checklist.site_deployed IS 'Agent microsite has been deployed';
COMMENT ON COLUMN agent_onboarding_checklist.activated_at IS 'Timestamp when agent was activated';
COMMENT ON COLUMN agent_onboarding_checklist.activated_by_user_id IS 'Admin user who activated the agent';

-- Create indexes for common queries
CREATE INDEX idx_agent_onboarding_checklist_agent_id ON agent_onboarding_checklist(agent_id);
CREATE INDEX idx_agent_onboarding_checklist_profile_completed ON agent_onboarding_checklist(profile_completed);
CREATE INDEX idx_agent_onboarding_checklist_admin_approved ON agent_onboarding_checklist(admin_approved);

-- Auto-update timestamp trigger
CREATE TRIGGER update_agent_onboarding_checklist_updated_at
  BEFORE UPDATE ON agent_onboarding_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE agent_onboarding_checklist ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can view all checklists
CREATE POLICY "Admins can view all checklists"
  ON agent_onboarding_checklist
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policy: Agents can view their own checklist
CREATE POLICY "Agents can view own checklist"
  ON agent_onboarding_checklist
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_onboarding_checklist.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- RLS Policy: Only admins can update checklists
CREATE POLICY "Admins can update checklists"
  ON agent_onboarding_checklist
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policy: Only admins can insert checklists
CREATE POLICY "Admins can insert checklists"
  ON agent_onboarding_checklist
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
