import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateContentSchema } from '@nest/validation';

/**
 * PATCH /api/agent/content/[id]
 * Update existing content
 */
export async function PATCH(
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

    // Get agent profile
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: { message: 'Agent profile not found' } },
        { status: 404 }
      );
    }

    // Verify content belongs to this agent
    const { data: existingContent, error: checkError } = await supabase
      .from('content_submissions')
      .select('*')
      .eq('id', contentId)
      .eq('agent_id', agent.id)
      .single();

    if (checkError || !existingContent) {
      return NextResponse.json(
        { error: { message: 'Content not found or access denied' } },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateContentSchema.safeParse(body);

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

    const data = validationResult.data;

    // Prepare update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.content_body !== undefined) updateData.content_body = data.content_body;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.featured_image_url !== undefined)
      updateData.featured_image_url = data.featured_image_url;
    if (data.seo_meta_title !== undefined) updateData.seo_meta_title = data.seo_meta_title;
    if (data.seo_meta_description !== undefined)
      updateData.seo_meta_description = data.seo_meta_description;

    // Agents can only set status to 'draft' or 'pending_review'
    if (data.status !== undefined) {
      if (data.status === 'draft' || data.status === 'pending_review') {
        updateData.status = data.status;
      } else {
        return NextResponse.json(
          { error: { message: 'Invalid status. Agents can only set draft or pending_review.' } },
          { status: 400 }
        );
      }
    }

    // Update content
    const { data: updatedContent, error: updateError } = await supabase
      .from('content_submissions')
      .update(updateData)
      .eq('id', contentId)
      .eq('agent_id', agent.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating content:', updateError);
      return NextResponse.json(
        { error: { message: 'Failed to update content' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      content: updatedContent,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/agent/content/[id]:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/content/[id]
 * Get single content item
 */
export async function GET(
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

    // Get agent profile
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: { message: 'Agent profile not found' } },
        { status: 404 }
      );
    }

    // Fetch content
    const { data: content, error: fetchError } = await supabase
      .from('content_submissions')
      .select('*')
      .eq('id', contentId)
      .eq('agent_id', agent.id)
      .single();

    if (fetchError || !content) {
      return NextResponse.json(
        { error: { message: 'Content not found or access denied' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error: any) {
    console.error('Error in GET /api/agent/content/[id]:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
