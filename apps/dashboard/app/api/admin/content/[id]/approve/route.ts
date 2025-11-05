import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendContentApprovedEmail } from '@nest/email';
import { addBuild } from '@nest/build-system';

/**
 * POST /api/admin/content/[id]/approve
 * Approve content for publishing
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

    // Update content status to approved
    const { error: updateError } = await supabase
      .from('agent_content')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq('id', contentId);

    if (updateError) {
      console.error('Error approving content:', updateError);
      return NextResponse.json(
        { error: { message: 'Failed to approve content' } },
        { status: 500 }
      );
    }

    // Send approval email to agent
    try {
      await sendContentApprovedEmail(content.agent.profile.email, {
        agentName: `${content.agent.profile.first_name} ${content.agent.profile.last_name}`,
        contentTitle: content.title,
        contentType: content.content_type,
      });
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
      // Don't fail the request if email fails
    }

    // Queue site rebuild for agent
    try {
      await addBuild({
        agent_id: content.agent_id,
        trigger: 'content_approved',
        priority: 'normal',
        metadata: {
          content_id: contentId,
          content_title: content.title,
          content_type: content.content_type,
        },
      });
    } catch (buildError) {
      console.error('Error queuing build:', buildError);
      // Don't fail the request if queue fails
    }

    return NextResponse.json({
      success: true,
      message: 'Content approved successfully',
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/content/[id]/approve:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
