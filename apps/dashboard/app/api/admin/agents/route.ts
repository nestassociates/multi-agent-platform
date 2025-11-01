import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { createAgentSchema } from '@nest/validation';

export async function POST(request: NextRequest) {
  try {
    // Check authentication (don't use requireRole - it redirects!)
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createAgentSchema.parse(body);

    // Use service role client to create user and bypass RLS
    const supabase = createServiceRoleClient();

    // 1. Create Supabase Auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true,
    });

    if (authError || !authUser.user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: { code: 'AUTH_ERROR', message: authError?.message || 'Failed to create user' } },
        { status: 400 }
      );
    }

    // 2. Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: authUser.user.id,
      role: 'agent',
      email: validatedData.email,
      first_name: validatedData.first_name,
      last_name: validatedData.last_name,
      phone: validatedData.phone || null,
    });

    if (profileError) {
      console.error('Profile error:', profileError);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        { error: { code: 'PROFILE_ERROR', message: profileError.message } },
        { status: 400 }
      );
    }

    // 3. Create agent
    const { data: agent, error: agentError } = await supabase.from('agents').insert({
      user_id: authUser.user.id,
      subdomain: validatedData.subdomain,
      apex27_branch_id: validatedData.apex27_branch_id || null,
      bio: validatedData.bio || null,
      qualifications: validatedData.qualifications || [],
      social_media_links: validatedData.social_media_links || {},
      status: 'active',
    }).select().single();

    if (agentError) {
      console.error('Agent error:', agentError);
      await supabase.from('profiles').delete().eq('user_id', authUser.user.id);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        { error: { code: 'AGENT_ERROR', message: agentError.message } },
        { status: 400 }
      );
    }

    // Success!
    console.log('Agent created successfully:', agent.id);
    return NextResponse.json(agent, { status: 201 });

  } catch (error: any) {
    console.error('Agent creation error:', error);

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

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*, profile:profiles!agents_user_id_fkey(first_name, last_name, email)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: agents || [], pagination: { page: 1, limit: 50, total: agents?.length || 0, total_pages: 1 } });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
