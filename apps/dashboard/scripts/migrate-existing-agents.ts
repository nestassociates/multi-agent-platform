#!/usr/bin/env npx ts-node

/**
 * Migration Script: Migrate Existing Agents to Lifecycle System
 *
 * This script ensures all existing agents have:
 * 1. Status set to 'active' (they're already operational)
 * 2. Onboarding checklist created with all items marked complete
 *
 * Run with: npx ts-node apps/dashboard/scripts/migrate-existing-agents.ts
 *
 * Options:
 *   --dry-run    Preview changes without applying them
 *   --verbose    Show detailed output
 */

import { createClient } from '@supabase/supabase-js';

// Configuration from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Parse command line args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface Agent {
  id: string;
  subdomain: string;
  status: string;
  user_id: string;
  apex27_branch_id: number | null;
  created_at: string;
}

interface OnboardingChecklist {
  id: string;
  agent_id: string;
}

async function getExistingAgents(): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('id, subdomain, status, user_id, apex27_branch_id, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch agents: ${error.message}`);
  }

  return data || [];
}

async function getExistingChecklists(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('agent_onboarding_checklist')
    .select('agent_id');

  if (error) {
    throw new Error(`Failed to fetch checklists: ${error.message}`);
  }

  return new Set((data || []).map(c => c.agent_id));
}

async function updateAgentStatus(agentId: string, newStatus: string): Promise<void> {
  if (isDryRun) {
    console.log(`  [DRY RUN] Would update agent ${agentId} status to '${newStatus}'`);
    return;
  }

  const { error } = await supabase
    .from('agents')
    .update({ status: newStatus })
    .eq('id', agentId);

  if (error) {
    throw new Error(`Failed to update agent ${agentId}: ${error.message}`);
  }
}

async function createChecklist(agent: Agent): Promise<void> {
  const now = new Date().toISOString();

  const checklist = {
    agent_id: agent.id,
    // Mark all steps as complete for existing agents
    user_created: true,
    user_created_at: agent.created_at,
    welcome_email_sent: true,
    welcome_email_sent_at: agent.created_at,
    profile_complete: true,
    profile_complete_at: agent.created_at,
    profile_completion_percentage: 100,
    admin_approved: true,
    admin_approved_at: agent.created_at,
    site_deployed: true,
    site_deployed_at: agent.created_at,
    // Migration metadata
    migrated_at: now,
    migration_notes: 'Auto-migrated from existing agent',
  };

  if (isDryRun) {
    console.log(`  [DRY RUN] Would create checklist for agent ${agent.id} (${agent.subdomain})`);
    if (isVerbose) {
      console.log(`    Checklist: ${JSON.stringify(checklist, null, 2)}`);
    }
    return;
  }

  const { error } = await supabase
    .from('agent_onboarding_checklist')
    .insert(checklist);

  if (error) {
    throw new Error(`Failed to create checklist for agent ${agent.id}: ${error.message}`);
  }
}

async function createAuditLog(agent: Agent, action: string, changes: object): Promise<void> {
  if (isDryRun) return;

  const { error } = await supabase
    .from('audit_logs')
    .insert({
      table_name: 'agents',
      record_id: agent.id,
      action: action,
      user_id: null, // System migration
      changes: {
        ...changes,
        migration_script: 'migrate-existing-agents.ts',
        migrated_at: new Date().toISOString(),
      },
    });

  if (error) {
    console.warn(`  ⚠️ Failed to create audit log: ${error.message}`);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Agent Lifecycle Migration Script');
  console.log('='.repeat(60));

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  try {
    // Step 1: Get existing data
    console.log('📊 Fetching existing data...');
    const agents = await getExistingAgents();
    const existingChecklists = await getExistingChecklists();

    console.log(`   Found ${agents.length} agents`);
    console.log(`   Found ${existingChecklists.size} existing checklists\n`);

    // Step 2: Identify what needs migrating
    const agentsNeedingStatusUpdate = agents.filter(a => a.status !== 'active');
    const agentsNeedingChecklist = agents.filter(a => !existingChecklists.has(a.id));

    console.log('📋 Migration Plan:');
    console.log(`   ${agentsNeedingStatusUpdate.length} agents need status update to 'active'`);
    console.log(`   ${agentsNeedingChecklist.length} agents need checklist creation\n`);

    if (agentsNeedingStatusUpdate.length === 0 && agentsNeedingChecklist.length === 0) {
      console.log('✅ All agents are already migrated. Nothing to do!');
      return;
    }

    // Step 3: Update agent statuses
    if (agentsNeedingStatusUpdate.length > 0) {
      console.log('🔄 Updating agent statuses...');
      for (const agent of agentsNeedingStatusUpdate) {
        console.log(`   Processing ${agent.subdomain} (current: ${agent.status})...`);
        await updateAgentStatus(agent.id, 'active');
        await createAuditLog(agent, 'migration', {
          status: { from: agent.status, to: 'active' },
          reason: 'Lifecycle migration',
        });
        console.log(`   ✓ ${agent.subdomain} → active`);
      }
      console.log('');
    }

    // Step 4: Create missing checklists
    if (agentsNeedingChecklist.length > 0) {
      console.log('📝 Creating onboarding checklists...');
      for (const agent of agentsNeedingChecklist) {
        console.log(`   Processing ${agent.subdomain}...`);
        await createChecklist(agent);
        console.log(`   ✓ Created checklist for ${agent.subdomain}`);
      }
      console.log('');
    }

    // Step 5: Summary
    console.log('='.repeat(60));
    if (isDryRun) {
      console.log('🔍 DRY RUN COMPLETE');
      console.log('   Run without --dry-run to apply changes');
    } else {
      console.log('✅ MIGRATION COMPLETE');
      console.log(`   Updated ${agentsNeedingStatusUpdate.length} agent statuses`);
      console.log(`   Created ${agentsNeedingChecklist.length} checklists`);
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
main();
