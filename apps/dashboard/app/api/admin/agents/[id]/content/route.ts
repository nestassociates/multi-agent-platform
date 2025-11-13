import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', params.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Agent not found' } },
        { status: 404 }
      );
    }

    // Fetch content
    const { data: content, error: contentError } = await supabase
      .from('content_submissions')
      .select('id, content_type, title, slug, status, created_at, updated_at')
      .eq('agent_id', params.id)
      .order('updated_at', { ascending: false });

    if (contentError) {
      console.error('Error fetching content:', contentError);
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: contentError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ content: content || [] });
  } catch (error: any) {
    console.error('Error fetching agent content:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
