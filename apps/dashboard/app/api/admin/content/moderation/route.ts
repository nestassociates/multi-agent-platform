import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/content/moderation
 * Get all content pending review
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

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

    // Fetch pending content with agent information
    const { data: content, error: fetchError } = await supabase
      .from('agent_content')
      .select(
        `
        *,
        agent:agents (
          id,
          profile:profiles (
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
