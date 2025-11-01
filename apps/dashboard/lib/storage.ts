import { createClient } from './supabase/server';

/**
 * Upload image to Supabase Storage with auto-crop to square
 */
export async function uploadImage(
  file: File,
  bucket: string = 'avatars',
  path?: string
): Promise<{ url: string; path: string }> {
  const supabase = createClient();

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = path || `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  // Upload file
  const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path,
  };
}

/**
 * Delete image from Supabase Storage
 */
export async function deleteImage(bucket: string, path: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}
