/**
 * POST /api/admin/agents/[id]/deactivate
 * Deactivate an active agent (site stays live, no new builds)
 *
 * Feature: 004-agent-lifecycle-management
 * Tasks: T065-T067
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deactivateAgent } from '@/lib/services/agent-activation';
import { deactivateAgentSchema } from '@nest/validation';

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

    // Validate request body (T066)
    const body = await request.json().catch(() => ({}));
    const validatedData = deactivateAgentSchema.parse(body);

    // Deactivate agent
    const result = await deactivateAgent(agentId, user.id, validatedData.reason);

    if (!result.success) {
      // Check for invalid status transition
      if (result.error?.includes('Cannot deactivate')) {
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
        { error: { code: 'DEACTIVATION_FAILED', message: result.error } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: result.agent.id,
        status: result.agent.status,
        subdomain: result.agent.subdomain,
        previousStatus: result.previousStatus,
        deactivated_at: new Date().toISOString(),
      },
      message: 'Agent deactivated. Site remains live but no new builds will be processed.',
    });
  } catch (error: any) {
    console.error('Deactivation endpoint error:', error);

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
