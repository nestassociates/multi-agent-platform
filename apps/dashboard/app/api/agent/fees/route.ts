import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { feeStructureSchema } from '@nest/validation';

/**
 * GET /api/agent/fees
 * Get the authenticated agent's current fee structure
 */
export async function GET() {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent profile
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Get fee structure
    const { data: fees, error: feesError } = await supabase
      .from('agent_fees')
      .select('*')
      .eq('agent_id', agent.id)
      .single();

    // Return null if no fees configured yet (not an error)
    return NextResponse.json({ fees: fees || null });
  } catch (error: any) {
    console.error('Error in GET /api/agent/fees:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/agent/fees
 * Create or update the authenticated agent's fee structure
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = feeStructureSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors }, { status: 400 });
    }

    // Get agent profile
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Sanitize HTML content (same pattern as blog posts)
    const { sanitizeHtml } = await import('@/lib/sanitize.server');
    const sanitizedContent = sanitizeHtml(validation.data.content_body);

    // Upsert fee structure (create if doesn't exist, update if exists)
    const { data, error } = await supabase
      .from('agent_fees')
      .upsert({
        agent_id: agent.id,
        content_body: sanitizedContent,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving fee structure:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ success: true, fees: data });
  } catch (error: any) {
    console.error('Error in POST /api/agent/fees:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
