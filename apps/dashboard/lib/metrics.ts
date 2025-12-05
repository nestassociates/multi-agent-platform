/**
 * Metrics Utility
 * Tracks key metrics for agent lifecycle and system health
 *
 * T095: Agent activation time tracking
 * T096: Draft agents dashboard widget data
 * T097: Auto-detection success rate
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Agent Status Counts
 */
export interface AgentStatusCounts {
  draft: number;
  pending_profile: number;
  pending_admin: number;
  active: number;
  inactive: number;
  suspended: number;
  total: number;
}

/**
 * Get count of agents by status
 */
export async function getAgentStatusCounts(): Promise<AgentStatusCounts> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('agents')
    .select('status');

  if (error) {
    console.error('Failed to fetch agent status counts:', error);
    return {
      draft: 0,
      pending_profile: 0,
      pending_admin: 0,
      active: 0,
      inactive: 0,
      suspended: 0,
      total: 0,
    };
  }

  const counts: AgentStatusCounts = {
    draft: 0,
    pending_profile: 0,
    pending_admin: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    total: data?.length || 0,
  };

  for (const agent of data || []) {
    const status = agent.status as keyof Omit<AgentStatusCounts, 'total'>;
    if (status in counts) {
      counts[status]++;
    }
  }

  return counts;
}

/**
 * Get count of draft agents (for dashboard widget)
 */
export async function getDraftAgentCount(): Promise<number> {
  const supabase = createServiceRoleClient();

  const { count, error } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'draft');

  if (error) {
    console.error('Failed to fetch draft agent count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get count of agents pending admin approval
 */
export async function getPendingApprovalCount(): Promise<number> {
  const supabase = createServiceRoleClient();

  const { count, error } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_admin');

  if (error) {
    console.error('Failed to fetch pending approval count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Activation Time Metrics
 */
export interface ActivationTimeMetrics {
  averageHours: number;
  medianHours: number;
  minHours: number;
  maxHours: number;
  sampleSize: number;
}

/**
 * Calculate average activation time (from draft to active)
 * Uses onboarding checklist timestamps
 */
export async function getActivationTimeMetrics(): Promise<ActivationTimeMetrics | null> {
  const supabase = createServiceRoleClient();

  // Get checklists that have both created and activated timestamps
  const { data, error } = await supabase
    .from('agent_onboarding_checklist')
    .select('created_at, admin_approved_at')
    .not('admin_approved_at', 'is', null);

  if (error || !data || data.length === 0) {
    return null;
  }

  // Calculate activation times in hours
  const activationTimes: number[] = data
    .map((checklist) => {
      if (!checklist.created_at || !checklist.admin_approved_at) return null;
      const created = new Date(checklist.created_at).getTime();
      const approved = new Date(checklist.admin_approved_at).getTime();
      const hours = (approved - created) / (1000 * 60 * 60);
      return hours;
    })
    .filter((t): t is number => t !== null && t >= 0);

  if (activationTimes.length === 0) {
    return null;
  }

  // Sort for median calculation
  activationTimes.sort((a, b) => a - b);

  const sum = activationTimes.reduce((a, b) => a + b, 0);
  const avg = sum / activationTimes.length;
  const median = activationTimes[Math.floor(activationTimes.length / 2)];

  return {
    averageHours: Math.round(avg * 10) / 10,
    medianHours: Math.round(median * 10) / 10,
    minHours: Math.round(activationTimes[0] * 10) / 10,
    maxHours: Math.round(activationTimes[activationTimes.length - 1] * 10) / 10,
    sampleSize: activationTimes.length,
  };
}

/**
 * Auto-Detection Metrics
 */
export interface AutoDetectionMetrics {
  totalDetected: number;
  successfulSetup: number;
  activatedAgents: number;
  conversionRate: number; // % of detected that became active
}

/**
 * Get auto-detection success metrics
 */
export async function getAutoDetectionMetrics(): Promise<AutoDetectionMetrics> {
  const supabase = createServiceRoleClient();

  // Count agents by status
  const counts = await getAgentStatusCounts();

  // Detected = all agents (since all come through auto-detection)
  const totalDetected = counts.total;

  // Successfully set up = moved past draft
  const successfulSetup = counts.pending_profile + counts.pending_admin + counts.active + counts.inactive + counts.suspended;

  // Activated = reached active status (including inactive/suspended that were once active)
  const activatedAgents = counts.active + counts.inactive + counts.suspended;

  // Conversion rate = activated / detected
  const conversionRate = totalDetected > 0 ? Math.round((activatedAgents / totalDetected) * 100) : 0;

  return {
    totalDetected,
    successfulSetup,
    activatedAgents,
    conversionRate,
  };
}

/**
 * Dashboard Overview Metrics
 */
export interface DashboardMetrics {
  agentCounts: AgentStatusCounts;
  pendingActions: {
    draftAgents: number;
    pendingApproval: number;
    pendingBuilds: number;
  };
  activationTime: ActivationTimeMetrics | null;
  autoDetection: AutoDetectionMetrics;
}

/**
 * Get all metrics for admin dashboard
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createServiceRoleClient();

  // Get all metrics in parallel
  const [agentCounts, activationTime, autoDetection, pendingBuilds] = await Promise.all([
    getAgentStatusCounts(),
    getActivationTimeMetrics(),
    getAutoDetectionMetrics(),
    supabase
      .from('build_queue')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'processing']),
  ]);

  return {
    agentCounts,
    pendingActions: {
      draftAgents: agentCounts.draft,
      pendingApproval: agentCounts.pending_admin,
      pendingBuilds: pendingBuilds.count || 0,
    },
    activationTime,
    autoDetection,
  };
}

/**
 * Log metric event (for tracking/debugging)
 */
export function logMetric(name: string, value: number | object, tags?: Record<string, string>): void {
  // In production, this could send to a metrics service (DataDog, etc.)
  // For now, just log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[METRIC]', name, value, tags || {});
  }
}

/**
 * Track agent activation event
 */
export function trackAgentActivation(agentId: string, activationTimeHours: number): void {
  logMetric('agent.activation', activationTimeHours, { agent_id: agentId });
}

/**
 * Track auto-detection event
 */
export function trackAutoDetection(branchId: number, success: boolean): void {
  logMetric('agent.auto_detection', success ? 1 : 0, {
    branch_id: String(branchId),
    success: String(success),
  });
}

/**
 * Track build queue event
 */
export function trackBuildQueued(agentId: string, priority: string): void {
  logMetric('build.queued', 1, { agent_id: agentId, priority });
}
