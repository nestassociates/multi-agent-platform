/**
 * Agent Properties API Contract
 * Endpoint: GET /api/public/agents/[id]/properties
 *
 * Note: This endpoint already exists.
 * Used for "Agent's Other Properties" carousel on property detail page.
 */

// =============================================================================
// Request
// =============================================================================

export interface AgentPropertiesParams {
  id: string  // Agent UUID
}

export interface AgentPropertiesQuery {
  exclude?: string      // Property ID to exclude (current property)
  limit?: number        // Default: 10, Max: 20
  status?: 'available'  // Filter by status
}

// =============================================================================
// Response
// =============================================================================

export interface AgentPropertiesResponse {
  data: PropertyCard[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface PropertyCard {
  id: string
  apex27_id: string
  title: string
  slug: string
  price: number
  transaction_type: 'sale' | 'let'
  status: string
  property_type: string | null
  bedrooms: number | null
  bathrooms: number | null
  featured_image_url: string | null
  address: {
    town: string
    postcode: string
  }
  property_url: string
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
// - AGENT_NOT_FOUND: Agent with ID not found
// - INTERNAL_SERVER_ERROR: Server error

// =============================================================================
// HTTP Details
// =============================================================================

/**
 * GET /api/public/agents/:id/properties?exclude=:propertyId&limit=10&status=available
 *
 * Returns: AgentPropertiesResponse | ErrorResponse
 *
 * Status codes:
 * - 200: Success
 * - 404: Agent not found
 * - 500: Server error
 *
 * Headers:
 * - Access-Control-Allow-Origin: *
 * - Cache-Control: public, s-maxage=300, stale-while-revalidate=600
 */
