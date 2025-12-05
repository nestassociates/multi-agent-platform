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

  // Check for ANY existing pending build for this agent (unique constraint prevents duplicates)
  const { data: existingBuild } = await supabase
    .from('build_queue')
    .select('id, trigger_reason, priority')
    .eq('agent_id', agentId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingBuild) {
    // If there's already a pending build, upgrade it to P1 priority and update trigger reason
    // This ensures activation builds always get highest priority
    if (existingBuild.priority !== 1 || existingBuild.trigger_reason !== 'agent_activated') {
      await supabase
        .from('build_queue')
        .update({
          priority: 1,
          trigger_reason: 'agent_activated',
        })
        .eq('id', existingBuild.id);
      console.log(`Upgraded existing build ${existingBuild.id} to P1 activation priority for agent ${agentId}`);
    } else {
      console.log(`P1 activation build already queued for agent ${agentId}`);
    }
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

export interface StatusChangeResult {
  success: boolean;
  agent: Agent;
  error?: string;
  previousStatus?: string;
}

/**
 * Deactivate an active agent
 *
 * Sets status to 'inactive' - site stays live but no new builds are processed
 *
 * Task: T062
 */
export async function deactivateAgent(
  agentId: string,
  adminUserId: string,
  reason: string
): Promise<StatusChangeResult> {
  const supabase = createServiceRoleClient();

  try {
    // Get current agent status
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (fetchError || !agent) {
      return {
        success: false,
        agent: {} as Agent,
        error: 'Agent not found',
      };
    }

    // Validate transition: only active agents can be deactivated
    if (agent.status !== 'active') {
      return {
        success: false,
        agent: agent as Agent,
        error: `Cannot deactivate agent with status '${agent.status}'. Only active agents can be deactivated.`,
      };
    }

    const previousStatus = agent.status;

    // Update agent status to 'inactive'
    const { data: updatedAgent, error: updateError } = await supabase
      .from('agents')
      .update({ status: 'inactive' })
      .eq('id', agentId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update agent status: ${updateError.message}`);
    }

    // Update checklist with deactivation metadata
    await supabase
      .from('agent_onboarding_checklist')
      .update({
        deactivated_at: new Date().toISOString(),
        deactivated_by_user_id: adminUserId,
        deactivation_reason: reason,
      })
      .eq('agent_id', agentId);

    // Create audit log
    await supabase.from('audit_logs').insert({
      table_name: 'agents',
      record_id: agentId,
      action: 'update',
      user_id: adminUserId,
      changes: {
        status: { from: previousStatus, to: 'inactive' },
        reason,
      },
    });

    console.log(`⏸️ Agent ${agentId} deactivated by ${adminUserId}. Reason: ${reason}`);

    return {
      success: true,
      agent: updatedAgent as Agent,
      previousStatus,
    };
  } catch (error: any) {
    console.error('Agent deactivation error:', error);
    return {
      success: false,
      agent: {} as Agent,
      error: error.message,
    };
  }
}

/**
 * Reactivate an inactive or suspended agent
 *
 * Sets status back to 'active' and optionally queues a new build
 *
 * Task: T063
 */
export async function reactivateAgent(
  agentId: string,
  adminUserId: string,
  reason?: string,
  queueBuild: boolean = false
): Promise<StatusChangeResult & { buildId?: string }> {
  const supabase = createServiceRoleClient();

  try {
    // Get current agent status
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (fetchError || !agent) {
      return {
        success: false,
        agent: {} as Agent,
        error: 'Agent not found',
      };
    }

    // Validate transition: only inactive or suspended agents can be reactivated
    if (agent.status !== 'inactive' && agent.status !== 'suspended') {
      return {
        success: false,
        agent: agent as Agent,
        error: `Cannot reactivate agent with status '${agent.status}'. Only inactive or suspended agents can be reactivated.`,
      };
    }

    const previousStatus = agent.status;

    // Update agent status to 'active'
    const { data: updatedAgent, error: updateError } = await supabase
      .from('agents')
      .update({ status: 'active' })
      .eq('id', agentId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update agent status: ${updateError.message}`);
    }

    // Clear deactivation metadata and update reactivation info
    await supabase
      .from('agent_onboarding_checklist')
      .update({
        deactivated_at: null,
        deactivated_by_user_id: null,
        deactivation_reason: null,
        reactivated_at: new Date().toISOString(),
        reactivated_by_user_id: adminUserId,
      })
      .eq('agent_id', agentId);

    // Optionally queue a new build (e.g., if site was suspended and needs rebuild)
    let buildId: string | undefined;
    if (queueBuild) {
      buildId = await queueActivationBuild(agentId);
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      table_name: 'agents',
      record_id: agentId,
      action: 'update',
      user_id: adminUserId,
      changes: {
        status: { from: previousStatus, to: 'active' },
        reason: reason || 'Agent reactivated',
      },
    });

    console.log(`▶️ Agent ${agentId} reactivated by ${adminUserId}. Previous status: ${previousStatus}`);

    return {
      success: true,
      agent: updatedAgent as Agent,
      previousStatus,
      buildId,
    };
  } catch (error: any) {
    console.error('Agent reactivation error:', error);
    return {
      success: false,
      agent: {} as Agent,
      error: error.message,
    };
  }
}

/**
 * Suspend an agent (remove from public access)
 *
 * Sets status to 'suspended' - site is taken down, no builds processed
 * More severe than deactivation, typically used for policy violations
 *
 * Task: T064
 */
export async function suspendAgent(
  agentId: string,
  adminUserId: string,
  reason: string
): Promise<StatusChangeResult> {
  const supabase = createServiceRoleClient();

  try {
    // Get current agent status
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (fetchError || !agent) {
      return {
        success: false,
        agent: {} as Agent,
        error: 'Agent not found',
      };
    }

    // Validate transition: only active or inactive agents can be suspended
    if (agent.status !== 'active' && agent.status !== 'inactive') {
      return {
        success: false,
        agent: agent as Agent,
        error: `Cannot suspend agent with status '${agent.status}'. Only active or inactive agents can be suspended.`,
      };
    }

    const previousStatus = agent.status;

    // Update agent status to 'suspended'
    const { data: updatedAgent, error: updateError } = await supabase
      .from('agents')
      .update({ status: 'suspended' })
      .eq('id', agentId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update agent status: ${updateError.message}`);
    }

    // Update checklist with suspension metadata
    await supabase
      .from('agent_onboarding_checklist')
      .update({
        suspended_at: new Date().toISOString(),
        suspended_by_user_id: adminUserId,
        suspension_reason: reason,
      })
      .eq('agent_id', agentId);

    // Cancel any pending builds for this agent
    await supabase
      .from('build_queue')
      .update({ status: 'cancelled' })
      .eq('agent_id', agentId)
      .eq('status', 'pending');

    // Create audit log
    await supabase.from('audit_logs').insert({
      table_name: 'agents',
      record_id: agentId,
      action: 'update',
      user_id: adminUserId,
      changes: {
        status: { from: previousStatus, to: 'suspended' },
        reason,
        severity: 'high',
      },
    });

    console.log(`🚫 Agent ${agentId} suspended by ${adminUserId}. Reason: ${reason}`);

    return {
      success: true,
      agent: updatedAgent as Agent,
      previousStatus,
    };
  } catch (error: any) {
    console.error('Agent suspension error:', error);
    return {
      success: false,
      agent: {} as Agent,
      error: error.message,
    };
  }
}
