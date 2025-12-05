/**
 * Agent Status Transition Validator
 *
 * Validates and enforces allowed status transitions for agent lifecycle management
 *
 * Feature: 004-agent-lifecycle-management
 * Tasks: T068-T070
 */

import type { AgentStatusType } from '@nest/validation';

/**
 * Allowed status transitions map
 *
 * Key: Current status
 * Value: Array of statuses that can be transitioned to
 *
 * Status flow:
 * - draft → pending_profile (admin creates user account)
 * - pending_profile → pending_admin (agent completes profile)
 * - pending_admin → active (admin approves)
 * - active → inactive (admin deactivates)
 * - active → suspended (admin suspends)
 * - inactive → active (admin reactivates)
 * - inactive → suspended (admin suspends)
 * - suspended → active (admin reactivates)
 */
const ALLOWED_TRANSITIONS: Record<AgentStatusType, AgentStatusType[]> = {
  draft: ['pending_profile'],
  pending_profile: ['pending_admin', 'draft'], // Can go back to draft if user deleted
  pending_admin: ['active', 'pending_profile'], // Can go back if profile changed
  active: ['inactive', 'suspended'],
  inactive: ['active', 'suspended'],
  suspended: ['active'], // Only reactivation allowed from suspended
};

/**
 * Status transition descriptions for UI/logging
 */
export const STATUS_TRANSITION_DESCRIPTIONS: Record<AgentStatusType, Record<AgentStatusType, string>> = {
  draft: {
    pending_profile: 'Admin created user account for agent',
    pending_admin: '',
    active: '',
    inactive: '',
    suspended: '',
    draft: '',
  },
  pending_profile: {
    pending_admin: 'Agent completed their profile',
    draft: 'User account removed, agent returned to draft',
    pending_profile: '',
    active: '',
    inactive: '',
    suspended: '',
  },
  pending_admin: {
    active: 'Admin approved agent and deployed site',
    pending_profile: 'Profile changes require re-completion',
    draft: '',
    pending_admin: '',
    inactive: '',
    suspended: '',
  },
  active: {
    inactive: 'Admin temporarily deactivated agent (site stays live)',
    suspended: 'Admin suspended agent (site removed from public)',
    draft: '',
    pending_profile: '',
    pending_admin: '',
    active: '',
  },
  inactive: {
    active: 'Admin reactivated agent',
    suspended: 'Admin suspended inactive agent',
    draft: '',
    pending_profile: '',
    pending_admin: '',
    inactive: '',
  },
  suspended: {
    active: 'Admin reactivated suspended agent',
    draft: '',
    pending_profile: '',
    pending_admin: '',
    inactive: '',
    suspended: '',
  },
};

export interface TransitionValidationResult {
  allowed: boolean;
  reason?: string;
  description?: string;
}

/**
 * Check if a status transition is allowed
 *
 * Task: T069
 */
export function canTransition(
  fromStatus: AgentStatusType,
  toStatus: AgentStatusType
): TransitionValidationResult {
  // Same status - no transition needed
  if (fromStatus === toStatus) {
    return {
      allowed: false,
      reason: `Agent is already in '${toStatus}' status`,
    };
  }

  // Check if transition is allowed
  const allowedTargets = ALLOWED_TRANSITIONS[fromStatus] || [];
  const isAllowed = allowedTargets.includes(toStatus);

  if (!isAllowed) {
    return {
      allowed: false,
      reason: `Cannot transition from '${fromStatus}' to '${toStatus}'. Allowed transitions: ${allowedTargets.join(', ') || 'none'}`,
    };
  }

  return {
    allowed: true,
    description: STATUS_TRANSITION_DESCRIPTIONS[fromStatus][toStatus],
  };
}

/**
 * Get all available transitions for a given status
 */
export function getAvailableTransitions(currentStatus: AgentStatusType): AgentStatusType[] {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}

/**
 * Get user-friendly status labels
 */
export const STATUS_LABELS: Record<AgentStatusType, string> = {
  draft: 'Draft',
  pending_profile: 'Pending Profile',
  pending_admin: 'Pending Approval',
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
};

/**
 * Get status color for UI display
 */
export const STATUS_COLORS: Record<AgentStatusType, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  pending_profile: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  pending_admin: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  active: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  inactive: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  suspended: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

/**
 * Get status badge variant for shadcn/ui Badge component
 */
export function getStatusBadgeVariant(status: AgentStatusType): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default';
    case 'suspended':
      return 'destructive';
    case 'draft':
    case 'inactive':
      return 'secondary';
    case 'pending_profile':
    case 'pending_admin':
      return 'outline';
    default:
      return 'secondary';
  }
}

/**
 * Check if agent can be activated (for display purposes)
 */
export function canBeActivated(status: AgentStatusType): boolean {
  return status === 'pending_admin';
}

/**
 * Check if agent can be deactivated (for display purposes)
 */
export function canBeDeactivated(status: AgentStatusType): boolean {
  return status === 'active';
}

/**
 * Check if agent can be reactivated (for display purposes)
 */
export function canBeReactivated(status: AgentStatusType): boolean {
  return status === 'inactive' || status === 'suspended';
}

/**
 * Check if agent can be suspended (for display purposes)
 */
export function canBeSuspended(status: AgentStatusType): boolean {
  return status === 'active' || status === 'inactive';
}
