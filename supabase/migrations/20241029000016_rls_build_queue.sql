-- Row Level Security policies for build_queue table

-- Enable RLS
ALTER TABLE build_queue ENABLE ROW LEVEL SECURITY;

-- Agents can view their own build queue
CREATE POLICY "Agents can view own build queue"
  ON build_queue FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = (
        SELECT user_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can view all build queue
CREATE POLICY "Admins can view all build queue"
  ON build_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Note: Only cron job and admin API (using service role key) can insert/update/delete
-- No INSERT/UPDATE/DELETE policies for regular users - handled at API route level
