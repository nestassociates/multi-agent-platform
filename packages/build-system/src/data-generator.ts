/**
 * Data Generator
 * Fetches agent data, content, and properties to generate JSON for Astro builds
 */

import { createClient } from '@supabase/supabase-js';
import type { SectionVisibility, NavItem } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * T009: Updated AgentSiteData interface with sections and navigation
 * Properties removed - they are fetched client-side at runtime for freshness
 */
export interface AgentSiteData {
  agent: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    bio: string | null;
    qualifications: string[];
    socialLinks: Record<string, string>;
    avatarUrl: string | null;
    subdomain: string;
    googlePlaceId: string | null;
  };
  /** Section visibility flags - determines which pages to generate */
  sections: SectionVisibility;
  /** Navigation items based on available content */
  navigation: NavItem[];
  /** Blog posts and area guides (approved/published only) */
  content: Array<{
    id: string;
    contentType: string;
    title: string;
    slug: string;
    contentBody: string;
    excerpt: string | null;
    featuredImageUrl: string | null;
    publishedAt: string;
  }>;
  /** Agent fee structure content (HTML from TipTap editor) */
  fees: string | null;
  globalContent: {
    header: string | null;
    footer: string | null;
    privacyPolicy: string | null;
    termsOfService: string | null;
    cookiePolicy: string | null;
  };
}

/**
 * T007: Determine which sections should be visible on the agent's site
 * Based on content availability
 */
export function determineSectionVisibility(
  blogPosts: any[],
  areaGuides: any[],
  googlePlaceId: string | null,
  feesContent: string | null
): SectionVisibility {
  return {
    blog: blogPosts.length > 0,
    areaGuides: areaGuides.length > 0,
    reviews: !!googlePlaceId,
    fees: !!feesContent && feesContent.trim().length > 0,
    properties: true, // Always show - fetched client-side
  };
}

/**
 * T008: Generate navigation items based on section visibility
 * Only includes links to sections that have content
 */
export function generateNavigation(sections: SectionVisibility): NavItem[] {
  const navigation: NavItem[] = [
    { label: 'Home', href: '/', primary: true, footer: true },
    { label: 'About', href: '/about', primary: true, footer: true },
    { label: 'Services', href: '/services', primary: true, footer: true },
  ];

  // Properties is always available (client-side fetch)
  if (sections.properties) {
    navigation.push({ label: 'Properties', href: '/properties', primary: true, footer: true });
  }

  // Conditional sections based on content availability
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

  // Contact is always available
  navigation.push({ label: 'Contact', href: '/contact', primary: true, footer: true });

  return navigation;
}

/**
 * Generate complete site data for an agent
 * T010: Properties removed - fetched client-side at runtime for freshness
 * T020-T021: Calls determineSectionVisibility() and generateNavigation()
 *
 * @param agentId - Agent UUID
 * @returns Complete data for Astro build
 */
export async function generateAgentSiteData(
  agentId: string
): Promise<AgentSiteData | null> {
  try {
    // Fetch agent profile with google_place_id
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
        profile:profiles!user_id (
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
      console.error(`Agent ${agentId} not found or inactive:`, agentError);
      return null;
    }

    // T010: Properties are NOT fetched at build time - they're fetched client-side
    // This ensures property data is always fresh without requiring a rebuild

    // T023-T024: Fetch approved/published content (blog posts and area guides)
    // Content with status='approved' or status='published' should be included
    const { data: content, error: contentError } = await supabase
      .from('content_submissions')
      .select('*')
      .eq('agent_id', agentId)
      .in('status', ['approved', 'published'])
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('reviewed_at', { ascending: false });

    if (contentError) {
      console.error('Error fetching content:', contentError);
    }

    // Fetch agent fees
    const { data: fees, error: feesError } = await supabase
      .from('agent_fees')
      .select('content_body')
      .eq('agent_id', agentId)
      .single();

    if (feesError && feesError.code !== 'PGRST116') {
      // PGRST116 = no rows found (expected if no fees)
      console.error('Error fetching fees:', feesError);
    }

    // Fetch global content
    const { data: globalContent, error: globalError } = await supabase
      .from('global_content')
      .select('*')
      .eq('is_published', true);

    if (globalError) {
      console.error('Error fetching global content:', globalError);
    }

    const globalMap = (globalContent || []).reduce(
      (acc, item) => {
        acc[item.content_type] = item.content_body;
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

    // Format content - separate blog posts and area guides for visibility check
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

    // T020: Determine section visibility based on content availability
    const sections = determineSectionVisibility(
      blogPosts,
      areaGuides,
      agent.google_place_id,
      feesContent
    );

    // T021: Generate navigation based on section visibility
    const navigation = generateNavigation(sections);

    return {
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
      },
    };
  } catch (error) {
    console.error('Error generating agent site data:', error);
    throw error;
  }
}

/**
 * Generate data file for agent site build
 * @param agentId - Agent UUID
 * @returns JSON string ready to write to file
 */
export async function generateDataFile(agentId: string): Promise<string | null> {
  const data = await generateAgentSiteData(agentId);

  if (!data) {
    return null;
  }

  return JSON.stringify(data, null, 2);
}
