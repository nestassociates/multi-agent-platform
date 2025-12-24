/**
 * Dashboard API Types
 * Types for data fetched from the dashboard public API
 */

// Property types from dashboard API
export interface Property {
  id: string
  apex27_id?: string
  title: string
  slug: string
  description?: string
  price: number
  transaction_type: 'sale' | 'rental'
  status: 'available' | 'under_offer' | 'sold' | 'let' | 'withdrawn'
  property_type: string
  bedrooms: number
  bathrooms: number
  receptions?: number
  size_sqft?: number
  tenure?: string
  address: PropertyAddress
  images: PropertyImage[]
  featured_image_url?: string | null
  features: string[]
  floorplan_url?: string
  epc_url?: string
  virtual_tour_url?: string
  agent_id: string
  agent?: Agent
  created_at: string
  updated_at: string
}

export interface PropertyAddress {
  line1: string
  line2?: string
  city?: string
  town?: string
  county?: string
  postcode: string
  latitude?: number
  longitude?: number
}

export interface PropertyImage {
  url: string
  thumbnail?: string | null // 320x240 thumbnail from Apex27
  alt?: string
  order: number
}

// EPC (Energy Performance Certificate) data
export interface EPCData {
  current_rating: string | null       // A-G rating
  potential_rating: string | null     // A-G rating
  current_efficiency: number | null   // 0-100
  potential_efficiency: number | null // 0-100
  current_environmental: number | null
  potential_environmental: number | null
}

// EPC Image from Apex27
export interface EPCImage {
  url: string
  caption?: string
}

// Utilities and services data
export interface UtilitiesData {
  electricity: string | null
  water: string | null
  sewerage: string | null
  heating: string | null
  broadband: string | null
  mobile_coverage: string | null
}

// Social media links for agents
export interface SocialMediaLinks {
  instagram: string | null
  facebook: string | null
  twitter: string | null
  linkedin: string | null
}

// Agent types from dashboard API
export interface Agent {
  id: string
  name: string
  email: string
  phone?: string
  mobile?: string
  bio?: string
  avatar_url?: string
  microsite_url?: string
  microsite_slug?: string
  subdomain?: string
  territories?: AgentTerritory[]
  apex27_branch_id?: number
  properties_count?: number
  social_media?: SocialMediaLinks | null
  google_place_id?: string | null
  created_at: string
  updated_at: string
}

export interface AgentTerritory {
  postcode: string
  name: string
}

// Extended property detail response (from /api/public/properties/[slug])
export interface PropertyDetail extends Omit<Property, 'agent'> {
  // Additional fields for detail page
  council_tax_band?: string | null
  parking?: string | null
  garden?: string | null
  accessibility?: string | null

  // Location with coordinates
  location?: {
    latitude: number | null
    longitude: number | null
  }

  // Extended data
  epc?: EPCData | null
  epc_images?: EPCImage[]
  utilities?: UtilitiesData | null

  // Full agent info for detail page
  agent: Agent

  // Direct URL reference
  property_url: string
}

// Property card for carousels and lists (lighter version)
export interface PropertyCard {
  id: string
  apex27_id: string
  title: string
  slug: string
  price: number
  transaction_type: 'sale' | 'rental'
  status: Property['status']
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

// API Response types
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface PropertyFilters {
  transaction_type?: 'sale' | 'rental'
  status?: Property['status'] | 'all'
  property_type?: string
  min_price?: number
  max_price?: number
  min_bedrooms?: number
  max_bedrooms?: number
  location?: string
  agent_id?: string
  page?: number
  limit?: number
  sort?: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc'
}

export interface AgentFilters {
  location?: string
  page?: number
  limit?: number
}
