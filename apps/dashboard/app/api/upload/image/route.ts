import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { cropToSquare, isValidImage } from '@/lib/image-processor';

/**
 * POST /api/upload/image
 * Upload and process image with auto-crop to square
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'avatars';

    if (!file) {
      return NextResponse.json(
        { error: { code: 'NO_FILE', message: 'No file provided' } },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: { code: 'FILE_TOO_LARGE', message: 'File size must be less than 5MB' } },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate image format
    const isValid = await isValidImage(buffer);
    if (!isValid) {
      return NextResponse.json(
        { error: { code: 'INVALID_FORMAT', message: 'File must be a valid image (JPEG, PNG, WebP, GIF)' } },
        { status: 400 }
      );
    }

    // Auto-crop to square (400x400)
    const processedBuffer = await cropToSquare(buffer, 400);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const filename = `${user.id}/${timestamp}-${randomString}.jpg`;

    // Upload to Supabase Storage
    const supabase = createServiceRoleClient();

    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filename, processedBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '31536000', // 1 year
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: { code: 'UPLOAD_ERROR', message: uploadError.message } },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      path: data.path,
      size: processedBuffer.length,
    });
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'An error occurred' } },
      { status: 500 }
    );
  }
}
