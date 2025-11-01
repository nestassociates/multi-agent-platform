'use client';

import { useState } from 'react';


interface ImageUploadProps {
  currentImageUrl?: string;
  onUploadComplete: (url: string) => void;
  bucket?: string;
  maxSize?: number; // in MB
}

export default function ImageUpload({
  currentImageUrl,
  onUploadComplete,
  bucket = 'avatars',
  maxSize = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(currentImageUrl);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);

      // Upload to server endpoint
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      const publicUrl = data.url;

      setPreview(publicUrl);
      onUploadComplete(publicUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {preview && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="h-32 w-32 rounded-full object-cover border-2 border-gray-200"
          />
        </div>
      )}

      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-primary-50 file:text-primary-700
            hover:file:bg-primary-100
            disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-gray-500">
          PNG, JPG or GIF (max {maxSize}MB). Will be cropped to square.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
    </div>
  );
}
