import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
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
    const supabase = createServiceRoleClient();
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
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
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
    const { data: content, error: fetchError } = await supabase
      .from('agent_content')
      .select(
        `
        *,
        agent:agents (
          id,
          user_id,
          profile:profiles (
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
    const { error: updateError } = await supabase
      .from('agent_content')
      .update({
        status: 'rejected',
        rejection_reason,
        rejected_at: new Date().toISOString(),
        rejected_by: user.id,
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
      await sendContentRejectedEmail(content.agent.profile.email, {
        agentName: `${content.agent.profile.first_name} ${content.agent.profile.last_name}`,
        contentTitle: content.title,
        contentType: content.content_type,
        rejectionReason: rejection_reason,
      });
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
