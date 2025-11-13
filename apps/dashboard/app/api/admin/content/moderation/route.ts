import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/content/moderation
 * Get all content pending review
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

    // Step 3: Data fetch with service role client (bypasses RLS for joins)
    const supabaseAdmin = createServiceRoleClient();
    const { data: content, error: fetchError } = await supabaseAdmin
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
      `
      )
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching moderation queue:', fetchError);
      return NextResponse.json(
        { error: { message: 'Failed to fetch moderation queue' } },
        { status: 500 }
      );
    }

    console.log('[Moderation API] Content data:', JSON.stringify(content, null, 2));
    console.log('[Moderation API] First item agent:', content?.[0]?.agent);
    if (content?.[0]?.agent) {
      console.log('[Moderation API] Agent keys:', Object.keys(content[0].agent));
      console.log('[Moderation API] Agent profiles:', content[0].agent.profiles);
    }

    return NextResponse.json({
      success: true,
      content: content || [],
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/content/moderation:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
