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
    const draftAgentId = body.draft_agent_id; // Optional: Converting draft agent to real agent

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

    // 3. Create or update agent
    let agent;

    if (draftAgentId) {
      // Converting draft agent to real agent - UPDATE existing record
      const { data: updatedAgent, error: updateError } = await supabase
        .from('agents')
        .update({
          user_id: authUser.user.id,
          subdomain: validatedData.subdomain,
          status: 'pending_profile', // Now has user, waiting for profile completion
        })
        .eq('id', draftAgentId)
        .eq('status', 'draft') // Safety: only update draft agents
        .select()
        .single();

      if (updateError) {
        console.error('Draft agent update error:', updateError);
        await supabase.from('profiles').delete().eq('user_id', authUser.user.id);
        await supabase.auth.admin.deleteUser(authUser.user.id);
        return NextResponse.json(
          { error: { code: 'UPDATE_ERROR', message: updateError.message } },
          { status: 400 }
        );
      }

      agent = updatedAgent;
      console.log(`Converted draft agent ${draftAgentId} to real agent`);
    } else {
      // Creating brand new agent
      const { data: newAgent, error: agentError } = await supabase.from('agents').insert({
        user_id: authUser.user.id,
        subdomain: validatedData.subdomain,
        apex27_branch_id: validatedData.apex27_branch_id || null,
        bio: validatedData.bio || null,
        qualifications: validatedData.qualifications || [],
        social_media_links: validatedData.social_media_links || {},
        status: 'pending_profile', // Agent needs to complete profile
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

      agent = newAgent;
    }

    // T028-T029: Create or update onboarding checklist
    const { data: existingChecklist } = await supabase
      .from('agent_onboarding_checklist')
      .select('id')
      .eq('agent_id', agent.id)
      .maybeSingle();

    if (existingChecklist) {
      // Update existing checklist (for draft agents)
      await supabase
        .from('agent_onboarding_checklist')
        .update({
          user_created: true,
          welcome_email_sent: true,
        })
        .eq('agent_id', agent.id);
    } else {
      // Create new checklist
      await supabase
        .from('agent_onboarding_checklist')
        .insert({
          agent_id: agent.id,
          user_created: true,
          welcome_email_sent: true,
          profile_completed: false,
          profile_completion_pct: 0,
          admin_approved: false,
          site_deployed: false,
        });
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const supabase = createServiceRoleClient();

    // Build query
    let query = supabase
      .from('agents')
      .select('*, profile:profiles!agents_user_id_fkey(first_name, last_name, email)', { count: 'exact' });

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply search filter (search across name, email, subdomain)
    if (search) {
      // We need to handle search differently as we're searching across relations
      // Get all agents first, then filter in memory for now
      // TODO: Consider using a database view or full-text search for better performance
      const { data: allAgents, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) {
        return NextResponse.json(
          { error: { code: 'QUERY_ERROR', message: fetchError.message } },
          { status: 500 }
        );
      }

      // Filter by search term
      const searchLower = search.toLowerCase();
      const filtered = (allAgents || []).filter((agent: any) => {
        const fullName = `${agent.profile?.first_name} ${agent.profile?.last_name}`.toLowerCase();
        const email = agent.profile?.email?.toLowerCase() || '';
        const subdomain = agent.subdomain.toLowerCase();

        return (
          fullName.includes(searchLower) ||
          email.includes(searchLower) ||
          subdomain.includes(searchLower)
        );
      });

      // Apply pagination
      const total = filtered.length;
      const paginatedData = filtered.slice(offset, offset + limit);

      return NextResponse.json({
        data: paginatedData,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      });
    }

    // No search - use database pagination
    const { data: agents, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: agents || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
