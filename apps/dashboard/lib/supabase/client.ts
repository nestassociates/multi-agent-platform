import { createBrowserClient } from '@supabase/ssr';

// Database types available at ./database.types.ts for type-safe queries
// Usage: import type { Database } from '@/lib/supabase/database.types'

/**
 * Create Supabase client for browser/client-side use
 * Uses localStorage for session persistence
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
