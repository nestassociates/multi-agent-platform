import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createContentSchema } from '@nest/validation';
import { generateSlug, generateUniqueSlug } from '@/lib/slug-generator';

/**
 * POST /api/agent/content
 * Create new content (draft or submit for review)
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createContentSchema.safeParse(body);

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

    // Generate slug if not provided
    let slug = data.slug || generateSlug(data.title);

    // Check for slug uniqueness
    const { data: existingContent } = await supabase
      .from('content_submissions')
      .select('slug')
      .eq('agent_id', agent.id);

    if (existingContent) {
      const existingSlugs = existingContent.map((c) => c.slug);
      slug = generateUniqueSlug(slug, existingSlugs);
    }

    // Determine status (default to draft if not specified)
    const status = body.status || 'draft';

    // Create content
    const { data: content, error: insertError } = await supabase
      .from('content_submissions')
      .insert({
        agent_id: agent.id,
        content_type: data.content_type,
        title: data.title,
        slug,
        content_body: data.content_body,
        excerpt: data.excerpt || null,
        featured_image_url: data.featured_image_url || null,
        seo_meta_title: data.seo_meta_title || null,
        seo_meta_description: data.seo_meta_description || null,
        status,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating content:', insertError);
      return NextResponse.json(
        { error: { message: 'Failed to create content' } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        content,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/agent/content:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/content
 * List agent's content
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

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

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const contentType = searchParams.get('content_type');

    // Build query
    let query = supabase
      .from('content_submissions')
      .select('*')
      .eq('agent_id', agent.id)
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data: content, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching content:', fetchError);
      return NextResponse.json(
        { error: { message: 'Failed to fetch content' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      content: content || [],
    });
  } catch (error: any) {
    console.error('Error in GET /api/agent/content:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
