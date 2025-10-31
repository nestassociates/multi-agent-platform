/**
 * Mock Supabase Client for Testing
 * Provides fake implementations for unit tests
 */

export function createMockSupabaseClient() {
  const mockData: Record<string, any[]> = {
    profiles: [],
    agents: [],
    properties: [],
    territories: [],
    content_submissions: [],
    build_queue: [],
  };

  return {
    from: (table: string) => ({
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            const item = mockData[table]?.find((row) => row[column] === value);
            return { data: item || null, error: item ? null : { message: 'Not found' } };
          },
          data: mockData[table]?.filter((row) => row[column] === value) || [],
        }),
        data: mockData[table] || [],
      }),
      insert: (values: any) => ({
        select: () => ({
          single: async () => {
            const newItem = { ...values, id: `mock-${Date.now()}`, created_at: new Date().toISOString() };
            mockData[table] = mockData[table] || [];
            mockData[table].push(newItem);
            return { data: newItem, error: null };
          },
        }),
      }),
      update: (values: any) => ({
        eq: (column: string, value: any) => ({
          async select() {
            const index = mockData[table]?.findIndex((row) => row[column] === value);
            if (index !== undefined && index !== -1) {
              mockData[table][index] = { ...mockData[table][index], ...values };
              return { data: mockData[table][index], error: null };
            }
            return { data: null, error: { message: 'Not found' } };
          },
        }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          async select() {
            mockData[table] = mockData[table]?.filter((row) => row[column] !== value) || [];
            return { data: null, error: null };
          },
        }),
      }),
    }),
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
    },
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, file: any) => ({
          data: { path: `mock/${path}` },
          error: null,
        }),
      }),
    },
  };
}
