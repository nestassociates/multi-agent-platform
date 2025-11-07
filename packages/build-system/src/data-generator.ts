/**
 * Data Generator
 * Fetches agent data, content, and properties to generate JSON for Astro builds
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
  };
  properties: Array<{
    id: string;
    title: string;
    description: string | null;
    price: number;
    bedrooms: number | null;
    bathrooms: number | null;
    propertyType: string | null;
    address: any;
    postcode: string | null;
    images: any[];
    features: string[];
    status: string;
    isFeatured: boolean;
    transactionType: string;
  }>;
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
  globalContent: {
    header: string | null;
    footer: string | null;
    privacyPolicy: string | null;
    termsOfService: string | null;
  };
}

/**
 * Generate complete site data for an agent
 * @param agentId - Agent UUID
 * @returns Complete data for Astro build
 */
export async function generateAgentSiteData(
  agentId: string
): Promise<AgentSiteData | null> {
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

    // Fetch agent's properties (only available/under_offer)
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .eq('agent_id', agentId)
      .in('status', ['available', 'under_offer'])
      .eq('is_hidden', false)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
    }

    // Fetch published content
    const { data: content, error: contentError } = await supabase
      .from('content_submissions')
      .select('*')
      .eq('agent_id', agentId)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (contentError) {
      console.error('Error fetching content:', contentError);
    }

    // Fetch global content
    const { data: globalContent, error: globalError } = await supabase
      .from('global_content')
      .select('*')
      .eq('is_published', true);

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
    };

    // Format properties
    const formattedProperties =
      properties?.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        price: parseFloat(p.price) || 0,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        propertyType: p.property_type,
        address: p.address,
        postcode: p.postcode,
        images: p.images || [],
        features: p.features || [],
        status: p.status,
        isFeatured: p.is_featured,
        transactionType: p.transaction_type,
      })) || [];

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

    return {
      agent: formattedAgent,
      properties: formattedProperties,
      content: formattedContent,
      globalContent: {
        header: globalMap.header || null,
        footer: globalMap.footer || null,
        privacyPolicy: globalMap.privacy_policy || null,
        termsOfService: globalMap.terms_of_service || null,
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
