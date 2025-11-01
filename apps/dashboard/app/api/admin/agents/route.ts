import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { createAgentSchema } from '@nest/validation';
import { validateEmailUnique, validateSubdomainUnique, handleApiError, logError } from '@/lib/error-handler';

/**
 * POST /api/admin/agents
 * Create a new agent account
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin role
    await requireRole(['super_admin', 'admin']);

    const body = await request.json();

    // Validate input
    const validatedData = createAgentSchema.parse(body);

    // Use service role client to create auth user and bypass RLS
    const supabase = createServiceRoleClient();

    // 1. Create Supabase Auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
      },
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return NextResponse.json(
        {
          error: {
            code: authError.code || 'AUTH_ERROR',
            message: authError.message,
          },
        },
        { status: 400 }
      );
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: { code: 'AUTH_ERROR', message: 'Failed to create user' } },
        { status: 500 }
      );
    }

    // 2. Create profile record
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authUser.user.id,
        role: 'agent',
        email: validatedData.email,
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        phone: validatedData.phone || null,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Rollback: Delete auth user
      await supabase.auth.admin.deleteUser(authUser.user.id);

      return NextResponse.json(
        {
          error: {
            code: 'PROFILE_ERROR',
            message: profileError.message,
          },
        },
        { status: 400 }
      );
    }

    // 3. Create agent record
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .insert({
        user_id: authUser.user.id,
        subdomain: validatedData.subdomain,
        apex27_branch_id: validatedData.apex27_branch_id || null,
        bio: validatedData.bio || null,
        qualifications: validatedData.qualifications || [],
        social_media_links: validatedData.social_media_links || {},
        status: 'active',
      })
      .select()
      .single();

    if (agentError) {
      console.error('Agent creation error:', agentError);
      // Rollback: Delete profile and auth user
      await supabase.from('profiles').delete().eq('user_id', authUser.user.id);
      await supabase.auth.admin.deleteUser(authUser.user.id);

      return NextResponse.json(
        {
          error: {
            code: agentError.code || 'AGENT_ERROR',
            message: agentError.message,
          },
        },
        { status: 400 }
      );
    }

    // 4. Send welcome email
    // TODO: Fix email package import path - temporarily disabled for testing
    try {
      // const { sendWelcomeEmail } = await import('@nest/email/sender');
      // await sendWelcomeEmail({
      //   agentName: `${validatedData.first_name} ${validatedData.last_name}`,
      //   email: validatedData.email,
      //   temporaryPassword: validatedData.password,
      //   loginUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/login` : undefined,
      // });
      console.log('Welcome email would be sent to:', validatedData.email);
    } catch (emailError) {
      // Log error but don't fail the agent creation
      console.error('Failed to send welcome email:', emailError);
      // Agent is still created successfully
    }
    // 5. Return created agent
    return NextResponse.json(agent, { status: 201 });
  } catch (error: any) {
    console.error('Agent creation error:', error);

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

    if (error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while creating the agent',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/agents
 * List all agents with search and filter
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin role
    await requireRole(['super_admin', 'admin']);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const supabase = createClient();

    // Build query
    let query = supabase
      .from('agents')
      .select(
        `
        *,
        profile:profiles!agents_user_id_fkey(
          first_name,
          last_name,
          email,
          phone
        )
      `,
        { count: 'exact' }
      );

    // Apply search filter
    if (search) {
      query = query.or(
        `subdomain.ilike.%${search}%,profile.first_name.ilike.%${search}%,profile.last_name.ilike.%${search}%,profile.email.ilike.%${search}%`
      );
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data: agents, error, count } = await query;

    if (error) {
      console.error('Error fetching agents:', error);
      return NextResponse.json(
        {
          error: {
            code: 'QUERY_ERROR',
            message: error.message,
          },
        },
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
    console.error('List agents error:', error);

    if (error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching agents',
        },
      },
      { status: 500 }
    );
  }
}
