import type { SupabaseClient } from './client';

/**
 * Common Database Query Helpers
 * Reusable query patterns for the Supabase database
 */

/**
 * Get user profile by user_id
 */
export async function getProfileByUserId(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get agent by user_id
 */
export async function getAgentByUserId(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from('agents')
    .select('*, profile:profiles!agents_user_id_fkey(*)')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get agent by ID with profile
 */
export async function getAgentById(client: SupabaseClient, agentId: string) {
  const { data, error } = await client
    .from('agents')
    .select('*, profile:profiles!agents_user_id_fkey(*)')
    .eq('id', agentId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get agent by subdomain
 */
export async function getAgentBySubdomain(client: SupabaseClient, subdomain: string) {
  const { data, error } = await client
    .from('agents')
    .select('*, profile:profiles!agents_user_id_fkey(*)')
    .eq('subdomain', subdomain)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get agent by Apex27 branch ID
 */
export async function getAgentByApex27BranchId(client: SupabaseClient, branchId: string) {
  const { data, error} = await client
    .from('agents')
    .select('id, user_id, subdomain')
    .eq('apex27_branch_id', branchId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * List properties for an agent
 */
export async function getPropertiesByAgentId(
  client: SupabaseClient,
  agentId: string,
  options?: { limit?: number; offset?: number }
) {
  let query = client
    .from('properties')
    .select('*', { count: 'exact' })
    .eq('agent_id', agentId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false });

  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 20) - 1);

  const { data, error, count } = await query;

  if (error) throw error;
  return { data, count };
}

/**
 * Get content submissions for an agent
 */
export async function getContentByAgentId(
  client: SupabaseClient,
  agentId: string,
  status?: string
) {
  let query = client
    .from('content_submissions')
    .select('*')
    .eq('agent_id', agentId)
    .order('updated_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Get pending content submissions for moderation queue
 */
export async function getPendingContentSubmissions(client: SupabaseClient) {
  const { data, error } = await client
    .from('content_submissions')
    .select(`
      *,
      agent:agents!content_submissions_agent_id_fkey(
        id,
        subdomain,
        profile:profiles!agents_user_id_fkey(first_name, last_name)
      )
    `)
    .eq('status', 'pending_review')
    .order('submitted_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get build queue with filters
 */
export async function getBuildQueue(
  client: SupabaseClient,
  filters?: { status?: string; agent_id?: string }
) {
  let query = client
    .from('build_queue')
    .select(`
      *,
      agent:agents!build_queue_agent_id_fkey(
        id,
        subdomain,
        profile:profiles!agents_user_id_fkey(first_name, last_name)
      )
    `)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.agent_id) {
    query = query.eq('agent_id', filters.agent_id);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}
