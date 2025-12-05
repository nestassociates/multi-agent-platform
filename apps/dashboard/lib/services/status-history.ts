/**
 * Agent Status History Service
 *
 * Fetches and formats status change history from audit_logs
 *
 * Feature: 004-agent-lifecycle-management
 * Task: T079
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

export interface StatusHistoryEntry {
  id: string;
  action: string;
  previousStatus: string | null;
  newStatus: string | null;
  reason: string | null;
  performedBy: {
    userId: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
}

/**
 * Fetch status change history for an agent from audit_logs
 *
 * Task: T079
 */
export async function getAgentStatusHistory(
  agentId: string,
  limit: number = 20
): Promise<StatusHistoryEntry[]> {
  const supabase = createServiceRoleClient();

  // Query audit_logs for agent status changes
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('entity_type', 'agent')
    .eq('entity_id', agentId)
    .in('action', [
      'status_change',
      'activated',
      'deactivated',
      'reactivated',
      'suspended',
      'agent_activated',
      'agent_deactivated',
      'agent_reactivated',
      'agent_suspended',
    ])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !logs) {
    console.error('Failed to fetch status history:', error);
    return [];
  }

  // Get unique user IDs to fetch names
  const userIds = [...new Set(logs.map(log => log.user_id).filter(Boolean))];

  // Fetch user profiles for names
  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds)
    : { data: [] };

  const profileMap = new Map(
    (profiles || []).map(p => [p.user_id, p])
  );

  // Format the history entries
  return logs.map(log => {
    const profile = log.user_id ? profileMap.get(log.user_id) : null;
    const oldValues = log.old_values as Record<string, any> | null;
    const newValues = log.new_values as Record<string, any> | null;

    return {
      id: log.id,
      action: log.action,
      previousStatus: oldValues?.status || null,
      newStatus: newValues?.status || null,
      reason: newValues?.reason || newValues?.deactivation_reason || newValues?.suspension_reason || null,
      performedBy: profile
        ? {
            userId: profile.user_id,
            name: `${profile.first_name} ${profile.last_name}`,
            email: profile.email,
          }
        : null,
      createdAt: log.created_at,
    };
  });
}

/**
 * Get human-readable action labels for status changes
 *
 * Task: T080
 */
export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    status_change: 'Status Changed',
    activated: 'Activated',
    deactivated: 'Deactivated',
    reactivated: 'Reactivated',
    suspended: 'Suspended',
    agent_activated: 'Agent Activated',
    agent_deactivated: 'Agent Deactivated',
    agent_reactivated: 'Agent Reactivated',
    agent_suspended: 'Agent Suspended',
  };
  return labels[action] || action;
}

/**
 * Get icon color for action type
 */
export function getActionColor(action: string): string {
  if (action.includes('suspend')) return 'text-red-600';
  if (action.includes('deactivat')) return 'text-orange-600';
  if (action.includes('reactivat') || action.includes('activat')) return 'text-green-600';
  return 'text-gray-600';
}

/**
 * Get background color for action type
 */
export function getActionBgColor(action: string): string {
  if (action.includes('suspend')) return 'bg-red-100';
  if (action.includes('deactivat')) return 'bg-orange-100';
  if (action.includes('reactivat') || action.includes('activat')) return 'bg-green-100';
  return 'bg-gray-100';
}
