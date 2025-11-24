-- Create content-images bucket for agent-uploaded images
-- Feature: 003-content-submission-refactor
-- Date: 2025-11-24

-- Create bucket with 5MB file size limit
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-images',
  'content-images',
  true, -- Public read access for published content
  5242880, -- 5MB limit (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Agent can upload to own folder
-- Folder structure: content-images/{user_id}/{content_type}/{uuid}.webp
CREATE POLICY "content_images_agent_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'content-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Agent can read own images
CREATE POLICY "content_images_agent_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'content-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Public can view all images (for published content on agent sites)
CREATE POLICY "content_images_public_select"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'content-images');

-- RLS Policy: Agent can update (replace) own images
CREATE POLICY "content_images_agent_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'content-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'content-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Agent can delete own images
CREATE POLICY "content_images_agent_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'content-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add comments for documentation
COMMENT ON TABLE storage.buckets IS 'Storage buckets including content-images for agent content featured images';
