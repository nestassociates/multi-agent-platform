/**
 * Agent Detection Service
 *
 * Auto-detects new agents from Apex27 property data
 * Creates draft agent records for unknown branch IDs
 *
 * Feature: 004-agent-lifecycle-management
 * Tasks: T012-T015
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Agent, AgentOnboardingChecklist } from '@nest/shared-types';

export interface DetectionResult {
  agent: Agent;
  isNew: boolean;
  checklistCreated: boolean;
}

/**
 * Ensure agent exists for given branch ID (idempotent)
 * Creates new agent with status='draft' if not found
 *
 * Task: T013
 */
export async function ensureAgentExists(
  branchId: string,
  branchName?: string | null
): Promise<DetectionResult> {
  const supabase = createServiceRoleClient();

  // Check if agent already exists with this branch ID
  const { data: existing, error: findError } = await supabase
    .from('agents')
    .select('*')
    .eq('apex27_branch_id', branchId)
    .maybeSingle();

  if (findError) {
    console.error('Error checking for existing agent:', findError);
    throw new Error(`Failed to check for agent: ${findError.message}`);
  }

  // Agent already exists - return it
  if (existing) {
    return {
      agent: existing as Agent,
      isNew: false,
      checklistCreated: false,
    };
  }

  // Create new draft agent
  const subdomain = generateSubdomainFromBranchId(branchId);

  const { data: newAgent, error: createError } = await supabase
    .from('agents')
    .insert({
      apex27_branch_id: branchId,
      branch_name: branchName || null,
      subdomain,
      status: 'draft',
      user_id: null, // No user yet (admin will create)
      qualifications: [],
      social_media_links: {},
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating draft agent:', createError);
    throw new Error(`Failed to create agent: ${createError.message}`);
  }

  // Create onboarding checklist
  const { error: checklistError } = await supabase
    .from('agent_onboarding_checklist')
    .insert({
      agent_id: newAgent.id,
      user_created: false,
      welcome_email_sent: false,
      profile_completed: false,
      profile_completion_pct: 0,
      admin_approved: false,
      site_deployed: false,
    });

  if (checklistError) {
    console.error('Error creating checklist:', checklistError);
    // Non-fatal - agent created successfully
  }

  console.log(`✅ Created draft agent for branch ${branchId}: ${newAgent.subdomain}`);

  return {
    agent: newAgent as Agent,
    isNew: true,
    checklistCreated: !checklistError,
  };
}

/**
 * Scan all properties for new branch IDs and create agents
 *
 * Task: T014
 */
export async function scanPropertiesForNewAgents(): Promise<{
  scannedProperties: number;
  newAgentsCreated: number;
  agents: Agent[];
}> {
  const supabase = createServiceRoleClient();

  // Get all unique branch IDs from properties
  const { data: properties, error: propError } = await supabase
    .from('properties')
    .select('apex27_branch_id, apex27_branch_name')
    .not('apex27_branch_id', 'is', null);

  if (propError) {
    throw new Error(`Failed to scan properties: ${propError.message}`);
  }

  if (!properties || properties.length === 0) {
    return {
      scannedProperties: 0,
      newAgentsCreated: 0,
      agents: [],
    };
  }

  // Get unique branch IDs
  const uniqueBranches = new Map<string, string | null>();
  properties.forEach(p => {
    if (p.apex27_branch_id && !uniqueBranches.has(p.apex27_branch_id)) {
      uniqueBranches.set(p.apex27_branch_id, p.apex27_branch_name || null);
    }
  });

  // Ensure agent exists for each branch
  const newAgents: Agent[] = [];

  for (const [branchId, branchName] of uniqueBranches.entries()) {
    try {
      const result = await ensureAgentExists(branchId, branchName);
      if (result.isNew) {
        newAgents.push(result.agent);

        // Notify admin about new agent
        await notifyAdminNewAgent(result.agent);
      }
    } catch (error) {
      console.error(`Failed to ensure agent for branch ${branchId}:`, error);
      // Continue with other branches
    }
  }

  return {
    scannedProperties: properties.length,
    newAgentsCreated: newAgents.length,
    agents: newAgents,
  };
}

/**
 * Notify admin team about newly detected agent
 *
 * Tasks: T015, T020
 */
export async function notifyAdminNewAgent(agent: Agent): Promise<void> {
  const supabase = createServiceRoleClient();

  // Get property count for this agent
  const { count: propertyCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('apex27_branch_id', agent.apex27_branch_id);

  // Get admin emails
  const { data: admins } = await supabase
    .from('profiles')
    .select('email')
    .in('role', ['admin', 'super_admin']);

  if (!admins || admins.length === 0) {
    console.warn('No admin users found to notify');
    return;
  }

  // Send email using email service
  const { sendEmail } = await import('@nest/email');
  const { AgentDetectedEmail } = await import('@nest/email/templates/agent-detected');

  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.nestassociates.com';

  for (const admin of admins) {
    try {
      await sendEmail({
        to: admin.email,
        subject: `New Agent Detected from Apex27: ${agent.apex27_branch_id}`,
        react: AgentDetectedEmail({
          branchId: agent.apex27_branch_id!,
          branchName: agent.branch_name,
          subdomain: agent.subdomain,
          propertyCount: propertyCount || 0,
          agentId: agent.id,
          dashboardUrl,
        }),
      });

      console.log(`📧 Sent agent-detected email to ${admin.email}`);
    } catch (error) {
      console.error(`Failed to send email to ${admin.email}:`, error);
      // Continue with other admins
    }
  }
}

/**
 * Generate subdomain from branch ID
 * Format: "agent-{branch_id}" (lowercase)
 */
function generateSubdomainFromBranchId(branchId: string): string {
  // Convert to lowercase and remove special characters
  const cleaned = branchId
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/-+/g, '-'); // Collapse multiple hyphens

  return `agent-${cleaned}`;
}
