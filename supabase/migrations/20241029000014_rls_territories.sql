-- Row Level Security policies for territories table

-- Enable RLS
ALTER TABLE territories ENABLE ROW LEVEL SECURITY;

-- Agents can view their own territories
CREATE POLICY "Agents can view own territories"
  ON territories FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = (
        SELECT user_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can view all territories
CREATE POLICY "Admins can view all territories"
  ON territories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Admins can insert/update/delete territories
CREATE POLICY "Admins can manage territories"
  ON territories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Public can view all territories (for map display on main site)
CREATE POLICY "Public can view territories"
  ON territories FOR SELECT
  USING (true);
