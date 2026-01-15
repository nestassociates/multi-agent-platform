/**
 * Server-side API utilities for fetching data from the dashboard
 */

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_API_URL || 'http://localhost:3000'

export interface Agent {
  id: string
  name: string
  first_name: string
  last_name: string
  territory: string | null
  avatar_url: string | null
  microsite_url: string
  subdomain: string
}

/**
 * Fetch all active agents from the dashboard API
 * Uses Next.js fetch caching with 5-minute revalidation
 */
export async function getAgents(): Promise<Agent[]> {
  try {
    const response = await fetch(`${DASHBOARD_URL}/api/public/agents`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      console.error('Failed to fetch agents:', response.status)
      return []
    }

    const json = await response.json()

    // Handle new response format { data: [...], search: {...} }
    if (json && json.data && Array.isArray(json.data)) {
      return json.data
    }

    // Fallback for legacy flat array response
    return Array.isArray(json) ? json : []
  } catch (error) {
    console.error('Error fetching agents:', error)
    return []
  }
}
