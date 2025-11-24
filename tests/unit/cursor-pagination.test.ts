/**
 * Unit Tests: Cursor Pagination Utilities
 * Tests encoding, decoding, and pagination response building
 */

import { describe, it, expect } from '@jest/globals';
import {
  encodeCursor,
  decodeCursor,
  buildPaginationResponse,
  type CursorData,
} from '../../apps/dashboard/lib/cursor-pagination';

describe('Cursor Pagination Utilities', () => {
  describe('encodeCursor', () => {
    it('should encode cursor data to Base64 string', () => {
      const cursorData: CursorData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        created_at: '2025-01-15T10:30:00Z',
      };

      const encoded = encodeCursor(cursorData);

      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
      // Verify it's valid Base64
      expect(() => Buffer.from(encoded, 'base64')).not.toThrow();
    });

    it('should produce consistent output for same input', () => {
      const cursorData: CursorData = {
        id: '123',
        created_at: '2025-01-01T00:00:00Z',
      };

      const encoded1 = encodeCursor(cursorData);
      const encoded2 = encodeCursor(cursorData);

      expect(encoded1).toBe(encoded2);
    });

    it('should handle special characters in timestamps', () => {
      const cursorData: CursorData = {
        id: 'test-id-123',
        created_at: '2025-01-15T10:30:45.123Z',
      };

      const encoded = encodeCursor(cursorData);
      expect(encoded).toBeTruthy();
    });
  });

  describe('decodeCursor', () => {
    it('should decode valid cursor string', () => {
      const original: CursorData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        created_at: '2025-01-15T10:30:00Z',
      };

      const encoded = encodeCursor(original);
      const decoded = decodeCursor(encoded);

      expect(decoded).toEqual(original);
    });

    it('should return null for invalid Base64', () => {
      const invalidCursor = 'not-valid-base64!!!';
      const decoded = decodeCursor(invalidCursor);

      expect(decoded).toBeNull();
    });

    it('should return null for malformed JSON', () => {
      const invalidJson = Buffer.from('not json at all').toString('base64');
      const decoded = decodeCursor(invalidJson);

      expect(decoded).toBeNull();
    });

    it('should return null for JSON without required fields', () => {
      const missingFields = Buffer.from(JSON.stringify({ id: '123' })).toString('base64');
      const decoded = decodeCursor(missingFields);

      expect(decoded).toBeNull();
    });

    it('should return null for empty cursor', () => {
      const decoded = decodeCursor('');
      expect(decoded).toBeNull();
    });

    it('should handle round-trip encoding/decoding', () => {
      const testCases: CursorData[] = [
        { id: '1', created_at: '2025-01-01T00:00:00Z' },
        { id: 'abc-123-def', created_at: '2025-12-31T23:59:59.999Z' },
        { id: '123e4567-e89b-12d3-a456-426614174000', created_at: '2025-06-15T12:30:45.123Z' },
      ];

      testCases.forEach((original) => {
        const encoded = encodeCursor(original);
        const decoded = decodeCursor(encoded);
        expect(decoded).toEqual(original);
      });
    });
  });

  describe('buildPaginationResponse', () => {
    const mockData: (CursorData & { title: string })[] = [
      { id: '1', created_at: '2025-01-01T00:00:00Z', title: 'Item 1' },
      { id: '2', created_at: '2025-01-02T00:00:00Z', title: 'Item 2' },
      { id: '3', created_at: '2025-01-03T00:00:00Z', title: 'Item 3' },
    ];

    it('should build pagination response with hasNextPage false when data length equals limit', () => {
      const response = buildPaginationResponse(mockData, 3);

      expect(response.data).toHaveLength(3);
      expect(response.pagination.hasNextPage).toBe(false);
      expect(response.pagination.nextCursor).toBeNull();
    });

    it('should build pagination response with hasNextPage true when data length exceeds limit', () => {
      const dataWithExtra = [...mockData, { id: '4', created_at: '2025-01-04T00:00:00Z', title: 'Item 4' }];
      const response = buildPaginationResponse(dataWithExtra, 3);

      expect(response.data).toHaveLength(3); // Should trim to limit
      expect(response.pagination.hasNextPage).toBe(true);
      expect(response.pagination.nextCursor).toBeTruthy();
    });

    it('should return correct nextCursor for last item when hasNextPage is true', () => {
      const dataWithExtra = [...mockData, { id: '4', created_at: '2025-01-04T00:00:00Z', title: 'Item 4' }];
      const response = buildPaginationResponse(dataWithExtra, 3);

      expect(response.pagination.nextCursor).toBeTruthy();

      // Decode cursor and verify it points to the last returned item
      const cursor = response.pagination.nextCursor!;
      const decoded = decodeCursor(cursor);

      expect(decoded).not.toBeNull();
      expect(decoded!.id).toBe('3'); // Last item in trimmed result
      expect(decoded!.created_at).toBe('2025-01-03T00:00:00Z');
    });

    it('should handle empty data array', () => {
      const response = buildPaginationResponse([], 10);

      expect(response.data).toHaveLength(0);
      expect(response.pagination.hasNextPage).toBe(false);
      expect(response.pagination.nextCursor).toBeNull();
    });

    it('should handle single item', () => {
      const singleItem = [mockData[0]];
      const response = buildPaginationResponse(singleItem, 10);

      expect(response.data).toHaveLength(1);
      expect(response.pagination.hasNextPage).toBe(false);
      expect(response.pagination.nextCursor).toBeNull();
    });

    it('should include total count when provided', () => {
      const response = buildPaginationResponse(mockData, 3, 100);

      expect(response.pagination.total).toBe(100);
    });

    it('should not include total when not provided', () => {
      const response = buildPaginationResponse(mockData, 3);

      expect(response.pagination.total).toBeUndefined();
    });

    it('should handle large limit', () => {
      const response = buildPaginationResponse(mockData, 1000);

      expect(response.data).toHaveLength(3);
      expect(response.pagination.hasNextPage).toBe(false);
    });

    it('should correctly slice data when hasNextPage is true', () => {
      const largeData = Array.from({ length: 25 }, (_, i) => ({
        id: `${i + 1}`,
        created_at: `2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
        title: `Item ${i + 1}`,
      }));

      const response = buildPaginationResponse(largeData, 20);

      expect(response.data).toHaveLength(20);
      expect(response.pagination.hasNextPage).toBe(true);
      expect(response.data[0].id).toBe('1');
      expect(response.data[19].id).toBe('20');
    });
  });

  describe('Integration: Encode -> Decode -> Paginate', () => {
    it('should work end-to-end with cursor-based pagination', () => {
      const allData = Array.from({ length: 50 }, (_, i) => ({
        id: `item-${i + 1}`,
        created_at: new Date(2025, 0, i + 1).toISOString(),
        title: `Item ${i + 1}`,
      }));

      // Page 1: Get first 10 items
      const page1 = buildPaginationResponse(allData.slice(0, 11), 10);
      expect(page1.data).toHaveLength(10);
      expect(page1.pagination.hasNextPage).toBe(true);

      // Decode cursor from page 1
      const cursor1 = page1.pagination.nextCursor!;
      const decoded1 = decodeCursor(cursor1);
      expect(decoded1).not.toBeNull();
      expect(decoded1!.id).toBe('item-10');

      // Page 2: Simulate fetching next page using cursor
      // In real app, would query DB with: WHERE (created_at, id) < (cursor.created_at, cursor.id)
      const page2Start = allData.findIndex((item) => item.id === decoded1!.id) + 1;
      const page2 = buildPaginationResponse(allData.slice(page2Start, page2Start + 11), 10);

      expect(page2.data).toHaveLength(10);
      expect(page2.data[0].id).toBe('item-11');
      expect(page2.pagination.hasNextPage).toBe(true);
    });
  });
});
