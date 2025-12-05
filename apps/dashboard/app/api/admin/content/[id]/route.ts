import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { sanitizeHtml } from '@/lib/sanitize.server';

/**
 * PATCH /api/admin/content/[id]
 * Update content as admin (edit title, excerpt, content_body)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params;
    const supabase = createClient();

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

    // Parse request body
    const body = await request.json();
    const { title, excerpt, content_body } = body;

    // Validate input
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: { message: 'Title is required' } },
        { status: 400 }
      );
    }

    // Sanitize content if provided
    const sanitizedContent = content_body ? sanitizeHtml(content_body) : undefined;

    // Use service role to bypass RLS
    const supabaseAdmin = createServiceRoleClient();

    // Check that content exists
    const { data: existingContent, error: fetchError } = await supabaseAdmin
      .from('content_submissions')
      .select('id, status')
      .eq('id', contentId)
      .single();

    if (fetchError || !existingContent) {
      return NextResponse.json(
        { error: { message: 'Content not found' } },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, any> = {
      title: title.trim(),
      updated_at: new Date().toISOString(),
    };

    if (excerpt !== undefined) {
      updateData.excerpt = excerpt.trim();
    }

    if (sanitizedContent !== undefined) {
      updateData.content_body = sanitizedContent;
    }

    // Update content
    const { data: updatedContent, error: updateError } = await supabaseAdmin
      .from('content_submissions')
      .update(updateData)
      .eq('id', contentId)
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
      message: 'Content updated successfully',
      data: updatedContent,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/content/[id]:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
