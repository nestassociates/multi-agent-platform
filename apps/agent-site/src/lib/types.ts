/**
 * Agent Site Types
 * Type definitions matching the build-system AgentSiteData interface
 */

export interface SectionVisibility {
  blog: boolean;
  areaGuides: boolean;
  reviews: boolean;
  fees: boolean;
  properties: boolean;
}

export interface NavItem {
  label: string;
  href: string;
  primary?: boolean;
  footer?: boolean;
}

export interface ContentItem {
  id: string;
  contentType: string;
  title: string;
  slug: string;
  contentBody: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  publishedAt: string;
}

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
  sections: SectionVisibility;
  navigation: NavItem[];
  content: ContentItem[];
  fees: string | null;
  globalContent: {
    header: string | null;
    footer: string | null;
    privacyPolicy: string | null;
    termsOfService: string | null;
    cookiePolicy: string | null;
    complaintsProc: string | null;
  };
}

export interface Property {
  id: string;
  title: string;
  slug: string;
  price: number;
  transactionType: 'sale' | 'rent';
  propertyType: string | null;
  bedrooms: number;
  bathrooms: number;
  description: string | null;
  address: string | null;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  images: string[];
  floorplans: string[];
  epcUrl: string | null;
  apex27Id: string;
}
