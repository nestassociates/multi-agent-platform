/**
 * Cursor Pagination Utilities
 *
 * Implements cursor-based pagination for efficient navigation of large datasets.
 * Uses Base64-encoded cursor containing {id, created_at} for stable ordering.
 */

export interface CursorData {
  id: string;
  created_at: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    previousCursor: string | null;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    total?: number;
  };
}

/**
 * Encode cursor data to Base64 string for pagination
 *
 * @param item - Object containing id and created_at fields
 * @returns Base64-encoded cursor string
 *
 * @example
 * const cursor = encodeCursor({ id: '123', created_at: '2025-01-01T00:00:00Z' });
 * // Returns: 'eyJpZCI6IjEyMyIsImNyZWF0ZWRfYXQiOiIyMDI1LTAxLTAxVDAwOjAwOjAwWiJ9'
 */
export function encodeCursor(item: CursorData): string {
  const cursorData = {
    id: item.id,
    created_at: item.created_at,
  };
  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
}

/**
 * Decode Base64 cursor string to cursor data
 *
 * @param cursor - Base64-encoded cursor string
 * @returns Decoded cursor data or null if invalid
 *
 * @example
 * const data = decodeCursor('eyJpZCI6IjEyMyIsImNyZWF0ZWRfYXQiOiIyMDI1LTAxLTAxVDAwOjAwOjAwWiJ9');
 * // Returns: { id: '123', created_at: '2025-01-01T00:00:00Z' }
 */
export function decodeCursor(cursor: string): CursorData | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const data = JSON.parse(decoded) as CursorData;

    // Validate decoded data has required fields
    if (!data.id || !data.created_at) {
      return null;
    }

    return data;
  } catch (error) {
    // Invalid Base64 or malformed JSON
    return null;
  }
}

/**
 * Build pagination response with cursors
 *
 * @param data - Array of items (should have limit+1 items to detect hasNextPage)
 * @param limit - Items per page
 * @param total - Optional total count
 * @returns Pagination response with data and pagination metadata
 *
 * @example
 * const items = await fetchItems(limit + 1);
 * const response = buildPaginationResponse(items, 20);
 */
export function buildPaginationResponse<T extends CursorData>(
  data: T[],
  limit: number,
  total?: number
): PaginationResponse<T> {
  const hasNextPage = data.length > limit;
  const items = hasNextPage ? data.slice(0, limit) : data;

  const nextCursor = hasNextPage && items.length > 0
    ? encodeCursor(items[items.length - 1])
    : null;

  return {
    data: items,
    pagination: {
      nextCursor,
      previousCursor: null, // Forward-only pagination for now
      hasNextPage,
      hasPreviousPage: false, // Not implemented yet
      total,
    },
  };
}
