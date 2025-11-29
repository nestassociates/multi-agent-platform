/**
 * Build Queue System
 * Manages site rebuild requests for agents
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role client for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface BuildRequest {
  agent_id: string;
  trigger_reason: string;
  priority: number; // 1=Emergency, 2=High, 3=Normal, 4=Low
}

/**
 * Add a build request to the queue
 * Prevents duplicate builds for the same agent within 5 minutes
 */
export async function addBuild(request: BuildRequest): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    // Check for recent builds for this agent
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: recentBuilds } = await supabase
      .from('build_queue')
      .select('id')
      .eq('agent_id', request.agent_id)
      .eq('status', 'queued')
      .gte('created_at', fiveMinutesAgo);

    if (recentBuilds && recentBuilds.length > 0) {
      return {
        success: false,
        message: 'Build already queued for this agent within the last 5 minutes',
      };
    }

    // Add to queue
    const { data, error } = await supabase
      .from('build_queue')
      .insert({
        agent_id: request.agent_id,
        trigger_reason: request.trigger_reason,
        priority: request.priority,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error adding build to queue:', error);
      return { success: false, message: error.message };
    }

    return {
      success: true,
      id: data.id,
      message: 'Build queued successfully',
    };
  } catch (error: any) {
    console.error('Error in addBuild:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Get next build from the queue
 * Prioritizes high priority builds, then by creation time
 *
 * T057-T059: ONLY processes builds for agents with status='active'
 */
export async function getNextBuild(): Promise<any | null> {
  try {
    // T057: Add INNER JOIN with agents table and filter by status='active'
    const { data, error } = await supabase
      .from('build_queue')
      .select('*, agent:agents!inner(subdomain, user_id, status)')
      .eq('status', 'queued')
      .eq('agent.status', 'active') // T057: ONLY active agents
      .order('priority', { ascending: false }) // high > normal > low
      .order('created_at', { ascending: true }) // oldest first
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      throw error;
    }

    // T059: Log if build was skipped due to agent status
    if (!data) {
      // Check if there are any pending builds for non-active agents
      const { data: skippedBuilds } = await supabase
        .from('build_queue')
        .select('id, agent:agents!inner(subdomain, status)')
        .eq('status', 'queued')
        .neq('agent.status', 'active')
        .limit(5);

      if (skippedBuilds && skippedBuilds.length > 0) {
        console.log(`[Builder] Skipping ${skippedBuilds.length} builds for non-active agents:`,
          skippedBuilds.map((b: any) => `${b.agent.subdomain} (${b.agent.status})`).join(', ')
        );
      }
    }

    return data;
  } catch (error) {
    console.error('Error getting next build:', error);
    return null;
  }
}

/**
 * Mark a build as in progress
 */
export async function startBuild(buildId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('build_queue')
      .update({
        status: 'building',
        started_at: new Date().toISOString(),
      })
      .eq('id', buildId);

    return !error;
  } catch (error) {
    console.error('Error starting build:', error);
    return false;
  }
}

/**
 * Mark a build as completed
 */
export async function completeBuild(buildId: string, result: {
  success: boolean;
  build_url?: string;
  error_message?: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('build_queue')
      .update({
        status: result.success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        build_url: result.build_url,
        error_message: result.error_message,
      })
      .eq('id', buildId);

    return !error;
  } catch (error) {
    console.error('Error completing build:', error);
    return false;
  }
}

/**
 * Get queue stats
 */
export async function getQueueStats(): Promise<{
  queued: number;
  building: number;
  completed_today: number;
  failed_today: number;
}> {
  const today = new Date().toISOString().split('T')[0];

  try {
    const [queued, building, completedToday, failedToday] = await Promise.all([
      supabase.from('build_queue').select('id', { count: 'exact', head: true }).eq('status', 'queued'),
      supabase.from('build_queue').select('id', { count: 'exact', head: true }).eq('status', 'building'),
      supabase.from('build_queue').select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', `${today}T00:00:00`),
      supabase.from('build_queue').select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('completed_at', `${today}T00:00:00`),
    ]);

    return {
      queued: queued.count || 0,
      building: building.count || 0,
      completed_today: completedToday.count || 0,
      failed_today: failedToday.count || 0,
    };
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return { queued: 0, building: 0, completed_today: 0, failed_today: 0 };
  }
}

/**
 * Queue rebuilds for ALL active agents when global content is published
 * T011: Used when header, footer, or legal pages are updated
 *
 * @param contentType - The type of global content that was published
 * @returns Number of builds queued
 */
export async function queueGlobalContentRebuild(contentType: string): Promise<{ queued: number; errors: number }> {
  try {
    // Get all active agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, subdomain')
      .eq('status', 'active');

    if (agentsError) {
      console.error('Error fetching active agents:', agentsError);
      return { queued: 0, errors: 1 };
    }

    if (!agents || agents.length === 0) {
      console.log('[Queue] No active agents found for global content rebuild');
      return { queued: 0, errors: 0 };
    }

    console.log(`[Queue] Queuing rebuilds for ${agents.length} active agents due to ${contentType} update`);

    // Queue builds for all agents with emergency priority (1)
    const builds = agents.map((agent) => ({
      agent_id: agent.id,
      trigger_reason: `global_content:${contentType}`,
      priority: 1, // Emergency priority for global content changes
      status: 'pending',
    }));

    // Insert all builds in a single batch
    const { data: insertedBuilds, error: insertError } = await supabase
      .from('build_queue')
      .insert(builds)
      .select('id');

    if (insertError) {
      console.error('Error queuing global content rebuilds:', insertError);
      return { queued: 0, errors: agents.length };
    }

    const queuedCount = insertedBuilds?.length || 0;
    console.log(`[Queue] Successfully queued ${queuedCount} rebuilds for global content change`);

    return { queued: queuedCount, errors: agents.length - queuedCount };
  } catch (error) {
    console.error('Error in queueGlobalContentRebuild:', error);
    return { queued: 0, errors: 1 };
  }
}
