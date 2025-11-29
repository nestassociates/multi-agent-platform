import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { z } from 'zod';

const setPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const sendResetSchema = z.object({
  redirectTo: z.string().url().optional(),
});

/**
 * POST /api/admin/agents/[id]/password
 * Set a specific password for an agent (admin action)
 */
export async function POST(
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
    const validatedData = setPasswordSchema.parse(body);

    const supabase = createServiceRoleClient();

    // Fetch agent to get user_id
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('id, user_id, profile:profiles!agents_user_id_fkey(email)')
      .eq('id', params.id)
      .single();

    if (fetchError || !agent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      );
    }

    // Update the user's password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      agent.user_id,
      { password: validatedData.password }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: { code: 'UPDATE_ERROR', message: updateError.message } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error: any) {
    console.error('Error setting password:', error);

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

/**
 * PUT /api/admin/agents/[id]/password
 * Send a password reset email to the agent
 */
export async function PUT(
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

    const body = await request.json().catch(() => ({}));
    const validatedData = sendResetSchema.parse(body);

    const supabase = createServiceRoleClient();

    // Fetch agent to get email
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('id, user_id, profile:profiles!agents_user_id_fkey(email)')
      .eq('id', params.id)
      .single();

    if (fetchError || !agent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      );
    }

    const email = (agent.profile as any)?.email;
    if (!email) {
      return NextResponse.json(
        { error: { code: 'NO_EMAIL', message: 'Agent has no email address' } },
        { status: 400 }
      );
    }

    // Generate a password recovery link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: validatedData.redirectTo || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
      },
    });

    if (linkError) {
      console.error('Error generating reset link:', linkError);
      return NextResponse.json(
        { error: { code: 'LINK_ERROR', message: linkError.message } },
        { status: 400 }
      );
    }

    // The generateLink API returns the link but doesn't send an email automatically
    // We need to send the email ourselves using our email service
    // For now, we'll use Supabase's built-in resetPasswordForEmail which sends the email

    // Create a new client instance for sending the reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: validatedData.redirectTo || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
    });

    if (resetError) {
      console.error('Error sending reset email:', resetError);
      return NextResponse.json(
        { error: { code: 'EMAIL_ERROR', message: resetError.message } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password reset email sent to ${email}`
    });
  } catch (error: any) {
    console.error('Error sending password reset:', error);

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
