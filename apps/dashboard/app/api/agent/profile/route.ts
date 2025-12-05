import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/auth';
import { updateAgentProfileSchema } from '@nest/validation';
import { updateChecklistProgress } from '@/lib/services/profile-completion';

/**
 * GET /api/agent/profile
 * Get current agent's profile
 */
export async function GET(_request: NextRequest) {
  try {
    const agent = await getCurrentAgent();

    if (!agent) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated as agent' } },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // Get agent with profile
    const { data: agentWithProfile, error } = await supabase
      .from('agents')
      .select(
        `
        *,
        profile:profiles!agents_user_id_fkey(*)
      `
      )
      .eq('id', agent.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json(agentWithProfile);
  } catch (error: any) {
    console.error('Get agent profile error:', error);

    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agent/profile
 * Update current agent's profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const agent = await getCurrentAgent();

    if (!agent) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated as agent' } },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = updateAgentProfileSchema.parse(body);

    const supabase = createClient();
    const serviceRoleClient = createServiceRoleClient();

    // Update profile (phone number, avatar_url)
    const profileUpdates: any = {};
    if (validatedData.phone !== undefined) profileUpdates.phone = validatedData.phone;
    if (validatedData.avatar_url !== undefined) profileUpdates.avatar_url = validatedData.avatar_url;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('user_id', agent.user_id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        return NextResponse.json(
          { error: { code: 'UPDATE_ERROR', message: profileError.message } },
          { status: 400 }
        );
      }
    }

    // Update agent record (bio, qualifications, social_media_links, google_place_id)
    // Note: avatar_url is stored on profiles table, not agents
    const agentUpdates: any = {};

    if (validatedData.bio !== undefined) agentUpdates.bio = validatedData.bio;
    if (validatedData.qualifications !== undefined)
      agentUpdates.qualifications = validatedData.qualifications;
    if (validatedData.social_media_links !== undefined)
      agentUpdates.social_media_links = validatedData.social_media_links;
    if (body.google_place_id !== undefined) agentUpdates.google_place_id = body.google_place_id;

    const { data: updatedAgent, error: agentError } = await supabase
      .from('agents')
      .update(agentUpdates)
      .eq('id', agent.id)
      .select()
      .single();

    if (agentError) {
      console.error('Agent update error:', agentError);
      return NextResponse.json(
        { error: { code: 'UPDATE_ERROR', message: agentError.message } },
        { status: 400 }
      );
    }

    // T036-T038: Calculate profile completion and update checklist
    const completionResult = await updateChecklistProgress(agent.id, agent.user_id);

    // If status changed to pending_admin, notify admins
    if (completionResult.statusChanged && completionResult.newStatus === 'pending_admin') {
      // Notify admins that agent is ready for review
      const { sendProfileCompleteEmail } = await import('@nest/email');

      // Get agent's profile for name
      const { data: agentProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', agent.user_id)
        .single();

      // Get admin emails
      const { data: admins } = await serviceRoleClient
        .from('profiles')
        .select('email, first_name')
        .in('role', ['admin', 'super_admin']);

      if (admins && admins.length > 0 && agentProfile) {
        for (const admin of admins) {
          try {
            await sendProfileCompleteEmail(admin.email, {
              agentName: `${agentProfile.first_name} ${agentProfile.last_name}`,
              agentId: agent.id,
              agentSubdomain: agent.subdomain,
              dashboardUrl: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.nestassociates.com',
            });
          } catch (emailError) {
            console.error('Failed to send profile-complete email:', emailError);
          }
        }
      }
    }

    // T051: Only queue rebuild for active agents (not pending status)
    // Use priority 4 (Low) for profile updates
    if (agent.status === 'active') {
      await serviceRoleClient.from('build_queue').insert({
        agent_id: agent.id,
        priority: 4, // Low priority for profile updates
        trigger_reason: 'profile_update',
      });
    }

    return NextResponse.json({
      ...updatedAgent,
      profileCompletion: {
        percentage: completionResult.completionPct,
        isComplete: completionResult.completionPct === 100,
        statusChanged: completionResult.statusChanged,
      },
    });
  } catch (error: any) {
    console.error('Update agent profile error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
