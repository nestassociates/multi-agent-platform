import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { decodeCursor, buildPaginationResponse } from '@/lib/cursor-pagination';

/**
 * GET /api/admin/content/moderation
 * Get content pending review with optional filters and cursor pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Auth check with regular client (has session access)
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    // Step 2: Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: { message: 'Forbidden' } }, { status: 403 });
    }

    // Step 3: Parse query parameters for filtering and pagination
    const searchParams = request.nextUrl.searchParams;
    const contentType = searchParams.get('content_type');
    const agentId = searchParams.get('agent_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const searchQuery = searchParams.get('search');
    const cursorParam = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Decode cursor if provided
    const cursor = cursorParam ? decodeCursor(cursorParam) : null;

    // Step 4: Build filtered query with service role client
    const supabaseAdmin = createServiceRoleClient();
    let query = supabaseAdmin
      .from('content_submissions')
      .select(
        `
        *,
        agent:agents (
          id,
          subdomain,
          user_id,
          profiles!agents_user_id_fkey (
            first_name,
            last_name,
            email
          )
        )
      `,
        { count: 'exact' }
      )
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check hasNextPage

    // Apply filters
    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      // Add 1 day to include the entire "to" date
      const toDate = new Date(dateTo);
      toDate.setDate(toDate.getDate() + 1);
      query = query.lt('created_at', toDate.toISOString());
    }

    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    // Apply cursor for pagination
    if (cursor) {
      query = query.or(
        `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
      );
    }

    const { data: content, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('Error fetching moderation queue:', fetchError);
      return NextResponse.json(
        { error: { message: 'Failed to fetch moderation queue' } },
        { status: 500 }
      );
    }

    // Build pagination response
    const response = buildPaginationResponse(content || [], limit, count || 0);

    return NextResponse.json({
      success: true,
      content: response.data,
      pagination: response.pagination,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/content/moderation:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
