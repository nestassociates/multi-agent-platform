import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { z } from 'zod';

const updateAgentSchema = z.object({
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
  apex27_branch_id: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*, profile:profiles!agents_user_id_fkey(first_name, last_name, email, phone, avatar_url)')
      .eq('id', params.id)
      .single();

    if (error || !agent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: agent });
  } catch (error: any) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateAgentSchema.parse(body);

    const supabase = createServiceRoleClient();

    // Check if agent exists
    const { data: existingAgent, error: fetchError } = await supabase
      .from('agents')
      .select('id, user_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingAgent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      );
    }

    // Prepare updates
    const agentUpdates: any = {};
    const profileUpdates: any = {};

    if (validatedData.bio !== undefined) agentUpdates.bio = validatedData.bio;
    if (validatedData.apex27_branch_id !== undefined) {
      agentUpdates.apex27_branch_id = validatedData.apex27_branch_id || null;
    }
    if (validatedData.status !== undefined) agentUpdates.status = validatedData.status;
    if (validatedData.phone !== undefined) profileUpdates.phone = validatedData.phone || null;

    // Update agent table
    if (Object.keys(agentUpdates).length > 0) {
      const { error: agentError } = await supabase
        .from('agents')
        .update(agentUpdates)
        .eq('id', params.id);

      if (agentError) {
        console.error('Error updating agent:', agentError);
        return NextResponse.json(
          { error: { code: 'UPDATE_ERROR', message: agentError.message } },
          { status: 400 }
        );
      }
    }

    // Update profile table
    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('user_id', existingAgent.user_id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        return NextResponse.json(
          { error: { code: 'UPDATE_ERROR', message: profileError.message } },
          { status: 400 }
        );
      }
    }

    // Trigger rebuild if bio or status changed
    if (validatedData.bio !== undefined || validatedData.status !== undefined) {
      await supabase.from('build_queue').insert({
        agent_id: params.id,
        priority: 'P2',
        trigger_reason: 'agent_updated',
        status: 'pending',
      });
    }

    // Fetch updated agent
    const { data: updatedAgent } = await supabase
      .from('agents')
      .select('*, profile:profiles!agents_user_id_fkey(first_name, last_name, email, phone, avatar_url)')
      .eq('id', params.id)
      .single();

    return NextResponse.json({ data: updatedAgent });
  } catch (error: any) {
    console.error('Error updating agent:', error);

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Fetch agent to get user_id
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('id, user_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !agent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      );
    }

    // Delete in order (cascade):
    // 1. Content submissions
    await supabase.from('content_submissions').delete().eq('agent_id', params.id);

    // 2. Build queue
    await supabase.from('build_queue').delete().eq('agent_id', params.id);

    // 3. Properties (unassign, don't delete)
    await supabase.from('properties').update({ agent_id: null }).eq('agent_id', params.id);

    // 4. Agent record
    const { error: agentError } = await supabase
      .from('agents')
      .delete()
      .eq('id', params.id);

    if (agentError) {
      console.error('Error deleting agent:', agentError);
      return NextResponse.json(
        { error: { code: 'DELETE_ERROR', message: agentError.message } },
        { status: 400 }
      );
    }

    // 5. Profile record
    await supabase.from('profiles').delete().eq('user_id', agent.user_id);

    // 6. Auth user
    await supabase.auth.admin.deleteUser(agent.user_id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
