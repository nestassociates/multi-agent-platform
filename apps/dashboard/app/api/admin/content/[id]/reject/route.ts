import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { rejectContentSchema } from '@nest/validation';
import { sendContentRejectedEmail } from '@nest/email';

/**
 * POST /api/admin/content/[id]/reject
 * Reject content with a reason
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const contentId = params.id;

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: { message: 'Forbidden' } }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = rejectContentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            message: 'Validation failed',
            details: validationResult.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { rejection_reason } = validationResult.data;

    // Get content with agent information
    const supabaseAdmin = createServiceRoleClient();
    const { data: content, error: fetchError } = await supabaseAdmin
      .from('content_submissions')
      .select(
        `
        *,
        agent:agents (
          id,
          user_id,
          profiles!agents_user_id_fkey (
            first_name,
            last_name,
            email
          )
        )
      `
      )
      .eq('id', contentId)
      .single();

    if (fetchError || !content) {
      return NextResponse.json(
        { error: { message: 'Content not found' } },
        { status: 404 }
      );
    }

    // Update content status to rejected
    const { error: updateError } = await supabaseAdmin
      .from('content_submissions')
      .update({
        status: 'rejected',
        rejection_reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by_user_id: user.id,
      })
      .eq('id', contentId);

    if (updateError) {
      console.error('Error rejecting content:', updateError);
      return NextResponse.json(
        { error: { message: 'Failed to reject content' } },
        { status: 500 }
      );
    }

    // Send rejection email to agent
    try {
      const agentProfile = content.agent?.profiles?.[0];
      if (agentProfile) {
        await sendContentRejectedEmail(agentProfile.email, {
          agentName: `${agentProfile.first_name} ${agentProfile.last_name}`,
          contentTitle: content.title,
          contentType: content.content_type,
          rejectionReason: rejection_reason,
        });
      }
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Content rejected',
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/content/[id]/reject:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
