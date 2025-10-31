import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Factory
 * Creates server and browser clients with proper configuration
 */

// Validate environment variables
function validateEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return { url, anonKey };
}

/**
 * Create browser/client-side Supabase client
 * Uses anon key, respects RLS policies
 */
export function createBrowserClient() {
  const { url, anonKey } = validateEnv();

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Create server-side Supabase client with anon key
 * Uses anon key, respects RLS policies
 * Use this for most server-side operations
 */
export function createServerClient() {
  const { url, anonKey } = validateEnv();

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Create server-side Supabase client with service role key
 * BYPASSES RLS policies - use with extreme caution
 * Only use for webhook endpoints, cron jobs, admin operations
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase service role key');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Type-safe database client
 * Extend this with custom types if needed
 */
export type SupabaseClient = ReturnType<typeof createBrowserClient>;
