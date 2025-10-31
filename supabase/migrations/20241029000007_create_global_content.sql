-- Create global_content table
-- Stores platform-wide templates and legal pages

CREATE TABLE global_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL UNIQUE CHECK (content_type IN ('header', 'footer', 'privacy_policy', 'terms_of_service', 'cookie_policy')),
  content_body TEXT NOT NULL, -- HTML or JSON
  version INTEGER NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by_user_id UUID NOT NULL REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_global_content_type ON global_content(content_type);
CREATE INDEX idx_global_content_published ON global_content(is_published) WHERE is_published = true;

-- Comments
COMMENT ON TABLE global_content IS 'Platform-wide templates and legal pages applied to all agent sites';
COMMENT ON COLUMN global_content.content_type IS 'Type of global content: header, footer, privacy_policy, terms_of_service, cookie_policy';
COMMENT ON COLUMN global_content.content_body IS 'HTML or JSON content body';
