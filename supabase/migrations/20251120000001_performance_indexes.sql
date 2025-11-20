-- Performance Optimization Migration
-- Add indexes for frequently queried columns to improve query performance

-- ============================================
-- PROFILES TABLE INDEXES
-- ============================================

-- Index on user_id for fast profile lookups (used in almost every query)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Index on email for login and search
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Index on role for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- AGENTS TABLE INDEXES
-- ============================================

-- Index on user_id for joining with profiles
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);

-- Index on subdomain for microsite routing lookups
CREATE INDEX IF NOT EXISTS idx_agents_subdomain ON agents(subdomain);

-- Index on status for filtering active agents
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

-- Index on apex27_branch_id for property sync matching
CREATE INDEX IF NOT EXISTS idx_agents_apex27_branch_id ON agents(apex27_branch_id) WHERE apex27_branch_id IS NOT NULL;

-- Composite index for common queries (status + created_at for pagination)
CREATE INDEX IF NOT EXISTS idx_agents_status_created ON agents(status, created_at DESC);

-- ============================================
-- PROPERTIES TABLE INDEXES
-- ============================================

-- Index on agent_id for fetching agent's properties
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id);

-- Index on apex27_id for webhook updates
CREATE INDEX IF NOT EXISTS idx_properties_apex27_id ON properties(apex27_id);

-- Index on status for filtering available properties
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);

-- Index on transaction_type for filtering sale vs let
CREATE INDEX IF NOT EXISTS idx_properties_transaction_type ON properties(transaction_type);

-- Composite index for public API searches (status + transaction_type + price)
CREATE INDEX IF NOT EXISTS idx_properties_search ON properties(status, transaction_type, price) WHERE status = 'available';

-- Index on postcode for location searches
CREATE INDEX IF NOT EXISTS idx_properties_postcode ON properties(postcode);

-- Index on bedrooms for filtering
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON properties(bedrooms) WHERE bedrooms IS NOT NULL;

-- GiST index on location for spatial queries (if using PostGIS)
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties USING GIST(location);

-- Composite index for property listing page (agent + status + updated_at)
CREATE INDEX IF NOT EXISTS idx_properties_agent_status_updated ON properties(agent_id, status, updated_at DESC);

-- ============================================
-- CONTENT_SUBMISSIONS TABLE INDEXES
-- ============================================

-- Index on agent_id for fetching agent's content
CREATE INDEX IF NOT EXISTS idx_content_agent_id ON content_submissions(agent_id);

-- Index on status for moderation queue
CREATE INDEX IF NOT EXISTS idx_content_status ON content_submissions(status);

-- Index on slug for URL routing
CREATE INDEX IF NOT EXISTS idx_content_slug ON content_submissions(slug);

-- Composite index for moderation queue (status + created_at)
CREATE INDEX IF NOT EXISTS idx_content_moderation ON content_submissions(status, created_at DESC) WHERE status = 'pending_review';

-- Composite index for agent's content tab (agent + status + updated_at)
CREATE INDEX IF NOT EXISTS idx_content_agent_status_updated ON content_submissions(agent_id, status, updated_at DESC);

-- ============================================
-- BUILD_QUEUE TABLE INDEXES
-- ============================================

-- Index on agent_id for agent's build history
CREATE INDEX IF NOT EXISTS idx_build_queue_agent_id ON build_queue(agent_id);

-- Index on status for finding pending builds
CREATE INDEX IF NOT EXISTS idx_build_queue_status ON build_queue(status);

-- Composite index for queue processing (status + priority + created_at)
-- This is critical for the cron job that processes builds
CREATE INDEX IF NOT EXISTS idx_build_queue_processing ON build_queue(status, priority, created_at) WHERE status = 'pending';

-- Composite index for admin dashboard (agent + status + created_at)
CREATE INDEX IF NOT EXISTS idx_build_queue_admin ON build_queue(agent_id, status, created_at DESC);

-- ============================================
-- TERRITORIES TABLE INDEXES
-- ============================================

-- Index on agent_id for agent's assigned territories
CREATE INDEX IF NOT EXISTS idx_territories_agent_id ON territories(agent_id);

-- GiST index on boundary for spatial overlap queries
CREATE INDEX IF NOT EXISTS idx_territories_boundary ON territories USING GIST(boundary);

-- ============================================
-- AUDIT_LOGS TABLE INDEXES
-- ============================================

-- Index on user_id for user activity tracking
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Index on entity_type for filtering by entity
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);

-- Index on entity_id for entity history
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);

-- Composite index for webhook replay detection (entity_type + entity_id + action)
CREATE INDEX IF NOT EXISTS idx_audit_logs_webhook ON audit_logs(entity_type, entity_id, action) WHERE entity_type = 'webhook';

-- Index on created_at for time-based queries and cleanup
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- GLOBAL_CONTENT TABLE INDEXES
-- ============================================

-- Index on content_type for fetching header/footer
CREATE INDEX IF NOT EXISTS idx_global_content_type ON global_content(content_type);

-- Index on is_published for fetching published content
CREATE INDEX IF NOT EXISTS idx_global_content_published ON global_content(is_published, content_type) WHERE is_published = true;

-- Composite index for version history (content_type + version)
CREATE INDEX IF NOT EXISTS idx_global_content_versions ON global_content(content_type, version DESC);

-- ============================================
-- CONTACT_FORM_SUBMISSIONS TABLE INDEXES
-- ============================================

-- Index on agent_id for agent's lead tracking
CREATE INDEX IF NOT EXISTS idx_contact_form_agent_id ON contact_form_submissions(agent_id);

-- Index on created_at for recent submissions
CREATE INDEX IF NOT EXISTS idx_contact_form_created_at ON contact_form_submissions(created_at DESC);

-- Index on status (if you add a status field in future)
-- CREATE INDEX IF NOT EXISTS idx_contact_form_status ON contact_form_submissions(status);

-- ============================================
-- ANALYZE TABLES
-- ============================================

-- Update table statistics for query planner
ANALYZE profiles;
ANALYZE agents;
ANALYZE properties;
ANALYZE content_submissions;
ANALYZE build_queue;
ANALYZE territories;
ANALYZE audit_logs;
ANALYZE global_content;
ANALYZE contact_form_submissions;

-- ============================================
-- VERIFY INDEXES
-- ============================================

-- Query to verify all indexes were created successfully
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'agents', 'properties', 'content_submissions',
    'build_queue', 'territories', 'audit_logs', 'global_content',
    'contact_form_submissions'
  )
ORDER BY tablename, indexname;
