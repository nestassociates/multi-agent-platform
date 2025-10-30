-- Create agents table
-- Stores real estate agent-specific information

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(user_id) ON DELETE CASCADE,
  subdomain TEXT NOT NULL UNIQUE,
  apex27_branch_id TEXT,
  bio TEXT,
  qualifications TEXT[] DEFAULT '{}',
  social_media_links JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subdomain_format CHECK (subdomain ~ '^[a-z0-9-]+$')
);

-- Indexes
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE UNIQUE INDEX idx_agents_subdomain ON agents(subdomain);
CREATE INDEX idx_agents_apex27_branch_id ON agents(apex27_branch_id) WHERE apex27_branch_id IS NOT NULL;
CREATE INDEX idx_agents_status ON agents(status);

-- Comments
COMMENT ON TABLE agents IS 'Real estate agents with branded microsites';
COMMENT ON COLUMN agents.subdomain IS 'Unique subdomain for agent microsite (e.g., john-smith)';
COMMENT ON COLUMN agents.apex27_branch_id IS 'Apex27 CRM branch ID for property sync';
COMMENT ON COLUMN agents.qualifications IS 'Array of qualification names (e.g., ARLA, NAEA)';
COMMENT ON COLUMN agents.social_media_links IS 'JSON object with social media URLs';
