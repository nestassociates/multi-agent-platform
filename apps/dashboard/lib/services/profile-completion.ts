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
 * Required Fields (6 total):
 * 1. first_name AND last_name
 * 2. email AND phone
 * 3. bio (min 100 characters)
 * 4. avatar_url (profile photo)
 * 5. qualifications (at least 1)
 * 6. subdomain
 *
 * Task: T033
 */
export function calculateProfileCompletion(
  profile: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
  },
  agent: {
    subdomain?: string | null;
    qualifications?: string[] | null;
  }
): ProfileCompletionResult {
  let completed = 0;
  const total = 6;
  const missing: string[] = [];

  // 1. First and last name
  if (profile.first_name && profile.last_name) {
    completed++;
  } else {
    missing.push('Full name');
  }

  // 2. Email and phone
  if (profile.email && profile.phone) {
    completed++;
  } else {
    missing.push('Email and phone');
  }

  // 3. Bio (min 100 characters)
  if (profile.bio && profile.bio.length >= 100) {
    completed++;
  } else {
    missing.push('Bio (min 100 characters)');
  }

  // 4. Profile photo
  if (profile.avatar_url) {
    completed++;
  } else {
    missing.push('Profile photo');
  }

  // 5. At least one qualification
  if (agent.qualifications && agent.qualifications.length > 0) {
    completed++;
  } else {
    missing.push('At least 1 qualification');
  }

  // 6. Subdomain
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, phone, bio, avatar_url')
    .eq('user_id', userId)
    .single();

  const { data: agent } = await supabase
    .from('agents')
    .select('id, subdomain, qualifications, status')
    .eq('id', agentId)
    .single();

  if (!profile || !agent) {
    throw new Error('Profile or agent not found');
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
