import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
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
          subdomain,
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

    // Update content status to approved
    const { error: updateError } = await supabaseAdmin
      .from('content_submissions')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by_user_id: user.id,
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
      const agentProfile = content.agent?.profiles?.[0];
      if (agentProfile) {
        await sendContentApprovedEmail(agentProfile.email, {
          agentName: `${agentProfile.first_name} ${agentProfile.last_name}`,
          contentTitle: content.title,
          contentType: content.content_type,
        });
      }
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
      // Don't fail the request if email fails
    }

    // Queue site rebuild for agent
    try {
      await addBuild({
        agent_id: content.agent_id,
        trigger_reason: `Content approved: ${content.title}`,
        priority: 2, // High priority for content approval
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
