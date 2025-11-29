import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import {
  globalContentTypes,
  headerContentSchema,
  footerContentSchema,
  legalContentSchema,
  type GlobalContentType,
} from '@nest/validation';

/**
 * T028: GET /api/admin/global-content/[type]
 * Get specific content type with full content
 * Admin authentication required
 */
export async function GET(
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

    // Fetch specific content
    const supabaseAdmin = createServiceRoleClient();
    const { data: content, error: contentError } = await supabaseAdmin
      .from('global_content')
      .select('*')
      .eq('content_type', type)
      .single();

    if (contentError) {
      if (contentError.code === 'PGRST116') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: `Content type '${type}' not found` } },
          { status: 404 }
        );
      }
      console.error('Error fetching global content:', contentError);
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: 'Failed to fetch global content' } },
        { status: 500 }
      );
    }

    // Parse content body (stored as JSON string or HTML)
    let parsedContent: any;
    try {
      parsedContent = JSON.parse(content.content_body);
    } catch {
      // If not valid JSON, wrap in html object for legal pages
      parsedContent = { html: content.content_body };
    }

    return NextResponse.json({
      id: content.id,
      contentType: content.content_type,
      content: parsedContent,
      isPublished: content.is_published,
      publishedAt: content.published_at,
      updatedAt: content.updated_at,
    });
  } catch (error: any) {
    console.error('GET /api/admin/global-content/[type] error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}

/**
 * T028, T030: PUT /api/admin/global-content/[type]
 * Update content (saves as draft, does not publish)
 * Admin authentication required
 */
export async function PUT(
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

    // Parse request body
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Content is required' } },
        { status: 400 }
      );
    }

    // T030: Validate content based on type
    let validationResult;
    switch (type as GlobalContentType) {
      case 'header':
        validationResult = headerContentSchema.safeParse(content);
        break;
      case 'footer':
        validationResult = footerContentSchema.safeParse(content);
        break;
      case 'privacy_policy':
      case 'terms_of_service':
      case 'cookie_policy':
        validationResult = legalContentSchema.safeParse(content);
        break;
      default:
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: `Content type '${type}' not found` } },
          { status: 404 }
        );
    }

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid content structure',
            details: {
              path: firstError.path.join('.'),
              reason: firstError.message,
            },
          },
        },
        { status: 400 }
      );
    }

    // Serialize content to string
    const contentBody = JSON.stringify(content);

    // Check if content exists
    const supabaseAdmin = createServiceRoleClient();
    const { data: existing } = await supabaseAdmin
      .from('global_content')
      .select('id, is_published, published_at')
      .eq('content_type', type)
      .single();

    let result;
    if (existing) {
      // Update existing content
      const { data, error } = await supabaseAdmin
        .from('global_content')
        .update({
          content_body: contentBody,
          updated_at: new Date().toISOString(),
        })
        .eq('content_type', type)
        .select()
        .single();

      if (error) {
        console.error('Error updating global content:', error);
        return NextResponse.json(
          { error: { code: 'UPDATE_ERROR', message: 'Failed to update content' } },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // Create new content
      const { data, error } = await supabaseAdmin
        .from('global_content')
        .insert({
          content_type: type,
          content_body: contentBody,
          is_published: false,
          created_by_user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating global content:', error);
        return NextResponse.json(
          { error: { code: 'CREATE_ERROR', message: 'Failed to create content' } },
          { status: 500 }
        );
      }
      result = data;
    }

    // Check if there are unpublished changes
    const hasUnpublishedChanges =
      !result.is_published ||
      (result.published_at && new Date(result.updated_at) > new Date(result.published_at));

    return NextResponse.json({
      id: result.id,
      contentType: result.content_type,
      content: content,
      isPublished: result.is_published,
      publishedAt: result.published_at,
      updatedAt: result.updated_at,
      hasUnpublishedChanges,
    });
  } catch (error: any) {
    console.error('PUT /api/admin/global-content/[type] error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
