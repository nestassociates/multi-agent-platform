-- Row Level Security policies for audit_logs table

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Note: Only API routes (using service role key) can insert audit logs
-- No INSERT policy needed - handled at API route level
