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
  branchName?: string | null,
  branchDetails?: any,
  userData?: any
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

  // Create new draft agent with Apex27 contact data
  const subdomain = generateSubdomainFromBranchId(branchId);

  // Get user data from Apex27 Users API by matching branch email
  // Branch email IS the agent's email - fetch their user record for proper firstName/lastName
  let userRecord = null;
  if (branchDetails?.email) {
    try {
      const { getUserByEmail } = await import('@/lib/apex27/client');
      userRecord = await getUserByEmail(branchDetails.email);
    } catch (err) {
      console.error(`Failed to fetch user for ${branchDetails.email}:`, err);
    }
  }

  // Store contact info from Apex27
  const contactData = branchDetails ? {
    email: branchDetails.email,
    phone: branchDetails.phone,
    address: `${branchDetails.address1}, ${branchDetails.city}, ${branchDetails.postalCode}`,
    firstName: userRecord?.firstName || null,  // ✅ From Apex27 /users API
    lastName: userRecord?.lastName || null,     // ✅ From Apex27 /users API
  } : null;

  const { data: newAgent, error: createError } = await supabase
    .from('agents')
    .insert({
      apex27_branch_id: branchId,
      branch_name: branchName || null,
      apex27_contact_data: contactData,
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
 * Scan Apex27 for new branches and auto-create agents
 *
 * Fetches properties from Apex27 API, extracts unique branch IDs,
 * and creates draft agents for any branches that don't have agents yet.
 *
 * Task: T014
 */
export async function scanPropertiesForNewAgents(): Promise<{
  scannedProperties: number;
  newAgentsCreated: number;
  agents: Agent[];
}> {
  const supabase = createServiceRoleClient();

  // Fetch properties from Apex27 (first 100 for performance)
  console.log('[Auto-Detect] Fetching properties from Apex27 API...');
  const { getListings } = await import('@/lib/apex27/client');
  const { listings } = await getListings({ page: 1, pageSize: 100 });

  console.log(`[Auto-Detect] Fetched ${listings.length} properties from Apex27`);

  // Extract unique branch IDs from Apex27 data
  const apex27Branches = new Map<string, string | null>();

  listings.forEach(listing => {
    if (listing.branch?.id) {
      const branchId = String(listing.branch.id);
      if (!apex27Branches.has(branchId)) {
        apex27Branches.set(branchId, listing.branch.name || null);
      }
    }
  });

  console.log(`[Auto-Detect] Found ${apex27Branches.size} unique branches in Apex27`);

  // Get existing agents from database
  const { data: existingAgents } = await supabase
    .from('agents')
    .select('apex27_branch_id');

  const existingBranchIds = new Set(
    existingAgents?.map(a => a.apex27_branch_id).filter(Boolean) || []
  );

  // Find branches that need agents
  const missingBranches = Array.from(apex27Branches.entries()).filter(
    ([branchId]) => !existingBranchIds.has(branchId)
  );

  console.log(`[Auto-Detect] Found ${missingBranches.length} branches without agents`);

  // Create draft agents for missing branches with full contact details
  const newAgents: Agent[] = [];

  // Fetch full branch details from Apex27
  const { getBranchDetails } = await import('@/lib/apex27/client');

  for (const [branchId, branchName] of missingBranches) {
    try {
      // Get branch and user details from Apex27
      let branchDetails = null;
      let userData = null;
      try {
        // Find this branch in the listings we already fetched
        const listing = listings.find(l => String(l.branch.id) === branchId);
        if (listing) {
          branchDetails = listing.branch;
          userData = listing.user;  // ✅ Get user data with names
        }
      } catch (err) {
        console.error(`Failed to get details for ${branchId}:`, err);
      }

      const result = await ensureAgentExists(branchId, branchName, branchDetails, userData);
      if (result.isNew) {
        newAgents.push(result.agent);
        console.log(`[Auto-Detect] Created draft agent for branch ${branchId}: ${result.agent.subdomain}`);

        // Notify admin about new agent
        await notifyAdminNewAgent(result.agent);
      }
    } catch (error) {
      console.error(`[Auto-Detect] Failed to create agent for branch ${branchId}:`, error);
      // Continue with other branches
    }
  }

  return {
    scannedProperties: listings.length,
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
  const { sendAgentDetectedEmail } = await import('@nest/email');

  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.nestassociates.com';

  for (const admin of admins) {
    try {
      await sendAgentDetectedEmail(admin.email, {
        branchId: agent.apex27_branch_id!,
        branchName: agent.branch_name,
        subdomain: agent.subdomain,
        propertyCount: propertyCount || 0,
        agentId: agent.id,
        dashboardUrl,
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

