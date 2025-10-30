-- Row Level Security policies for content_submissions table

-- Enable RLS
ALTER TABLE content_submissions ENABLE ROW LEVEL SECURITY;

-- Agents can view their own content
CREATE POLICY "Agents can view own content"
  ON content_submissions FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = (
        SELECT user_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Agents can insert own content
CREATE POLICY "Agents can create content"
  ON content_submissions FOR INSERT
  WITH CHECK (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = (
        SELECT user_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Agents can update own draft/rejected content only
CREATE POLICY "Agents can update own draft/rejected content"
  ON content_submissions FOR UPDATE
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = (
        SELECT user_id FROM profiles WHERE user_id = auth.uid()
      )
    ) AND status IN ('draft', 'rejected')
  );

-- Agents can delete own draft content
CREATE POLICY "Agents can delete own draft content"
  ON content_submissions FOR DELETE
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = (
        SELECT user_id FROM profiles WHERE user_id = auth.uid()
      )
    ) AND status = 'draft'
  );

-- Admins can view all content
CREATE POLICY "Admins can view all content"
  ON content_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Admins can update content (approve/reject)
CREATE POLICY "Admins can moderate content"
  ON content_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Public can view published content
CREATE POLICY "Public can view published content"
  ON content_submissions FOR SELECT
  USING (status = 'published');
