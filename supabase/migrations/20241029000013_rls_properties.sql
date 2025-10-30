-- Row Level Security policies for properties table

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Agents can view their own properties
CREATE POLICY "Agents can view own properties"
  ON properties FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = (
        SELECT user_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can view all properties
CREATE POLICY "Admins can view all properties"
  ON properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Public (unauthenticated) can view non-hidden properties
CREATE POLICY "Public can view non-hidden properties"
  ON properties FOR SELECT
  USING (is_hidden = false);

-- Note: Only webhook endpoints (using service role key) can insert/update/delete properties
-- No INSERT/UPDATE/DELETE policies needed - handled at API route level with service role key
