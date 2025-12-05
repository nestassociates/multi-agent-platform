/**
 * POST /api/admin/agents/[id]/deploy
 * Queue site deployment for an approved agent
 *
 * This queues a P1 priority build for the agent's microsite.
 * Agent must already be in 'active' status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { queueActivationBuild } from '@/lib/services/agent-activation';

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
      .select('*, profile:profiles!agents_user_id_fkey(email, first_name, last_name)')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      );
    }

    // Agent must be active to deploy
    if (agent.status !== 'active') {
      return NextResponse.json(
        { error: { code: 'NOT_ACTIVE', message: `Agent status is '${agent.status}'. Must be 'active' to deploy. Approve the agent first.` } },
        { status: 400 }
      );
    }

    // Queue build
    const buildId = await queueActivationBuild(agentId);

    // Update checklist to mark site as deploying
    await serviceClient
      .from('agent_onboarding_checklist')
      .update({
        site_deployed: true,
        deployed_at: new Date().toISOString(),
        deployed_by_user_id: user.id,
      })
      .eq('agent_id', agentId);

    // Send activation email to agent
    try {
      const { sendSiteActivatedEmail } = await import('@nest/email');
      if (agent.profile) {
        await sendSiteActivatedEmail(agent.profile.email, {
          agentName: `${agent.profile.first_name} ${agent.profile.last_name}`,
          siteUrl: `https://${agent.subdomain}.nestassociates.co.uk`,
          dashboardUrl: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.nestassociates.co.uk',
        });
      }
    } catch (emailError) {
      console.error('Failed to send activation email (non-fatal):', emailError);
    }

    // Create audit log
    await serviceClient.from('audit_logs').insert({
      table_name: 'agents',
      record_id: agentId,
      action: 'update',
      user_id: user.id,
      changes: {
        action: 'deploy_queued',
        build_id: buildId,
      },
    });

    console.log(`🚀 Deploy queued for agent ${agentId} by ${user.id}, build: ${buildId}`);

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        status: agent.status,
        subdomain: agent.subdomain,
      },
      build: {
        id: buildId,
        status: 'pending',
        priority: 'P1',
      },
    });
  } catch (error: any) {
    console.error('Deploy endpoint error:', error);

    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'An error occurred' } },
      { status: 500 }
    );
  }
}
