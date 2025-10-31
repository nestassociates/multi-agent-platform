-- Create database functions and triggers

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-set submitted_at and published_at for content
CREATE OR REPLACE FUNCTION set_content_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending_review' AND OLD.status != 'pending_review' THEN
    NEW.submitted_at = NOW();
  END IF;
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_territories_updated_at
  BEFORE UPDATE ON territories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_submissions_updated_at
  BEFORE UPDATE ON content_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_build_queue_updated_at
  BEFORE UPDATE ON build_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_content_updated_at
  BEFORE UPDATE ON global_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply content submission timestamp trigger
CREATE TRIGGER set_content_submission_timestamps
  BEFORE UPDATE ON content_submissions
  FOR EACH ROW
  EXECUTE FUNCTION set_content_timestamps();

-- Comments
COMMENT ON FUNCTION update_updated_at_column IS 'Automatically sets updated_at to current timestamp on row update';
COMMENT ON FUNCTION set_content_timestamps IS 'Automatically sets submitted_at and published_at based on status transitions';
