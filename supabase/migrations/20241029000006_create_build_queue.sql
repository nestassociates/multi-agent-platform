-- Create build_queue table
-- Tracks pending and completed static site builds

CREATE TABLE build_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 4),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  trigger_reason TEXT NOT NULL,
  build_logs TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_build_queue_agent_id ON build_queue(agent_id);
CREATE INDEX idx_build_queue_status ON build_queue(status);

-- Index for processing queue (priority, created_at) for pending builds
CREATE INDEX idx_build_queue_processing ON build_queue(priority, created_at) WHERE status = 'pending';

-- Unique index: only one pending build per agent at a time (prevents queue flooding)
CREATE UNIQUE INDEX idx_build_queue_pending_agent ON build_queue(agent_id) WHERE status = 'pending';

-- Comments
COMMENT ON TABLE build_queue IS 'Queue of static site builds for agent microsites';
COMMENT ON COLUMN build_queue.priority IS 'Priority levels: 1=Emergency, 2=High (5min), 3=Normal (30min), 4=Low (24h)';
COMMENT ON COLUMN build_queue.status IS 'Build status: pending → processing → completed/failed';
COMMENT ON INDEX idx_build_queue_pending_agent IS 'Prevents duplicate pending builds for same agent';
