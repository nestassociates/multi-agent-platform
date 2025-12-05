/**
 * Site Data Loader
 * T056: Loads agent site data from API (dev) or pre-generated JSON (production)
 */

import type { AgentSiteData, Property } from './types';

// In development, fetch from dashboard API
// In production (static build), load from generated JSON file
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api';

// Default agent ID for development - George Bailey
const DEV_AGENT_ID = import.meta.env.PUBLIC_DEV_AGENT_ID || 'cdd58692-779a-459b-b1d0-c545ca40bfc0';

/**
 * Load site data for the agent
 * In dev mode, fetches from dashboard API (always fresh)
 * In production, loads from pre-generated data file
 */
export async function getSiteData(): Promise<AgentSiteData | null> {
  // In development mode, always fetch from API for fresh data
  const isDev = import.meta.env.DEV;

  if (!isDev) {
    // Production: Check if we have pre-generated data
    try {
      const generatedData = await import('../data/site-data.json');
      if (generatedData.default) {
        return generatedData.default as AgentSiteData;
      }
    } catch {
      // No pre-generated data, fall through to API fetch
    }
  }

  // Development mode or no pre-generated data: fetch from dashboard API
  try {
    // Add cache-busting timestamp in dev mode
    const url = isDev
      ? `${API_URL}/agent-site/${DEV_AGENT_ID}/data?_t=${Date.now()}`
      : `${API_URL}/agent-site/${DEV_AGENT_ID}/data`;
    const response = await fetch(url, {
      cache: 'no-store', // Ensure fresh data
    });
    if (!response.ok) {
      console.error('Failed to fetch site data:', response.status, response.statusText);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading site data:', error);
    return null;
  }
}

/**
 * Get agent properties (fetched at runtime for freshness)
 * Properties are always fetched from API to ensure up-to-date listings
 */
export async function getProperties(agentId?: string): Promise<Property[]> {
  const id = agentId || DEV_AGENT_ID;
  
  try {
    const response = await fetch(`${API_URL}/agent-site/${id}/properties`);
    if (!response.ok) {
      console.error('Failed to fetch properties:', response.status);
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading properties:', error);
    return [];
  }
}

/**
 * Get content items by type (blog posts, area guides)
 */
export function getContentByType(
  data: AgentSiteData,
  type: 'blog_post' | 'area_guide'
): AgentSiteData['content'] {
  return data.content.filter((item) => item.contentType === type);
}

/**
 * Get a single content item by slug
 */
export function getContentBySlug(
  data: AgentSiteData,
  slug: string
): AgentSiteData['content'][number] | undefined {
  return data.content.find((item) => item.slug === slug);
}

/**
 * Get primary navigation items
 */
export function getPrimaryNavigation(data: AgentSiteData): AgentSiteData['navigation'] {
  return data.navigation.filter((item) => item.primary);
}

/**
 * Get footer navigation items
 */
export function getFooterNavigation(data: AgentSiteData): AgentSiteData['navigation'] {
  return data.navigation.filter((item) => item.footer);
}

// Export default placeholder data for when API is unavailable
export const placeholderData: AgentSiteData = {
  agent: {
    id: '',
    name: 'Agent Name',
    email: 'agent@example.com',
    phone: null,
    bio: 'Professional real estate agent',
    qualifications: [],
    socialLinks: {},
    avatarUrl: null,
    subdomain: 'agent',
    googlePlaceId: null,
  },
  sections: {
    blog: false,
    areaGuides: false,
    reviews: false,
    fees: false,
    properties: true,
  },
  navigation: [
    { label: 'Home', href: '/', primary: true, footer: true },
    { label: 'About', href: '/about', primary: true, footer: true },
    { label: 'Properties', href: '/properties', primary: true, footer: true },
    { label: 'Contact', href: '/contact', primary: true, footer: true },
  ],
  content: [],
  fees: null,
  globalContent: {
    header: null,
    footer: null,
    privacyPolicy: null,
    termsOfService: null,
    cookiePolicy: null,
    complaintsProc: null,
  },
};
