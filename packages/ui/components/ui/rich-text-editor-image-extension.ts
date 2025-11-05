import { Node } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { createClient } from '@supabase/supabase-js';

/**
 * Custom Tiptap Image Extension with Supabase Storage Upload
 *
 * Handles:
 * - Drag and drop image uploads
 * - Paste image uploads
 * - Upload to Supabase Storage
 * - Progress tracking
 * - Error handling
 */

interface ImageUploadOptions {
  supabaseUrl: string;
  supabaseAnonKey: string;
  storageBucket: string;
  maxFileSize?: number; // in bytes, default 5MB
}

export const ImageUploadExtension = (options: ImageUploadOptions) => {
  const { supabaseUrl, supabaseAnonKey, storageBucket, maxFileSize = 5 * 1024 * 1024 } = options;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  /**
   * Upload image file to Supabase Storage
   */
  async function uploadImage(file: File): Promise<string> {
    // Validate file size
    if (file.size > maxFileSize) {
      throw new Error(`File size exceeds ${maxFileSize / (1024 * 1024)}MB limit`);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `content-images/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(storageBucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(storageBucket)
      .getPublicUrl(filePath);

    return publicUrl;
  }

  /**
   * Handle dropped or pasted files
   */
  function handleImageUpload(file: File, view: any, pos: number) {
    // Show placeholder while uploading
    const placeholderNode = view.state.schema.nodes.image.create({
      src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
      alt: 'Uploading...',
    });

    const transaction = view.state.tr.insert(pos, placeholderNode);
    view.dispatch(transaction);

    // Upload the image
    uploadImage(file)
      .then((url) => {
        // Replace placeholder with actual image
        const { schema } = view.state;
        const node = schema.nodes.image.create({ src: url, alt: file.name });
        const transaction = view.state.tr.replaceWith(pos, pos + 1, node);
        view.dispatch(transaction);
      })
      .catch((error) => {
        console.error('Image upload failed:', error);
        // Remove placeholder on error
        const transaction = view.state.tr.delete(pos, pos + 1);
        view.dispatch(transaction);
        // Log error for debugging
        if (typeof window !== 'undefined') {
          window.alert(`Image upload failed: ${error.message}`);
        }
      });
  }

  /**
   * Tiptap Plugin for handling image uploads
   */
  const uploadPlugin = new Plugin({
    key: new PluginKey('imageUpload'),
    props: {
      handlePaste(view: any, event: ClipboardEvent) {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItems = items.filter((item: DataTransferItem) => item.type.startsWith('image/'));

        if (imageItems.length === 0) {
          return false;
        }

        event.preventDefault();

        imageItems.forEach((item: DataTransferItem) => {
          const file = item.getAsFile();
          if (file) {
            const pos = view.state.selection.from;
            handleImageUpload(file, view, pos);
          }
        });

        return true;
      },
      handleDrop(view: any, event: DragEvent) {
        const hasFiles = event.dataTransfer?.files?.length;

        if (!hasFiles) {
          return false;
        }

        const images = Array.from(event.dataTransfer.files).filter((file: File) =>
          file.type.startsWith('image/')
        );

        if (images.length === 0) {
          return false;
        }

        event.preventDefault();

        const { schema } = view.state;
        const coordinates = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });

        images.forEach((file: File) => {
          const pos = coordinates?.pos ?? view.state.selection.from;
          handleImageUpload(file, view, pos);
        });

        return true;
      },
    },
  });

  return uploadPlugin;
};

/**
 * Helper function to create image upload extension with configuration
 */
export function createImageUploadExtension(options: ImageUploadOptions) {
  return Node.create({
    name: 'imageUpload',

    addProseMirrorPlugins() {
      return [ImageUploadExtension(options)];
    },
  });
}

export default ImageUploadExtension;
