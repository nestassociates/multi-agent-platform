export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export interface LocationSuggestion {
  type: 'postcode' | 'place'
  label: string
  value: string
  lat: number
  lng: number
}

/**
 * GET /api/public/locations/suggestions
 * Returns location suggestions for autocomplete
 *
 * Query params:
 * - q: Search query (min 2 characters)
 * - limit: Max results (default 10)
 *
 * Returns combined results:
 * - Postcodes from database (up to 5)
 * - Places from Mapbox Geocoding API (up to 5)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim() || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // Fetch postcodes and places in parallel
    const [postcodes, places] = await Promise.all([
      fetchPostcodeSuggestions(query, Math.ceil(limit / 2)),
      fetchPlaceSuggestions(query, Math.ceil(limit / 2)),
    ])

    // Combine results: postcodes first, then places
    const suggestions: LocationSuggestion[] = [...postcodes, ...places]

    // Add CORS headers for main-site access
    const response = NextResponse.json({ suggestions })
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

    return response
  } catch (error: any) {
    console.error('Location suggestions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestions', suggestions: [] },
      { status: 500 }
    )
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return response
}

/**
 * Fetch matching postcodes from database
 * Uses ILIKE for prefix matching (TA matches TA1, TA2, etc.)
 * Also matches against postcode names if available
 */
async function fetchPostcodeSuggestions(
  query: string,
  limit: number
): Promise<LocationSuggestion[]> {
  const supabase = createServiceRoleClient()
  const normalized = query.toUpperCase().replace(/\s+/g, '')

  // Query postcodes matching the search term
  // Uses the get_postcode_center RPC to get coordinates
  const { data: postcodes, error } = await supabase
    .from('postcodes')
    .select('code')
    .or(`code.ilike.${normalized}%,code.ilike.%${normalized}%`)
    .order('code')
    .limit(limit)

  if (error) {
    console.error('Postcode query error:', error)
    return []
  }

  if (!postcodes || postcodes.length === 0) {
    return []
  }

  // Get center coordinates for each postcode
  const suggestions: LocationSuggestion[] = []

  for (const pc of postcodes) {
    const { data: coords } = await supabase.rpc('get_postcode_center', {
      postcode_code: pc.code,
    })

    const coordData = Array.isArray(coords) ? coords[0] : coords

    if (coordData?.lat && coordData?.lng) {
      suggestions.push({
        type: 'postcode',
        label: pc.code,
        value: pc.code,
        lat: coordData.lat,
        lng: coordData.lng,
      })
    }
  }

  return suggestions
}

/**
 * Fetch place suggestions from Mapbox Geocoding API
 * Biased to UK, returns places and localities
 */
async function fetchPlaceSuggestions(
  query: string,
  limit: number
): Promise<LocationSuggestion[]> {
  const accessToken = process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  if (!accessToken) {
    console.error('MAPBOX_ACCESS_TOKEN not configured')
    return []
  }

  const encodedQuery = encodeURIComponent(query)

  // Mapbox Geocoding API v5
  // country=gb limits to UK
  // types=place,locality for towns, cities, neighborhoods
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?` +
    `access_token=${accessToken}&` +
    `country=gb&` +
    `types=place,locality&` +
    `limit=${limit}&` +
    `autocomplete=true`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      console.error('Mapbox API error:', response.statusText)
      return []
    }

    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      return []
    }

    return data.features.map((feature: any) => {
      const [lng, lat] = feature.center

      // Extract place name and context (e.g., "Taunton, Somerset, England")
      const placeName = feature.place_name

      // Use shorter text for value (just the main place name)
      const mainName = feature.text

      return {
        type: 'place' as const,
        label: placeName,
        value: mainName,
        lat,
        lng,
      }
    })
  } catch (error) {
    console.error('Mapbox fetch error:', error)
    return []
  }
}
