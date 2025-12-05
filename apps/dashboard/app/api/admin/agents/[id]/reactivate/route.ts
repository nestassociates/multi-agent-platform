/**
 * POST /api/admin/agents/[id]/reactivate
 * Reactivate an inactive or suspended agent
 *
 * Feature: 004-agent-lifecycle-management
 * Tasks: T063
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reactivateAgent } from '@/lib/services/agent-activation';
import { reactivateAgentSchema } from '@nest/validation';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;

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

    // Validate request body
    const body = await request.json().catch(() => ({}));
    const validatedData = reactivateAgentSchema.parse(body);

    // Reactivate agent
    const result = await reactivateAgent(
      agentId,
      user.id,
      validatedData.reason,
      validatedData.queueBuild
    );

    if (!result.success) {
      // Check for invalid status transition
      if (result.error?.includes('Cannot reactivate')) {
        return NextResponse.json(
          { error: { code: 'INVALID_STATUS_TRANSITION', message: result.error } },
          { status: 400 }
        );
      }

      if (result.error?.includes('not found')) {
        return NextResponse.json(
          { error: { code: 'AGENT_NOT_FOUND', message: result.error } },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: { code: 'REACTIVATION_FAILED', message: result.error } },
        { status: 500 }
      );
    }

    const response: any = {
      success: true,
      agent: {
        id: result.agent.id,
        status: result.agent.status,
        subdomain: result.agent.subdomain,
        previousStatus: result.previousStatus,
        reactivated_at: new Date().toISOString(),
      },
      message: 'Agent reactivated. Builds will now be processed normally.',
    };

    // Include build info if a build was queued
    if (result.buildId) {
      response.build = {
        id: result.buildId,
        status: 'pending',
        priority: 'P1',
      };
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Reactivation endpoint error:', error);

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
