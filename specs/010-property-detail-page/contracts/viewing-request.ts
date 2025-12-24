/**
 * Viewing Request API Contract (Simplified for Main Site)
 * Endpoint: POST /api/public/viewing-request
 *
 * Note: This endpoint already exists and is fully functional.
 * This contract documents the simplified form data for the main-site property page.
 */

// =============================================================================
// Request (Simplified for main-site property page)
// =============================================================================

/**
 * Simplified viewing request form for property detail page
 * Maps to existing viewing request schema on backend
 */
export interface ViewingRequestFormData {
  // Contact Info (required)
  firstName: string           // Combined with surname into 'name' field
  surname: string
  email: string               // Valid email format
  phone: string               // Contact number

  // Property Interest
  propertyToSell: 'yes' | 'no' | ''   // Maps to buyerStatus
  propertyToLet: 'yes' | 'no' | ''    // Additional context

  // Auto-populated (not shown in form)
  agentId: string             // From property data
  propertyId: string          // Current property ID
  sourcePage: string          // Current page URL
}

/**
 * Actual request body sent to API
 * Transforms form data to match existing viewingRequestSchema
 */
export interface ViewingRequestAPIBody {
  name: string                // `${firstName} ${surname}`
  email: string
  phone: string | null
  agentId: string
  propertyId: string
  apex27ListingId: string | null
  preferredTime: 'flexible'   // Default for simplified form
  flexibleDates: true         // Default for simplified form
  buyerStatus: 'looking' | 'sold_stc' | 'under_offer' | 'not_selling'
  mortgageStatus: 'not_specified'  // Default for simplified form
  additionalNotes: string | null
  sourcePage: string
  honeypot: ''                // Bot detection field
}

// =============================================================================
// Response
// =============================================================================

export interface ViewingRequestSuccessResponse {
  success: true
  message: string   // "Thank you for your viewing request..."
}

export interface ViewingRequestErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: {
      field: string
      reason: string
    }
    remaining?: number    // Rate limit remaining
    resetAt?: number      // Rate limit reset timestamp
  }
}

// Error codes:
// - FORBIDDEN: Invalid origin (CORS)
// - RATE_LIMITED: Too many submissions
// - INVALID_SUBMISSION: Honeypot triggered
// - VALIDATION_ERROR: Form validation failed
// - AGENT_NOT_FOUND: Agent doesn't exist
// - AGENT_INACTIVE: Agent not accepting requests
// - DATABASE_ERROR: Failed to save
// - INTERNAL_SERVER_ERROR: General error

// =============================================================================
// HTTP Details
// =============================================================================

/**
 * POST /api/public/viewing-request
 *
 * Request body: ViewingRequestAPIBody
 * Returns: ViewingRequestSuccessResponse | ViewingRequestErrorResponse
 *
 * Status codes:
 * - 200: Success
 * - 400: Validation error / Invalid submission
 * - 403: CORS origin not allowed
 * - 404: Agent not found / inactive
 * - 429: Rate limited
 * - 500: Server error
 *
 * Headers (response):
 * - Access-Control-Allow-Origin: [origin]
 * - X-RateLimit-Remaining: [number]
 * - X-RateLimit-Reset: [timestamp]
 * - Retry-After: [seconds] (on 429)
 *
 * Rate limit: 5 requests per IP per hour
 */
