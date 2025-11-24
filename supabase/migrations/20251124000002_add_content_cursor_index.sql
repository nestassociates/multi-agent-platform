-- Add indexes for cursor-based pagination on content_submissions
-- Feature: 003-content-submission-refactor
-- Date: 2025-11-24

-- Index for agent content lists (cursor pagination)
-- Supports efficient queries ordered by created_at DESC, id DESC
-- Filtered by agent_id for agent content lists
CREATE INDEX IF NOT EXISTS idx_content_cursor
ON content_submissions(agent_id, created_at DESC, id DESC)
WHERE status != 'deleted';

-- Index for admin moderation queue (cursor pagination)
-- Supports efficient queries for pending content ordered by submission date
-- Filtered by status for admin queue
CREATE INDEX IF NOT EXISTS idx_content_admin_cursor
ON content_submissions(status, created_at DESC, id DESC)
WHERE status = 'pending_review';

-- Index for filtering by content type with cursor pagination
-- Supports queries filtered by both agent and content type
CREATE INDEX IF NOT EXISTS idx_content_type_cursor
ON content_submissions(agent_id, content_type, created_at DESC, id DESC)
WHERE status != 'deleted';

-- Add comments for documentation
COMMENT ON INDEX idx_content_cursor IS 'Supports cursor pagination for agent content lists ordered by created_at DESC';
COMMENT ON INDEX idx_content_admin_cursor IS 'Supports cursor pagination for admin moderation queue filtered by pending_review status';
COMMENT ON INDEX idx_content_type_cursor IS 'Supports cursor pagination with content_type filter for agent content lists';
