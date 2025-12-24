/**
 * Dashboard API Client
 * Fetches property and agent data from the dashboard public API
 */

import type {
  Property,
  PropertyDetail,
  PropertyCard,
  Agent,
  PaginatedResponse,
  PropertyFilters,
  AgentFilters,
} from './types'

const DASHBOARD_API_URL = process.env.DASHBOARD_API_URL || 'http://localhost:3000'

/**
 * Helper to handle fetch errors gracefully
 * Returns null for connection errors (e.g., during build when API is unavailable)
 */
async function safeFetch(url: string, options?: RequestInit): Promise<Response | null> {
  try {
    return await fetch(url, options)
  } catch (error) {
    // During build, API may be unavailable - return null instead of throwing
    if (process.env.NODE_ENV === 'production' || (error instanceof Error && error.cause && (error.cause as NodeJS.ErrnoException).code === 'ECONNREFUSED')) {
      console.warn(`[Dashboard API] Connection failed to ${url}`)
      return null
    }
    throw error
  }
}

/**
 * Empty paginated response for fallback
 */
function emptyPaginatedResponse<T>(): PaginatedResponse<T> {
  return {
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
  }
}

/**
 * Fetch properties from dashboard API
 */
export async function getProperties(
  filters?: PropertyFilters
): Promise<PaginatedResponse<Property>> {
  const searchParams = new URLSearchParams()

  if (filters?.transaction_type) {
    searchParams.set('transaction_type', filters.transaction_type)
  }
  if (filters?.status) {
    searchParams.set('status', filters.status)
  }
  if (filters?.property_type) {
    searchParams.set('property_type', filters.property_type)
  }
  if (filters?.min_price !== undefined) {
    searchParams.set('min_price', String(filters.min_price))
  }
  if (filters?.max_price !== undefined) {
    searchParams.set('max_price', String(filters.max_price))
  }
  if (filters?.min_bedrooms !== undefined) {
    searchParams.set('min_bedrooms', String(filters.min_bedrooms))
  }
  if (filters?.max_bedrooms !== undefined) {
    searchParams.set('max_bedrooms', String(filters.max_bedrooms))
  }
  if (filters?.location) {
    searchParams.set('location', filters.location)
  }
  if (filters?.agent_id) {
    searchParams.set('agent_id', filters.agent_id)
  }
  if (filters?.page !== undefined) {
    searchParams.set('page', String(filters.page))
  }
  if (filters?.limit !== undefined) {
    searchParams.set('limit', String(filters.limit))
  }
  if (filters?.sort) {
    searchParams.set('sort', filters.sort)
  }

  const url = `${DASHBOARD_API_URL}/api/public/properties?${searchParams}`

  // Disable caching when filters are applied to ensure fresh results
  const hasFilters = filters && Object.keys(filters).some(
    k => !['page', 'limit'].includes(k) && filters[k as keyof PropertyFilters] !== undefined
  )

  const response = await safeFetch(url, {
    cache: hasFilters ? 'no-store' : undefined,
    next: hasFilters ? { revalidate: 0 } : { revalidate: 300 },
  })

  if (!response) {
    console.warn('[getProperties] No response, returning empty')
    return emptyPaginatedResponse<Property>()
  }

  if (!response.ok) {
    console.error(`Failed to fetch properties: ${response.status}`)
    return emptyPaginatedResponse<Property>()
  }

  const data = await response.json()

  // Dashboard API returns paginated response with data and pagination
  if (data && data.data && data.pagination) {
    return {
      data: data.data,
      pagination: data.pagination,
    }
  }

  // Fallback for legacy flat array response
  const properties = Array.isArray(data) ? data : []
  return {
    data: properties,
    pagination: {
      page: filters?.page || 1,
      limit: filters?.limit || 50,
      total: properties.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  }
}

/**
 * Fetch a single property by slug
 * Returns full property detail including EPC, utilities, and agent info
 */
export async function getPropertyBySlug(slug: string): Promise<PropertyDetail | null> {
  const url = `${DASHBOARD_API_URL}/api/public/properties/${encodeURIComponent(slug)}`

  const response = await safeFetch(url, {
    next: { revalidate: 300 }, // 5-minute cache
  })

  if (!response || response.status === 404) {
    return null
  }

  if (!response.ok) {
    console.error(`Failed to fetch property: ${response.status}`)
    return null
  }

  return response.json()
}

/**
 * Fetch agents from dashboard API
 */
export async function getAgents(
  filters?: AgentFilters
): Promise<PaginatedResponse<Agent>> {
  const searchParams = new URLSearchParams()

  if (filters?.location) {
    searchParams.set('location', filters.location)
  }
  if (filters?.page !== undefined) {
    searchParams.set('page', String(filters.page))
  }
  if (filters?.limit !== undefined) {
    searchParams.set('limit', String(filters.limit))
  }

  const url = `${DASHBOARD_API_URL}/api/public/agents?${searchParams}`

  const response = await safeFetch(url, {
    next: { revalidate: 300 }, // 5-minute cache
  })

  if (!response) {
    return emptyPaginatedResponse<Agent>()
  }

  if (!response.ok) {
    console.error(`Failed to fetch agents: ${response.status}`)
    return emptyPaginatedResponse<Agent>()
  }

  return response.json()
}

/**
 * Fetch a single agent by ID
 */
export async function getAgentById(id: string): Promise<Agent | null> {
  const url = `${DASHBOARD_API_URL}/api/public/agents/${encodeURIComponent(id)}`

  const response = await safeFetch(url, {
    next: { revalidate: 300 }, // 5-minute cache
  })

  if (!response || response.status === 404) {
    return null
  }

  if (!response.ok) {
    console.error(`Failed to fetch agent: ${response.status}`)
    return null
  }

  return response.json()
}

/**
 * Fetch properties for a specific agent
 */
export async function getAgentProperties(
  agentId: string,
  filters?: Omit<PropertyFilters, 'agent_id'>
): Promise<PaginatedResponse<Property>> {
  return getProperties({ ...filters, agent_id: agentId })
}

/**
 * Fetch agent's other properties (excluding current property)
 * Used for "Agent's Other Properties" carousel
 */
export async function getAgentOtherProperties(
  agentId: string,
  excludePropertyId: string,
  limit: number = 6
): Promise<PropertyCard[]> {
  const url = `${DASHBOARD_API_URL}/api/public/agents/${encodeURIComponent(agentId)}/properties?exclude=${encodeURIComponent(excludePropertyId)}&limit=${limit}&status=available`

  const response = await safeFetch(url, {
    next: { revalidate: 300 }, // 5-minute cache
  })

  if (!response) {
    return []
  }

  if (!response.ok) {
    console.error(`Failed to fetch agent's other properties: ${response.status}`)
    return []
  }

  const data = await response.json()

  // Handle paginated response
  if (data && data.data) {
    return data.data
  }

  // Fallback for array response
  return Array.isArray(data) ? data : []
}

/**
 * Fetch featured properties for homepage
 */
export async function getFeaturedProperties(
  limit: number = 6
): Promise<Property[]> {
  const searchParams = new URLSearchParams()
  searchParams.set('status', 'available')
  searchParams.set('limit', String(limit))

  const url = `${DASHBOARD_API_URL}/api/public/properties?${searchParams}`

  const response = await safeFetch(url, {
    next: { revalidate: 300 },
  })

  if (!response) {
    return []
  }

  if (!response.ok) {
    console.error(`Failed to fetch featured properties: ${response.status}`)
    return []
  }

  const data = await response.json()
  // Dashboard API now returns paginated response
  if (data && data.data) {
    return data.data
  }
  // Fallback for legacy flat array response
  return Array.isArray(data) ? data : []
}
