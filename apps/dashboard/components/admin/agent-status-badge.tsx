/**
 * Agent Status Badge Component
 *
 * Color-coded status indicator for agent lifecycle states
 *
 * Feature: 004-agent-lifecycle-management
 * Task: T023
 */

import type { AgentStatus } from '@nest/shared-types';

interface AgentStatusBadgeProps {
  status: AgentStatus;
  showTooltip?: boolean;
}

const STATUS_CONFIG: Record<
  AgentStatus,
  { label: string; color: string; description: string }
> = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    description: 'Auto-detected from Apex27, no user account yet',
  },
  pending_profile: {
    label: 'Pending Profile',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'User created, agent completing profile',
  },
  pending_admin: {
    label: 'Pending Approval',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    description: 'Profile complete, awaiting admin approval',
  },
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-800 border-green-300',
    description: 'Approved and deployed',
  },
  inactive: {
    label: 'Inactive',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    description: 'Temporarily disabled',
  },
  suspended: {
    label: 'Suspended',
    color: 'bg-red-100 text-red-800 border-red-300',
    description: 'Banned or removed',
  },
};

export function AgentStatusBadge({ status, showTooltip = false }: AgentStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}
      title={showTooltip ? config.description : undefined}
    >
      {config.label}
    </span>
  );
}
