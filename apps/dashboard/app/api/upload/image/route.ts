import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { cropToSquare, isValidImage, optimizeImage } from '@/lib/image-processor';
import { randomUUID } from 'crypto';

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
    const contentType = (formData.get('content_type') as string) || '';

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
        { error: { code: 'FILE_TOO_LARGE', message: `File size must be less than 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.` } },
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
        { error: { code: 'INVALID_FORMAT', message: 'File must be a valid image (JPEG, PNG, WebP, or GIF)' } },
        { status: 400 }
      );
    }

    // Process image based on bucket type
    let processedBuffer: Buffer;
    let fileExtension: string;

    if (bucket === 'avatars') {
      // Avatars: Crop to square (400x400)
      processedBuffer = await cropToSquare(buffer, 400);
      fileExtension = 'jpg';
    } else {
      // Content images: Optimize without cropping (1200px max width, WebP)
      processedBuffer = await optimizeImage(buffer, 1200, 85);
      fileExtension = 'webp';
    }

    // Generate unique filename with folder structure
    const uuid = randomUUID();
    const folder = contentType ? `${contentType}/` : '';
    const filename = `${user.id}/${folder}${uuid}.${fileExtension}`;

    // Upload to Supabase Storage
    const supabase = createServiceRoleClient();

    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filename, processedBuffer, {
        contentType: fileExtension === 'webp' ? 'image/webp' : 'image/jpeg',
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
