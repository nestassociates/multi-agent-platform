import sharp from 'sharp';

/**
 * Auto-crop image to square aspect ratio and resize
 * @param buffer - Image buffer
 * @param size - Target size in pixels (default: 400x400)
 * @returns Processed image buffer
 */
export async function cropToSquare(buffer: Buffer, size: number = 400): Promise<Buffer> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to read image dimensions');
    }

    // Calculate crop dimensions to make it square
    const minDimension = Math.min(metadata.width, metadata.height);

    // Crop to square from center
    const processedImage = await image
      .extract({
        left: Math.floor((metadata.width - minDimension) / 2),
        top: Math.floor((metadata.height - minDimension) / 2),
        width: minDimension,
        height: minDimension,
      })
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    return processedImage;
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * Validate image file type
 * @param buffer - Image buffer
 * @returns true if valid image format
 */
export async function isValidImage(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata();
    const validFormats = ['jpeg', 'png', 'webp', 'gif'];
    return validFormats.includes(metadata.format || '');
  } catch {
    return false;
  }
}

/**
 * Get image dimensions
 * @param buffer - Image buffer
 * @returns Width and height in pixels
 */
export async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
  const metadata = await sharp(buffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image dimensions');
  }

  return {
    width: metadata.width,
    height: metadata.height,
  };
}

/**
 * Optimize image for web (compress and resize)
 * @param buffer - Image buffer
 * @param maxWidth - Maximum width (default: 1200)
 * @param quality - JPEG quality 1-100 (default: 85)
 * @returns Optimized image buffer
 */
export async function optimizeImage(
  buffer: Buffer,
  maxWidth: number = 1200,
  quality: number = 85
): Promise<Buffer> {
  return await sharp(buffer)
    .resize(maxWidth, null, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality })
    .toBuffer();
}
