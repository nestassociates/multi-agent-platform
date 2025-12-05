/**
 * Agent Site Data API
 * Returns complete site data for an agent's microsite
 * Used by Astro agent-site in development mode
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface RouteParams {
  params: Promise<{ agentId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { agentId } = await params;

  if (!agentId) {
    return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
  }

  // Use direct Supabase client with service role key to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  try {
    // Fetch agent profile
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select(
        `
        id,
        subdomain,
        bio,
        qualifications,
        social_media_links,
        google_place_id,
        profile:profiles!agents_user_id_fkey (
          email,
          first_name,
          last_name,
          phone,
          avatar_url
        )
      `
      )
      .eq('id', agentId)
      .eq('status', 'active')
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Fetch approved/published content
    const { data: content } = await supabase
      .from('content_submissions')
      .select('*')
      .eq('agent_id', agentId)
      .in('status', ['approved', 'published'])
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('reviewed_at', { ascending: false });

    // Fetch agent fees
    const { data: fees } = await supabase
      .from('agent_fees')
      .select('content_body')
      .eq('agent_id', agentId)
      .single();

    // Fetch global content
    const { data: globalContent, error: globalError } = await supabase
      .from('global_content')
      .select('*')
      .eq('is_published', true);

    const globalMap = (globalContent || []).reduce(
      (acc, item) => {
        // content_body is stored as text containing JSON {html: "..."} - parse and extract HTML
        try {
          const parsed = typeof item.content_body === 'string'
            ? JSON.parse(item.content_body)
            : item.content_body;
          acc[item.content_type] = parsed?.html || item.content_body;
        } catch {
          // If parsing fails, use raw value
          acc[item.content_type] = item.content_body;
        }
        return acc;
      },
      {} as Record<string, string>
    );

    // Format agent data
    const agentProfile = Array.isArray(agent.profile)
      ? agent.profile[0]
      : agent.profile;

    const formattedAgent = {
      id: agent.id,
      name: agentProfile
        ? `${agentProfile.first_name} ${agentProfile.last_name}`
        : 'Agent',
      email: agentProfile?.email || '',
      phone: agentProfile?.phone || null,
      bio: agent.bio,
      qualifications: agent.qualifications || [],
      socialLinks: agent.social_media_links || {},
      avatarUrl: agentProfile?.avatar_url || null,
      subdomain: agent.subdomain,
      googlePlaceId: agent.google_place_id || null,
    };

    // Format content
    const formattedContent =
      content?.map((c) => ({
        id: c.id,
        contentType: c.content_type,
        title: c.title,
        slug: c.slug,
        contentBody: c.content_body,
        excerpt: c.excerpt,
        featuredImageUrl: c.featured_image_url,
        publishedAt: c.published_at,
      })) || [];

    const blogPosts = formattedContent.filter((c) => c.contentType === 'blog_post');
    const areaGuides = formattedContent.filter((c) => c.contentType === 'area_guide');
    const feesContent = fees?.content_body || null;

    // Determine section visibility
    const sections = {
      blog: blogPosts.length > 0,
      areaGuides: areaGuides.length > 0,
      reviews: !!agent.google_place_id,
      fees: !!feesContent && feesContent.trim().length > 0,
      properties: true,
    };

    // Generate navigation
    const navigation = [
      { label: 'Home', href: '/', primary: true, footer: true },
      { label: 'About', href: '/about', primary: true, footer: true },
      { label: 'Services', href: '/services', primary: true, footer: true },
    ];

    if (sections.properties) {
      navigation.push({ label: 'Properties', href: '/properties', primary: true, footer: true });
    }
    if (sections.blog) {
      navigation.push({ label: 'Blog', href: '/blog', primary: true, footer: true });
    }
    if (sections.areaGuides) {
      navigation.push({ label: 'Areas', href: '/areas', primary: true, footer: true });
    }
    if (sections.reviews) {
      navigation.push({ label: 'Reviews', href: '/reviews', primary: true, footer: true });
    }
    if (sections.fees) {
      navigation.push({ label: 'Fees', href: '/fees', primary: true, footer: true });
    }
    navigation.push({ label: 'Contact', href: '/contact', primary: true, footer: true });

    // Enable CORS for local development
    return NextResponse.json(
      {
        agent: formattedAgent,
        sections,
        navigation,
        content: formattedContent,
        fees: feesContent,
        globalContent: {
          header: globalMap.header || null,
          footer: globalMap.footer || null,
          privacyPolicy: globalMap.privacy_policy || null,
          termsOfService: globalMap.terms_of_service || null,
          cookiePolicy: globalMap.cookie_policy || null,
          complaintsProc: globalMap.complaints_procedure || null,
        },
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching agent site data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
