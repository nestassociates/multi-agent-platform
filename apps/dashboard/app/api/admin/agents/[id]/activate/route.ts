/**
 * POST /api/admin/agents/[id]/activate
 * Approve agent and trigger site deployment
 *
 * Feature: 004-agent-lifecycle-management
 * Tasks: T046-T049
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { activateAgent } from '@/lib/services/agent-activation';
import { activateAgentSchema } from '@nest/validation';

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

    // Validate request body (T047)
    const body = await request.json().catch(() => ({}));
    const validatedData = activateAgentSchema.parse(body);

    // Activate agent (T048)
    const result = await activateAgent(agentId, user.id, validatedData.reason);

    // T049: Handle errors
    if (!result.success) {
      // Check for duplicate activation
      if (result.error?.includes('already active')) {
        return NextResponse.json(
          { error: { code: 'AGENT_ALREADY_ACTIVE', message: result.error } },
          { status: 409 }
        );
      }

      // Check for not ready
      if (result.error?.includes('incomplete') || result.error?.includes('ready')) {
        return NextResponse.json(
          { error: { code: 'AGENT_NOT_READY', message: result.error } },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: { code: 'ACTIVATION_FAILED', message: result.error } },
        { status: 500 }
      );
    }

    // Send activation email to agent
    const { sendSiteActivatedEmail } = await import('@nest/email');
    const { data: agentProfile } = await supabase
      .from('agents')
      .select('*, profile:profiles!agents_user_id_fkey(*)')
      .eq('id', agentId)
      .single();

    if (agentProfile?.profile) {
      try {
        await sendSiteActivatedEmail(agentProfile.profile.email, {
          agentName: `${agentProfile.profile.first_name} ${agentProfile.profile.last_name}`,
          siteUrl: `https://${result.agent.subdomain}.nestassociates.com`,
          dashboardUrl: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.nestassociates.com',
        });
      } catch (emailError) {
        console.error('Failed to send activation email (non-fatal):', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: result.agent.id,
        status: result.agent.status,
        subdomain: result.agent.subdomain,
        activated_at: new Date().toISOString(),
      },
      build: {
        id: result.buildId,
        status: 'pending',
        priority: 'P1',
      },
    });
  } catch (error: any) {
    console.error('Activation endpoint error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
