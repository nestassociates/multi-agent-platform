import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

/**
 * T027: GET /api/admin/global-content
 * List all global content types with their publish status
 * Admin authentication required
 */
export async function GET(request: NextRequest) {
  try {
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

    // Fetch all global content
    const supabaseAdmin = createServiceRoleClient();
    const { data: content, error: contentError } = await supabaseAdmin
      .from('global_content')
      .select('id, content_type, is_published, published_at, updated_at')
      .order('content_type', { ascending: true });

    if (contentError) {
      console.error('Error fetching global content:', contentError);
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: 'Failed to fetch global content' } },
        { status: 500 }
      );
    }

    // Format response with camelCase
    const formattedContent = (content || []).map((item) => ({
      id: item.id,
      contentType: item.content_type,
      isPublished: item.is_published,
      publishedAt: item.published_at,
      updatedAt: item.updated_at,
    }));

    return NextResponse.json({ data: formattedContent });
  } catch (error: any) {
    console.error('GET /api/admin/global-content error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
