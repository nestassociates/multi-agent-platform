/**
 * API Request/Response Types
 * Generated from openapi.yaml
 * These types match the API contract exactly
 */

import type {
  Profile,
  Agent,
  AgentDetail,
  ContentSubmission,
  Property,
  Territory,
  BuildJob,
  UserRole,
  AgentStatus,
  ContentType,
  ContentStatus,
  TransactionType,
  SocialMediaLinks,
  PropertyAddress,
  PropertyImage,
} from './entities';

/**
 * Authentication Types
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string; // JWT, 1 hour expiry
  refresh_token: string;
  user: Profile;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

/**
 * Agent Management Types
 */

export interface CreateAgentRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  subdomain: string;
  apex27_branch_id?: string;
  bio?: string;
  qualifications?: string[];
  social_media_links?: SocialMediaLinks;
}

export interface UpdateAgentRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  bio?: string;
  qualifications?: string[];
  social_media_links?: SocialMediaLinks;
  status?: AgentStatus;
}

export interface ListAgentsRequest {
  page?: number;
  limit?: number;
  search?: string;
  status?: AgentStatus;
}

export interface ListAgentsResponse {
  data: Agent[];
  pagination: Pagination;
}

export interface GetAgentResponse extends AgentDetail {}

/**
 * Content Management Types
 */

export interface CreateContentRequest {
  content_type: ContentType;
  title: string;
  slug?: string;
  content_body: string; // HTML from Tiptap
  excerpt?: string;
  featured_image_url?: string;
  seo_meta_title?: string;
  seo_meta_description?: string;
}

export interface UpdateContentRequest {
  title?: string;
  slug?: string;
  content_body?: string;
  excerpt?: string;
  featured_image_url?: string;
  seo_meta_title?: string;
  seo_meta_description?: string;
  status?: 'draft' | 'pending_review'; // Agents can only set draft or submit for review
}

export interface ListContentRequest {
  status?: ContentStatus;
  content_type?: ContentType;
}

export interface ListContentResponse {
  data: ContentSubmission[];
}

export interface ApproveContentResponse {
  content: ContentSubmission;
  build_job_id: string; // UUID of created build job
}

export interface RejectContentRequest {
  rejection_reason: string;
}

export interface RejectContentResponse extends ContentSubmission {}

export interface GetModerationQueueRequest {
  agent_id?: string;
  content_type?: ContentType;
}

export interface GetModerationQueueResponse {
  data: ContentSubmission[];
}

/**
 * Property Management Types
 */

export interface ListPropertiesRequest {
  agent_id?: string;
  transaction_type?: TransactionType;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  postcode?: string;
  page?: number;
  limit?: number;
}

export interface ListPropertiesResponse {
  data: Property[];
  pagination: Pagination;
}

/**
 * Territory Management Types
 */

export interface CreateTerritoryRequest {
  agent_id: string;
  name: string;
  boundary: GeoJSON.Polygon; // GeoJSON polygon
}

export interface UpdateTerritoryRequest {
  name?: string;
  boundary?: GeoJSON.Polygon;
  agent_id?: string; // Reassign territory
}

export interface ListTerritoriesRequest {
  agent_id?: string;
}

export interface ListTerritoriesResponse {
  data: Territory[];
}

export interface CheckTerritoryOverlapRequest {
  boundary: GeoJSON.Polygon;
  exclude_id?: string; // Exclude this territory ID from overlap check (for updates)
}

export interface CheckTerritoryOverlapResponse {
  overlaps: boolean;
  overlapping_territories: Array<{
    id: string;
    name: string;
    agent_id: string;
    agent_name: string;
  }>;
}

/**
 * Build System Types
 */

export interface TriggerBuildRequest {
  agent_id: string;
  priority?: 1 | 2 | 3 | 4; // Default: 3 (normal)
  trigger_reason: string;
}

export interface TriggerBuildResponse extends BuildJob {}

export interface ListBuildQueueRequest {
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  agent_id?: string;
  page?: number;
  limit?: number;
}

export interface ListBuildQueueResponse {
  data: BuildJob[];
  pagination: Pagination;
}

export interface RetryBuildRequest {
  build_job_id: string;
}

export interface RetryBuildResponse extends BuildJob {}

/**
 * Public API Types (WordPress Integration)
 */

export interface PublicAgent {
  id: string;
  name: string; // Computed: first_name + last_name
  email: string;
  phone: string | null;
  bio: string | null;
  subdomain: string;
  avatar_url: string | null;
}

export interface ListPublicAgentsResponse {
  data: PublicAgent[];
}

export interface PublicProperty {
  id: string;
  agent: {
    id: string;
    name: string; // Computed: first_name + last_name
    subdomain: string;
  };
  title: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  images: PropertyImage[];
  link: string; // URL to property detail page: https://{subdomain}.agents.nestassociates.com/properties/{slug}
}

export interface SearchPublicPropertiesRequest {
  transaction_type?: TransactionType;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  postcode?: string;
  location?: string;
  limit?: number; // Default: 20, max: 100
}

export interface SearchPublicPropertiesResponse {
  data: PublicProperty[];
}

/**
 * Webhook Types
 */

export interface Apex27WebhookPayload {
  event: 'property.created' | 'property.updated' | 'property.deleted';
  timestamp: string; // ISO 8601
  branch_id: string;
  property: {
    id: string;
    transaction_type: TransactionType;
    title: string;
    description?: string;
    price: number;
    bedrooms?: number;
    bathrooms?: number;
    property_type?: string;
    address: PropertyAddress;
    postcode: string;
    latitude?: number;
    longitude?: number;
    images?: Array<{
      url: string;
      order?: number;
      alt?: string;
    }>;
    features?: string[];
    floor_plan_url?: string;
    virtual_tour_url?: string;
    status?: 'available' | 'under_offer' | 'sold' | 'let' | 'withdrawn';
    is_featured?: boolean;
  };
}

export interface WebhookResponse {
  success: boolean;
  message?: string;
}

/**
 * Shared Types
 */

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

/**
 * Common Error Codes
 */
export enum ErrorCode {
  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resource
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Webhook
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  WEBHOOK_PROCESSING_ERROR = 'WEBHOOK_PROCESSING_ERROR',

  // Build System
  BUILD_FAILED = 'BUILD_FAILED',
  BUILD_TIMEOUT = 'BUILD_TIMEOUT',
  DUPLICATE_BUILD = 'DUPLICATE_BUILD',

  // General
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * Type Guards
 */

export function isErrorResponse(obj: any): obj is ErrorResponse {
  return obj && typeof obj === 'object' && 'error' in obj;
}

export function isValidationError(error: ErrorResponse): boolean {
  return error.error.code === ErrorCode.VALIDATION_ERROR;
}

/**
 * GeoJSON namespace (for consistency with entities.ts)
 */
export declare namespace GeoJSON {
  interface Point {
    type: 'Point';
    coordinates: [number, number];
  }

  interface Polygon {
    type: 'Polygon';
    coordinates: number[][][];
  }
}
