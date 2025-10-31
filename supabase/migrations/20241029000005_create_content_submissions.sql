-- Create content_submissions table
-- Stores user-generated content created by agents

CREATE TABLE content_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('blog_post', 'area_guide', 'review', 'fee_structure')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content_body TEXT NOT NULL, -- HTML from Tiptap editor
  excerpt TEXT,
  featured_image_url TEXT,
  seo_meta_title TEXT,
  seo_meta_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'published')),
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by_user_id UUID REFERENCES profiles(user_id),
  published_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  parent_version_id UUID REFERENCES content_submissions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_agent_slug UNIQUE (agent_id, slug),
  CONSTRAINT title_max_length CHECK (char_length(title) <= 100),
  CONSTRAINT excerpt_max_length CHECK (excerpt IS NULL OR char_length(excerpt) <= 250),
  CONSTRAINT seo_meta_description_max_length CHECK (seo_meta_description IS NULL OR char_length(seo_meta_description) <= 160)
);

-- Indexes
CREATE INDEX idx_content_agent_id ON content_submissions(agent_id);
CREATE INDEX idx_content_status ON content_submissions(status);
CREATE INDEX idx_content_status_agent_id ON content_submissions(status, agent_id);
CREATE INDEX idx_content_published_at ON content_submissions(published_at) WHERE status = 'published';
CREATE INDEX idx_content_reviewed_by ON content_submissions(reviewed_by_user_id) WHERE reviewed_by_user_id IS NOT NULL;

-- Comments
COMMENT ON TABLE content_submissions IS 'User-generated content (blog posts, area guides, reviews, fee structures)';
COMMENT ON COLUMN content_submissions.content_body IS 'HTML content from Tiptap rich text editor';
COMMENT ON COLUMN content_submissions.status IS 'Workflow: draft → pending_review → approved → published (or rejected)';
COMMENT ON COLUMN content_submissions.parent_version_id IS 'Links to previous version for version history';
