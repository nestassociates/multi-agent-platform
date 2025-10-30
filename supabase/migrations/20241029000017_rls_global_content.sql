-- Row Level Security policies for global_content table

-- Enable RLS
ALTER TABLE global_content ENABLE ROW LEVEL SECURITY;

-- Admins can view all global content
CREATE POLICY "Admins can view global content"
  ON global_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Admins can insert/update global content
CREATE POLICY "Admins can manage global content"
  ON global_content FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Public can view published global content
CREATE POLICY "Public can view published global content"
  ON global_content FOR SELECT
  USING (is_published = true);
