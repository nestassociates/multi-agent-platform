/**
 * Server-side API utilities for fetching data from the dashboard
 */

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3000'

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

    return response.json()
  } catch (error) {
    console.error('Error fetching agents:', error)
    return []
  }
}
