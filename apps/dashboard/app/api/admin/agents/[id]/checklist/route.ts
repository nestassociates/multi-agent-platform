/**
 * GET /api/admin/agents/[id]/checklist
 * Get onboarding checklist for agent
 *
 * Feature: 004-agent-lifecycle-management
 * Task: T051
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
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

    // Get checklist
    const serviceRoleClient = createServiceRoleClient();
    const { data: checklist, error } = await serviceRoleClient
      .from('agent_onboarding_checklist')
      .select('*')
      .eq('agent_id', agentId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    if (!checklist) {
      return NextResponse.json(
        { error: { code: 'CHECKLIST_NOT_FOUND', message: 'Checklist not found for this agent' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      checklist,
    });
  } catch (error: any) {
    console.error('Get checklist error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
