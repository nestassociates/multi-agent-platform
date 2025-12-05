/**
 * POST /api/admin/agents/[id]/approve
 * Approve agent profile without deploying site
 *
 * This sets the agent status to 'active' and marks admin_approved,
 * but does NOT queue a build. Use the deploy endpoint separately.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;

    // Get authenticated user
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const serviceClient = createServiceRoleClient();

    // Get agent and verify status
    const { data: agent, error: agentError } = await serviceClient
      .from('agents')
      .select('*, checklist:agent_onboarding_checklist(*)')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      );
    }

    // Validate agent is ready for approval
    if (agent.status === 'active') {
      return NextResponse.json(
        { error: { code: 'ALREADY_ACTIVE', message: 'Agent is already active' } },
        { status: 409 }
      );
    }

    if (agent.status !== 'pending_admin') {
      return NextResponse.json(
        { error: { code: 'NOT_READY', message: `Agent status is '${agent.status}'. Must be 'pending_admin' to approve.` } },
        { status: 400 }
      );
    }

    // Update agent status to 'active'
    const { data: updatedAgent, error: updateError } = await serviceClient
      .from('agents')
      .update({ status: 'active' })
      .eq('id', agentId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update agent status: ${updateError.message}`);
    }

    // Update checklist - mark approved but NOT deployed
    await serviceClient
      .from('agent_onboarding_checklist')
      .update({
        admin_approved: true,
        activated_at: new Date().toISOString(),
        activated_by_user_id: user.id,
        // site_deployed stays false until deploy is triggered
      })
      .eq('agent_id', agentId);

    // Create audit log
    await serviceClient.from('audit_logs').insert({
      table_name: 'agents',
      record_id: agentId,
      action: 'update',
      user_id: user.id,
      changes: {
        status: { from: 'pending_admin', to: 'active' },
        action: 'approved',
      },
    });

    console.log(`✅ Agent ${agentId} approved by ${user.id}`);

    return NextResponse.json({
      success: true,
      agent: {
        id: updatedAgent.id,
        status: updatedAgent.status,
        subdomain: updatedAgent.subdomain,
        approved_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Approve endpoint error:', error);

    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
