-- Migration: Archive deprecated content types (review, fee_structure)
-- Feature: 005-separate-reviews-fees
-- Date: 2025-11-26

-- Add archive flag to content_submissions table
ALTER TABLE content_submissions ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Archive all existing review and fee_structure content
UPDATE content_submissions
SET is_archived = TRUE, updated_at = NOW()
WHERE content_type IN ('review', 'fee_structure');

-- Drop old CHECK constraint
ALTER TABLE content_submissions DROP CONSTRAINT IF EXISTS content_submissions_content_type_check;

-- Add new CHECK constraint that allows old types only when archived
ALTER TABLE content_submissions ADD CONSTRAINT content_submissions_content_type_check
CHECK (
  is_archived = TRUE OR
  content_type IN ('blog_post', 'area_guide')
);

-- Create partial index for efficient queries on non-archived content
CREATE INDEX IF NOT EXISTS idx_content_archived ON content_submissions(is_archived) WHERE is_archived = FALSE;

-- Add comment for documentation
COMMENT ON COLUMN content_submissions.is_archived IS 'Soft delete flag for deprecated content types (review, fee_structure)';
