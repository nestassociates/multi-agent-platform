-- Create audit_logs table
-- Tracks all sensitive operations for GDPR compliance and security auditing

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'view')),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Comments
COMMENT ON TABLE audit_logs IS 'Audit log for GDPR compliance and security monitoring';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity (agent, property, content_submission, etc.)';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous values for update actions (JSON)';
COMMENT ON COLUMN audit_logs.new_values IS 'New values for create/update actions (JSON)';
