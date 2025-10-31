-- Row Level Security policies for contact_form_submissions table

-- Enable RLS
ALTER TABLE contact_form_submissions ENABLE ROW LEVEL SECURITY;

-- Agents can view their own contact form submissions
CREATE POLICY "Agents can view own submissions"
  ON contact_form_submissions FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = (
        SELECT user_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
  ON contact_form_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Public (unauthenticated) can insert contact form submissions
CREATE POLICY "Public can submit contact forms"
  ON contact_form_submissions FOR INSERT
  WITH CHECK (true);
