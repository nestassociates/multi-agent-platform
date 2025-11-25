/**
 * Database Entity Types
 * Generated from data-model.md
 * These types match the PostgreSQL schema exactly
 */

export type UserRole = 'super_admin' | 'admin' | 'agent';
export type AgentStatus = 'draft' | 'pending_profile' | 'pending_admin' | 'active' | 'inactive' | 'suspended';
export type TransactionType = 'sale' | 'let' | 'commercial';
export type PropertyStatus = 'available' | 'under_offer' | 'sold' | 'let';
export type ContentType = 'blog_post' | 'area_guide' | 'review' | 'fee_structure';
export type ContentStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published';
export type BuildStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type BuildPriority = 1 | 2 | 3 | 4;
export type GlobalContentType = 'header' | 'footer' | 'privacy_policy' | 'terms_of_service' | 'cookie_policy';
export type AuditAction = 'create' | 'update' | 'delete' | 'view';

/**
 * Profile entity (extends Supabase Auth user)
 */
export interface Profile {
  id: string; // UUID
  user_id: string; // UUID, references auth.users
  role: UserRole;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Social media links JSON object
 */
export interface SocialMediaLinks {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
}

/**
 * Agent entity
 */
export interface Agent {
  id: string; // UUID
  user_id: string | null; // UUID, references profiles (nullable for draft agents)
  subdomain: string; // e.g., "john-smith"
  apex27_branch_id: string | null;
  branch_name: string | null; // Human-readable branch name from Apex27
  bio: string | null;
  qualifications: string[]; // Array of qualification names
  social_media_links: SocialMediaLinks;
  status: AgentStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Agent Onboarding Checklist entity
 */
export interface AgentOnboardingChecklist {
  id: string; // UUID
  agent_id: string; // UUID, references agents

  // Checklist items
  user_created: boolean;
  welcome_email_sent: boolean;
  profile_completed: boolean;
  profile_completion_pct: number; // 0-100
  admin_approved: boolean;
  site_deployed: boolean;

  // Activation metadata
  activated_at: string | null; // ISO 8601
  activated_by_user_id: string | null; // UUID
  deactivated_at: string | null; // ISO 8601
  deactivated_by_user_id: string | null; // UUID
  deactivation_reason: string | null;

  created_at: string;
  updated_at: string;
}

/**
 * Property address JSON object
 */
export interface PropertyAddress {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
}

/**
 * Property image object
 */
export interface PropertyImage {
  url: string;
  alt?: string;
  order: number;
}

/**
 * Property entity
 */
export interface Property {
  id: string; // UUID
  agent_id: string; // UUID, references agents
  apex27_id: string;
  transaction_type: TransactionType;
  title: string;
  description: string | null;
  price: number; // Decimal in DB
  bedrooms: number | null;
  bathrooms: number | null;
  property_type: string | null;
  address: PropertyAddress;
  postcode: string | null;
  location: GeoJSON.Point | null; // PostGIS point
  images: PropertyImage[];
  features: string[];
  floor_plan_url: string | null;
  virtual_tour_url: string | null;
  status: PropertyStatus;
  is_featured: boolean;
  is_hidden: boolean;
  raw_data: Record<string, any> | null; // Full JSON from Apex27
  created_at: string;
  updated_at: string;
}

/**
 * Territory entity
 */
export interface Territory {
  id: string; // UUID
  agent_id: string; // UUID, references agents
  name: string;
  boundary: GeoJSON.Polygon; // PostGIS polygon
  property_count: number | null;
  property_count_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Content submission entity
 */
export interface ContentSubmission {
  id: string; // UUID
  agent_id: string; // UUID, references agents
  content_type: ContentType;
  title: string;
  slug: string;
  content_body: string; // HTML from Tiptap
  excerpt: string | null;
  featured_image_url: string | null;
  seo_meta_title: string | null;
  seo_meta_description: string | null;
  status: ContentStatus;
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by_user_id: string | null; // UUID, references profiles
  published_at: string | null;
  version: number;
  parent_version_id: string | null; // UUID, references content_submissions
  created_at: string;
  updated_at: string;
}

/**
 * Build job entity
 */
export interface BuildJob {
  id: string; // UUID
  agent_id: string; // UUID, references agents
  priority: BuildPriority;
  status: BuildStatus;
  trigger_reason: string;
  build_logs: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Global content entity
 */
export interface GlobalContent {
  id: string; // UUID
  content_type: GlobalContentType;
  content_body: string; // HTML or JSON
  version: number;
  is_published: boolean;
  published_at: string | null;
  created_by_user_id: string; // UUID, references profiles
  created_at: string;
  updated_at: string;
}

/**
 * Audit log entity
 */
export interface AuditLog {
  id: string; // UUID
  user_id: string | null; // UUID, references profiles
  entity_type: string;
  entity_id: string; // UUID
  action: AuditAction;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/**
 * Contact form submission entity
 */
export interface ContactFormSubmission {
  id: string; // UUID
  agent_id: string; // UUID, references agents
  property_id: string | null; // UUID, references properties
  name: string;
  email: string;
  phone: string | null;
  message: string;
  source_page: string | null; // e.g., "/contact", "/properties/123"
  referrer: string | null;
  created_at: string;
}

/**
 * Composite types for relations
 */

export interface AgentWithProfile extends Agent {
  profile: Profile;
}

export interface AgentDetail extends AgentWithProfile {
  property_count: number;
  territory_count: number;
  content_count: number;
}

export interface PropertyWithAgent extends Property {
  agent: Pick<Agent, 'id' | 'subdomain'> & {
    profile: Pick<Profile, 'first_name' | 'last_name'>;
  };
}

export interface ContentSubmissionWithReviewer extends ContentSubmission {
  reviewer?: Pick<Profile, 'id' | 'first_name' | 'last_name'>;
  agent: Pick<Agent, 'id' | 'subdomain'> & {
    profile: Pick<Profile, 'first_name' | 'last_name'>;
  };
}

export interface BuildJobWithAgent extends BuildJob {
  agent: Pick<Agent, 'id' | 'subdomain'> & {
    profile: Pick<Profile, 'first_name' | 'last_name'>;
  };
}

/**
 * GeoJSON type definitions (for PostGIS geography columns)
 */
export declare namespace GeoJSON {
  interface Point {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  }

  interface Polygon {
    type: 'Polygon';
    coordinates: number[][][]; // Array of rings, each ring is array of [lon, lat] points
  }
}
