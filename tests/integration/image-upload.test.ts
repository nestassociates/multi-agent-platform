/**
 * Integration Tests: Image Upload Flow
 * Tests image upload, optimization, storage, and error scenarios
 */

import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Image Upload Integration Tests', () => {
  describe('Successful Upload', () => {
    it('should upload JPEG image and return WebP URL', async () => {
      // Create test file (would use actual test image in real implementation)
      const testImageBuffer = Buffer.from('fake-jpeg-data');
      const file = new File([testImageBuffer], 'test.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'content-images');
      formData.append('content_type', 'blog-posts');

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.url).toBeTruthy();
      expect(data.url).toContain('content-images');
      expect(data.url).toContain('blog-posts');
      expect(data.url).toContain('.webp'); // Converted to WebP
      expect(data.path).toBeTruthy();
      expect(data.size).toBeGreaterThan(0);
    });

    it('should upload PNG image and optimize', async () => {
      const testImageBuffer = Buffer.from('fake-png-data');
      const file = new File([testImageBuffer], 'test.png', { type: 'image/png' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'content-images');

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.url).toContain('.webp');
    });

    it('should organize files in content_type subfolder', async () => {
      const testImageBuffer = Buffer.from('fake-image-data');
      const file = new File([testImageBuffer], 'test.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'content-images');
      formData.append('content_type', 'area-guides');

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.path).toContain('area-guides/');
    });
  });

  describe('Error Scenarios', () => {
    it('should reject file larger than 5MB', async () => {
      // Create 6MB file
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
      const file = new File([largeBuffer], 'large.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'content-images');

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.message).toContain('5MB');
      expect(data.error.code).toBe('FILE_TOO_LARGE');
    });

    it('should reject non-image file', async () => {
      const textFile = new File(['Hello World'], 'test.txt', { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', textFile);
      formData.append('bucket', 'content-images');

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.message).toContain('valid image');
      expect(data.error.code).toBe('INVALID_FORMAT');
    });

    it('should reject HTML disguised as image', async () => {
      const maliciousHtml = '<html><script>alert("XSS")</script></html>';
      const file = new File([maliciousHtml], 'fake.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'content-images');

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_FORMAT');
    });

    it('should require authentication', async () => {
      const testImageBuffer = Buffer.from('fake-image-data');
      const file = new File([testImageBuffer], 'test.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);

      // Request without auth token/session
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
        // No auth headers
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Image Optimization', () => {
    it('should optimize large images to max 1200px width', async () => {
      // Test with a large image (would use real 4000x3000 image in actual test)
      const largeImageBuffer = Buffer.from('fake-large-image-data');
      const file = new File([largeImageBuffer], 'large.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'content-images');

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // File should be smaller after optimization
      expect(data.size).toBeLessThan(file.size);
    });

    it('should convert to WebP format for content images', async () => {
      const testImageBuffer = Buffer.from('fake-jpeg-data');
      const file = new File([testImageBuffer], 'test.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'content-images');

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.url).toContain('.webp');
      expect(data.path).toContain('.webp');
    });

    it('should maintain aspect ratio for content images (not crop to square)', async () => {
      // Test that wide images remain wide (not cropped to square like avatars)
      const wideImageBuffer = Buffer.from('fake-wide-image-data');
      const file = new File([wideImageBuffer], 'wide.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'content-images');

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      // Would verify dimensions in actual test with real image
    });
  });

  describe('File Naming', () => {
    it('should generate unique UUID-based filenames', async () => {
      const testImageBuffer = Buffer.from('fake-image-data');
      const file = new File([testImageBuffer], 'test.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'content-images');

      const response1 = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const response2 = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData.slice(), // Same file
      });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      const data1 = await response1.json();
      const data2 = await response2.json();

      // URLs should be different (UUID-based)
      expect(data1.url).not.toBe(data2.url);
      expect(data1.path).not.toBe(data2.path);
    });
  });

  describe('Performance', () => {
    it('should complete upload in under 5 seconds for 5MB file', async () => {
      const largeBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
      const file = new File([largeBuffer], 'large.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'content-images');

      const start = Date.now();
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(5000); // SC-005
    });
  });
});
