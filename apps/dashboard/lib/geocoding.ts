/**
 * Geocoding utilities for property search
 * Handles UK postcode district lookup and Mapbox geocoding
 */

import { createClient } from '@/lib/supabase/server'

export interface GeocodingResult {
  lat: number
  lng: number
  source: 'postcode' | 'mapbox'
  displayName?: string
}

/**
 * UK postcode district pattern
 * Matches: TA1, SW1A, M1, BS10, EC1A (NOT full postcodes like "TA1 1AA")
 * Format: 1-2 letters + 1-2 digits + optional letter
 */
const POSTCODE_DISTRICT_REGEX = /^[A-Z]{1,2}\d{1,2}[A-Z]?$/i

/**
 * Check if input matches UK postcode district format
 */
export function isPostcodeDistrictFormat(input: string): boolean {
  const normalized = input.trim().toUpperCase()
  return POSTCODE_DISTRICT_REGEX.test(normalized)
}

/**
 * Lookup postcode district in database and return center point
 * Uses EXACT match to prevent TA1 matching TA10
 */
export async function lookupPostcodeDistrict(
  code: string
): Promise<GeocodingResult | null> {
  const supabase = await createClient()
  const normalized = code.trim().toUpperCase()

  // Use RPC function to get coordinates from postcode center_point
  const { data, error } = await supabase.rpc('get_postcode_center', {
    postcode_code: normalized,
  })

  if (error) {
    console.error('Failed to lookup postcode:', error)
    return null
  }

  // RPC returns array of rows, get first one
  const coords = Array.isArray(data) ? data[0] : data

  if (!coords || coords.lat === null || coords.lng === null) {
    return null
  }

  return {
    lat: coords.lat,
    lng: coords.lng,
    source: 'postcode',
    displayName: normalized,
  }
}

/**
 * Geocode a location using Mapbox Geocoding API
 * Biased towards United Kingdom
 */
export async function geocodeWithMapbox(
  query: string
): Promise<GeocodingResult | null> {
  // Use either MAPBOX_ACCESS_TOKEN or NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  const accessToken = process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  if (!accessToken) {
    console.error('MAPBOX_ACCESS_TOKEN not configured')
    return null
  }

  const encodedQuery = encodeURIComponent(query.trim())

  // Mapbox Geocoding API v5
  // country=gb biases results to UK
  // types=place,locality,neighborhood,address for relevant results
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?` +
    `access_token=${accessToken}&` +
    `country=gb&` +
    `types=place,locality,neighborhood,postcode&` +
    `limit=1`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      console.error('Mapbox geocoding failed:', response.statusText)
      return null
    }

    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      return null
    }

    const feature = data.features[0]
    const [lng, lat] = feature.center

    return {
      lat,
      lng,
      source: 'mapbox',
      displayName: feature.place_name,
    }
  } catch (error) {
    console.error('Mapbox geocoding error:', error)
    return null
  }
}

/**
 * Main geocoding function
 * 1. If matches postcode pattern AND exists in database -> use postcode center
 * 2. Otherwise -> geocode via Mapbox
 */
export async function geocodeLocation(
  input: string
): Promise<GeocodingResult | null> {
  const trimmed = input.trim()

  if (!trimmed) {
    return null
  }

  // Check if it looks like a postcode district
  if (isPostcodeDistrictFormat(trimmed)) {
    // Try to lookup in postcodes table (exact match)
    const postcodeResult = await lookupPostcodeDistrict(trimmed)

    if (postcodeResult) {
      return postcodeResult
    }
    // If not found in postcodes table, fall through to Mapbox
    // (might be a valid format but not in our data)
  }

  // Geocode via Mapbox
  return geocodeWithMapbox(trimmed)
}

/**
 * Convert miles to meters
 * PostGIS uses meters for distance calculations
 */
export function milesToMeters(miles: number): number {
  return miles * 1609.344
}

/**
 * Convert meters to miles
 */
export function metersToMiles(meters: number): number {
  return meters / 1609.344
}
