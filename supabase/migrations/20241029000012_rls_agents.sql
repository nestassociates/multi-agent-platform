-- Row Level Security policies for agents table

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Agents can view their own agent record
CREATE POLICY "Agents can view own agent record"
  ON agents FOR SELECT
  USING (
    user_id = (SELECT user_id FROM profiles WHERE user_id = auth.uid())
  );

-- Agents can update their own agent record (except status, subdomain)
CREATE POLICY "Agents can update own agent record"
  ON agents FOR UPDATE
  USING (
    user_id = (SELECT user_id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT user_id FROM profiles WHERE user_id = auth.uid()) AND
    status = OLD.status AND
    subdomain = OLD.subdomain
  );

-- Admins can view all agents
CREATE POLICY "Admins can view all agents"
  ON agents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Admins can insert/update/delete agents
CREATE POLICY "Admins can insert agents"
  ON agents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update agents"
  ON agents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can delete agents"
  ON agents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );
