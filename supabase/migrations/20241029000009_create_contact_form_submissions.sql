-- Create contact_form_submissions table
-- Stores contact form submissions from agent microsites

CREATE TABLE contact_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  source_page TEXT, -- e.g., "/contact", "/properties/123"
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contact_form_agent_id ON contact_form_submissions(agent_id);
CREATE INDEX idx_contact_form_property_id ON contact_form_submissions(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX idx_contact_form_created_at ON contact_form_submissions(created_at);
CREATE INDEX idx_contact_form_email ON contact_form_submissions(email);

-- Comments
COMMENT ON TABLE contact_form_submissions IS 'Contact form submissions from agent microsites';
COMMENT ON COLUMN contact_form_submissions.property_id IS 'Optional - set if enquiry about specific property';
COMMENT ON COLUMN contact_form_submissions.source_page IS 'Page where form was submitted';
