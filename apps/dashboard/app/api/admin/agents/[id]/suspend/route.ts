/**
 * POST /api/admin/agents/[id]/suspend
 * Suspend an agent (removes site from public access, cancels pending builds)
 *
 * Feature: 004-agent-lifecycle-management
 * Tasks: T064
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { suspendAgent } from '@/lib/services/agent-activation';
import { suspendAgentSchema } from '@nest/validation';

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
    const validatedData = suspendAgentSchema.parse(body);

    // Suspend agent
    const result = await suspendAgent(agentId, user.id, validatedData.reason);

    if (!result.success) {
      // Check for invalid status transition
      if (result.error?.includes('Cannot suspend')) {
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
        { error: { code: 'SUSPENSION_FAILED', message: result.error } },
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
        suspended_at: new Date().toISOString(),
      },
      message: 'Agent suspended. Site removed from public access and pending builds cancelled.',
    });
  } catch (error: any) {
    console.error('Suspension endpoint error:', error);

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
