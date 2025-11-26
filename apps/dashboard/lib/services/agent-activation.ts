/**
 * Agent Activation Service
 *
 * Handles agent activation workflow and site deployment triggering
 *
 * Feature: 004-agent-lifecycle-management
 * Tasks: T042-T045
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { calculateProfileCompletion } from './profile-completion';
import type { Agent } from '@nest/shared-types';

export interface ActivationResult {
  success: boolean;
  agent: Agent;
  buildId?: string;
  error?: string;
}

/**
 * Validate agent is ready for activation
 *
 * Task: T044
 */
export async function validateReadyForActivation(agentId: string): Promise<{
  ready: boolean;
  reason?: string;
}> {
  const supabase = createServiceRoleClient();

  // Get agent with profile and checklist
  const { data: agent } = await supabase
    .from('agents')
    .select(`
      *,
      profile:profiles!agents_user_id_fkey(*),
      checklist:agent_onboarding_checklist(*)
    `)
    .eq('id', agentId)
    .single();

  if (!agent) {
    return { ready: false, reason: 'Agent not found' };
  }

  // Check if already active
  if (agent.status === 'active') {
    return { ready: false, reason: 'Agent is already active' };
  }

  // Check if user account exists
  if (!agent.user_id) {
    return { ready: false, reason: 'No user account created yet' };
  }

  // Check profile completion
  const completion = calculateProfileCompletion(agent.profile, agent);
  if (!completion.isComplete) {
    return {
      ready: false,
      reason: `Profile incomplete (${completion.completionPct}%). Missing: ${completion.missingFields.join(', ')}`,
    };
  }

  return { ready: true };
}

/**
 * Queue activation build with P1 priority
 *
 * Task: T045
 */
export async function queueActivationBuild(agentId: string): Promise<string> {
  const supabase = createServiceRoleClient();

  // Check for existing pending builds to avoid duplicates
  const { data: existingBuild } = await supabase
    .from('build_queue')
    .select('id')
    .eq('agent_id', agentId)
    .eq('status', 'pending')
    .eq('trigger_reason', 'agent_activated')
    .maybeSingle();

  if (existingBuild) {
    console.log(`Build already queued for agent ${agentId}`);
    return existingBuild.id;
  }

  // Create new build with P1 priority
  const { data: build, error } = await supabase
    .from('build_queue')
    .insert({
      agent_id: agentId,
      priority: 1, // P1 - highest priority for activation
      trigger_reason: 'agent_activated',
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to queue activation build:', error);
    throw new Error(`Failed to queue build: ${error.message}`);
  }

  console.log(`✅ Queued P1 activation build for agent ${agentId}: ${build.id}`);

  return build.id;
}

/**
 * Activate agent and trigger site deployment
 *
 * Task: T043
 */
export async function activateAgent(
  agentId: string,
  adminUserId: string,
  reason?: string
): Promise<ActivationResult> {
  const supabase = createServiceRoleClient();

  try {
    // Validate agent is ready
    const validation = await validateReadyForActivation(agentId);
    if (!validation.ready) {
      return {
        success: false,
        agent: {} as Agent,
        error: validation.reason,
      };
    }

    // Update agent status to 'active'
    const { data: updatedAgent, error: agentError } = await supabase
      .from('agents')
      .update({ status: 'active' })
      .eq('id', agentId)
      .select()
      .single();

    if (agentError) {
      throw new Error(`Failed to update agent status: ${agentError.message}`);
    }

    // Update checklist
    const { error: checklistError } = await supabase
      .from('agent_onboarding_checklist')
      .update({
        admin_approved: true,
        activated_at: new Date().toISOString(),
        activated_by_user_id: adminUserId,
      })
      .eq('agent_id', agentId);

    if (checklistError) {
      console.error('Checklist update failed (non-fatal):', checklistError);
    }

    // Queue activation build
    const buildId = await queueActivationBuild(agentId);

    // Update checklist to mark site as deployed (will be updated when build completes)
    await supabase
      .from('agent_onboarding_checklist')
      .update({ site_deployed: true })
      .eq('agent_id', agentId);

    // Create audit log
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'agents',
        record_id: agentId,
        action: 'update',
        user_id: adminUserId,
        changes: {
          status: { from: validation, to: 'active' },
          reason,
        },
      });

    console.log(`✅ Agent ${agentId} activated successfully by ${adminUserId}`);

    return {
      success: true,
      agent: updatedAgent as Agent,
      buildId,
    };
  } catch (error: any) {
    console.error('Agent activation error:', error);
    return {
      success: false,
      agent: {} as Agent,
      error: error.message,
    };
  }
}
