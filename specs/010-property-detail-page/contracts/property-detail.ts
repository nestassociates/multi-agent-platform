/**
 * Property Detail API Contract
 * Endpoint: GET /api/public/properties/[slug]
 */

// =============================================================================
// Request
// =============================================================================

/**
 * Route parameters
 */
export interface PropertyDetailParams {
  slug: string  // URL-safe property slug (derived from title)
}

// =============================================================================
// Response
// =============================================================================

export interface PropertyDetailResponse {
  // Identifiers
  id: string
  apex27_id: string
  slug: string

  // Core Details
  title: string
  description: string | null
  price: number
  transaction_type: 'sale' | 'let'
  status: 'available' | 'under_offer' | 'sold' | 'let' | 'withdrawn'
  property_type: string | null

  // Specifications
  bedrooms: number | null
  bathrooms: number | null
  size_sqft: number | null
  tenure: string | null

  // Property Details Grid
  council_tax_band: string | null
  parking: string | null
  garden: string | null
  accessibility: string | null

  // Location
  address: {
    line1: string
    line2: string
    town: string
    county: string
    postcode: string
  }
  location: {
    latitude: number | null
    longitude: number | null
  }

  // Media
  images: PropertyImage[]
  featured_image_url: string | null
  floor_plan_url: string | null
  virtual_tour_url: string | null

  // Features
  features: string[]

  // EPC Data (if available)
  epc: EPCData | null

  // Utilities (if available)
  utilities: UtilitiesData | null

  // Agent Info
  agent: AgentInfo

  // URLs
  property_url: string

  // Timestamps
  created_at: string
  updated_at: string
}

export interface PropertyImage {
  url: string
  alt: string | null
  order: number
}

export interface EPCData {
  current_rating: string | null       // A-G rating
  potential_rating: string | null     // A-G rating
  current_efficiency: number | null   // 0-100
  potential_efficiency: number | null // 0-100
  current_environmental: number | null
  potential_environmental: number | null
}

export interface UtilitiesData {
  electricity: string | null
  water: string | null
  sewerage: string | null
  heating: string | null
  broadband: string | null
  mobile_coverage: string | null
}

export interface AgentInfo {
  id: string
  name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  subdomain: string
  microsite_url: string
  social_media: SocialMediaLinks | null
  google_place_id: string | null
}

export interface SocialMediaLinks {
  instagram: string | null
  facebook: string | null
  twitter: string | null
  linkedin: string | null
}

// =============================================================================
// Error Response
// =============================================================================

export interface ErrorResponse {
  error: {
    code: string
    message: string
  }
}

// Error codes:
// - NOT_FOUND: Property with slug not found
// - INTERNAL_SERVER_ERROR: Server error

// =============================================================================
// HTTP Details
// =============================================================================

/**
 * GET /api/public/properties/:slug
 *
 * Returns: PropertyDetailResponse | ErrorResponse
 *
 * Status codes:
 * - 200: Success
 * - 404: Property not found
 * - 500: Server error
 *
 * Headers:
 * - Access-Control-Allow-Origin: *
 * - Cache-Control: public, s-maxage=300, stale-while-revalidate=600
 */
