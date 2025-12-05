/**
 * Profile Completion Service
 *
 * Calculates agent profile completion percentage and manages status transitions
 *
 * Feature: 004-agent-lifecycle-management
 * Tasks: T032-T034
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Agent } from '@nest/shared-types';

export interface ProfileCompletionResult {
  completionPct: number;
  isComplete: boolean;
  missingFields: string[];
}

/**
 * Calculate profile completion percentage
 *
 * Required Fields (5 total) - Agent-controlled:
 * 1. first_name AND last_name (set by admin, but counted)
 * 2. phone (agent provides)
 * 3. bio (min 100 characters) - stored on agents table
 * 4. qualifications (at least 1)
 * 5. subdomain (set by admin, but counted)
 *
 * Note: avatar_url (profile photo) is admin-controlled and NOT required for agent completion
 *
 * Task: T033
 */
export function calculateProfileCompletion(
  profile: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
  },
  agent: {
    subdomain?: string | null;
    qualifications?: string[] | null;
    bio?: string | null;
  }
): ProfileCompletionResult {
  let completed = 0;
  const total = 5;
  const missing: string[] = [];

  // 1. First and last name
  if (profile.first_name && profile.last_name) {
    completed++;
  } else {
    missing.push('Full name');
  }

  // 2. Phone number
  if (profile.phone) {
    completed++;
  } else {
    missing.push('Phone number');
  }

  // 3. Bio (min 100 characters) - stored on agents table
  if (agent.bio && agent.bio.length >= 100) {
    completed++;
  } else {
    missing.push('Bio (min 100 characters)');
  }

  // 4. At least one qualification
  if (agent.qualifications && agent.qualifications.length > 0) {
    completed++;
  } else {
    missing.push('At least 1 qualification');
  }

  // 5. Subdomain
  if (agent.subdomain) {
    completed++;
  } else {
    missing.push('Subdomain');
  }

  const completionPct = Math.round((completed / total) * 100);

  return {
    completionPct,
    isComplete: completionPct === 100,
    missingFields: missing,
  };
}

/**
 * Update checklist progress for an agent
 *
 * Task: T034
 */
export async function updateChecklistProgress(
  agentId: string,
  userId: string
): Promise<{
  completionPct: number;
  statusChanged: boolean;
  newStatus?: string;
}> {
  const supabase = createServiceRoleClient();

  // Get profile and agent data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, phone')
    .eq('user_id', userId)
    .single();

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id, subdomain, qualifications, status, bio')
    .eq('id', agentId)
    .single();

  if (!profile) {
    console.error('Profile not found for user_id:', userId, profileError);
    throw new Error(`Profile not found for user ${userId}`);
  }

  if (!agent) {
    console.error('Agent not found for agent_id:', agentId, agentError);
    throw new Error(`Agent not found: ${agentId}`);
  }

  // Calculate completion
  const result = calculateProfileCompletion(profile, agent);

  // Update checklist
  await supabase
    .from('agent_onboarding_checklist')
    .update({
      profile_completion_pct: result.completionPct,
      profile_completed: result.isComplete,
    })
    .eq('agent_id', agentId);

  let statusChanged = false;
  let newStatus: string | undefined;

  // Auto-transition status if profile complete
  if (result.isComplete && agent.status === 'pending_profile') {
    await supabase
      .from('agents')
      .update({ status: 'pending_admin' })
      .eq('id', agentId);

    statusChanged = true;
    newStatus = 'pending_admin';

    console.log(`✅ Agent ${agentId} profile complete - status changed to pending_admin`);
  }

  return {
    completionPct: result.completionPct,
    statusChanged,
    newStatus,
  };
}
