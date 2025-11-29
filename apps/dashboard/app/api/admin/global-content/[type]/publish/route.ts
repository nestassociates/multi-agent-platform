import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { globalContentTypes, type GlobalContentType } from '@nest/validation';
import { queueGlobalContentRebuild } from '@nest/build-system';

/**
 * T031-T032: POST /api/admin/global-content/[type]/publish
 * Publish content and trigger rebuilds for ALL active agents
 * Admin authentication required
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const supabase = createClient();

    // T029: Get authenticated user and check admin role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Validate content type
    if (!globalContentTypes.includes(type as GlobalContentType)) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `Content type '${type}' not found` } },
        { status: 404 }
      );
    }

    const supabaseAdmin = createServiceRoleClient();

    // Get current content to check for unpublished changes
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('global_content')
      .select('*')
      .eq('content_type', type)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: `Content type '${type}' not found. Create content first.` } },
          { status: 404 }
        );
      }
      console.error('Error fetching global content:', fetchError);
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: 'Failed to fetch content' } },
        { status: 500 }
      );
    }

    // Check if there are changes to publish
    const hasChanges =
      !existing.is_published ||
      (existing.published_at && new Date(existing.updated_at) > new Date(existing.published_at));

    if (!hasChanges && existing.is_published) {
      return NextResponse.json(
        { error: { code: 'NO_CHANGES', message: 'No unpublished changes to publish' } },
        { status: 409 }
      );
    }

    const publishedAt = new Date().toISOString();

    // Update publish status
    const { error: updateError } = await supabaseAdmin
      .from('global_content')
      .update({
        is_published: true,
        published_at: publishedAt,
        updated_at: publishedAt,
      })
      .eq('content_type', type);

    if (updateError) {
      console.error('Error publishing global content:', updateError);
      return NextResponse.json(
        { error: { code: 'UPDATE_ERROR', message: 'Failed to publish content' } },
        { status: 500 }
      );
    }

    // T032: Queue rebuilds for all active agents with emergency priority (1)
    let rebuildsQueued = 0;
    try {
      const result = await queueGlobalContentRebuild(type);
      rebuildsQueued = result.queued;

      if (result.errors > 0) {
        console.warn(`[Publish] ${result.errors} builds failed to queue for ${type}`);
      }
    } catch (queueError) {
      console.error('Error queuing rebuilds:', queueError);
      // Don't fail the publish if queue fails - content is still published
    }

    return NextResponse.json({
      success: true,
      message: 'Content published successfully',
      rebuildsQueued,
      content: {
        id: existing.id,
        contentType: type,
        isPublished: true,
        publishedAt,
      },
    });
  } catch (error: any) {
    console.error('POST /api/admin/global-content/[type]/publish error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
