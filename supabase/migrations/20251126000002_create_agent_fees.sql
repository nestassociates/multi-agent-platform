-- Migration: Create agent_fees table with TipTap editor content
-- Feature: 005-separate-reviews-fees (UPDATED)
-- Date: 2025-11-26

-- Create agent_fees table
CREATE TABLE agent_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE UNIQUE,

  -- Rich Text Content (HTML from TipTap editor)
  content_body TEXT NOT NULL DEFAULT '',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE agent_fees IS 'Agent fee structure with rich text content (TipTap editor)';
COMMENT ON COLUMN agent_fees.content_body IS 'Rich HTML content describing fees (sanitized server-side)';

-- Enable Row Level Security
ALTER TABLE agent_fees ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Agents can manage their own fees
CREATE POLICY "Agents manage own fees"
  ON agent_fees FOR ALL
  USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

-- RLS Policy: Public read access (for displaying on agent websites)
CREATE POLICY "Public read fees"
  ON agent_fees FOR SELECT
  USING (TRUE);
