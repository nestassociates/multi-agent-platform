import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/auth';
import { updateAgentProfileSchema } from '@nest/validation';

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

    // Update profile (phone number)
    if (validatedData.phone !== undefined) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ phone: validatedData.phone })
        .eq('user_id', agent.user_id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        return NextResponse.json(
          { error: { code: 'UPDATE_ERROR', message: profileError.message } },
          { status: 400 }
        );
      }
    }

    // Update agent record (bio, qualifications, social_media_links, avatar_url)
    const agentUpdates: any = {};

    if (validatedData.bio !== undefined) agentUpdates.bio = validatedData.bio;
    if (validatedData.qualifications !== undefined)
      agentUpdates.qualifications = validatedData.qualifications;
    if (validatedData.social_media_links !== undefined)
      agentUpdates.social_media_links = validatedData.social_media_links;
    if (validatedData.avatar_url !== undefined) agentUpdates.avatar_url = validatedData.avatar_url;

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

    // Queue site rebuild (use service role to bypass RLS)
    await serviceRoleClient.from('build_queue').insert({
      agent_id: agent.id,
      priority: 3, // Normal priority
      trigger_reason: 'profile_update',
    });

    return NextResponse.json(updatedAgent);
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
