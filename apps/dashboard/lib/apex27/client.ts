/**
 * Apex27 Main API Client
 * Handles all communication with Apex27 Standard API
 * API Key: Uses X-Api-Key header (not Portal API's form-encoded approach)
 */

import type { Apex27Listing, Apex27Branch, Apex27User } from './types';

const APEX27_API_URL = 'https://api.apex27.co.uk';

function getApiKey(): string {
  const apiKey = process.env.APEX27_API_KEY;
  if (!apiKey) {
    throw new Error('APEX27_API_KEY environment variable is required');
  }
  return apiKey;
}

export interface GetListingsOptions {
  page?: number;
  pageSize?: number;
  minDtsUpdated?: string; // ISO 8601 datetime string for incremental sync
}

export interface ListingsResponse {
  listings: Apex27Listing[];
  totalCount: number;
  pageCount: number;
}

/**
 * Fetch listings from Apex27 Main API
 * @param options - Pagination and filtering options
 * @returns Array of listings with metadata
 */
export async function getListings(
  options: GetListingsOptions = {}
): Promise<ListingsResponse> {
  const {
    page = 1,
    pageSize = 100, // Max 250, but 100 is reasonable
    minDtsUpdated,
  } = options;

  // Build query parameters
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (minDtsUpdated) {
    params.append('minDtsUpdated', minDtsUpdated);
  }

  const url = `${APEX27_API_URL}/listings?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': getApiKey(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Apex27 API error: ${response.status} ${response.statusText}`
      );
    }

    // Main API returns array directly, with X-Page-Count header
    const listings = (await response.json()) as Apex27Listing[];
    const pageCountHeader = response.headers.get('X-Page-Count');
    const pageCount = pageCountHeader ? parseInt(pageCountHeader, 10) : 1;

    return {
      listings,
      totalCount: listings.length, // We don't get total from API, estimate from pageCount
      pageCount,
    };
  } catch (error) {
    console.error('Error fetching listings from Apex27:', error);
    throw error;
  }
}

/**
 * Fetch a single listing by ID
 * @param id - Listing ID
 * @returns Single listing object
 */
export async function getListing(id: number): Promise<Apex27Listing | null> {
  const url = `${APEX27_API_URL}/listings/${id}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': getApiKey(),
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `Apex27 API error: ${response.status} ${response.statusText}`
      );
    }

    return (await response.json()) as Apex27Listing;
  } catch (error) {
    console.error(`Error fetching listing ${id} from Apex27:`, error);
    throw error;
  }
}

/**
 * Fetch ALL listings with pagination
 * Useful for full sync operations
 * @param minDtsUpdated - Optional filter for incremental sync
 * @returns All listings across all pages
 */
export async function getAllListings(
  minDtsUpdated?: string
): Promise<Apex27Listing[]> {
  const allListings: Apex27Listing[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const response = await getListings({ page, pageSize: 250, minDtsUpdated });
    allListings.push(...response.listings);
    pageCount = response.pageCount;
    page++;
  } while (page <= pageCount);

  return allListings;
}

/**
 * Register a webhook with Apex27
 * @param webhookUrl - The URL to POST webhook events to
 * @param events - Array of events to subscribe to
 * @returns Webhook registration response
 */
export async function registerWebhook(
  webhookUrl: string,
  events: string[] = ['listing.create', 'listing.update', 'listing.delete']
): Promise<any> {
  const url = `${APEX27_API_URL}/webhooks`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Api-Key': getApiKey(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        name: 'Nest Associates Property Sync',
        description: 'Real-time property synchronization for agent microsites',
        events,
        enabled: true,
        visible: true,
        manual: false,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to register webhook: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error registering webhook with Apex27:', error);
    throw error;
  }
}

/**
 * Get all registered webhooks
 * @returns Array of webhooks
 */
export async function getWebhooks(): Promise<any[]> {
  const url = `${APEX27_API_URL}/webhooks`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': getApiKey(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get webhooks: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting webhooks from Apex27:', error);
    throw error;
  }
}

/**
 * Fetch all users from Apex27
 * @returns Array of Apex27 users with names, emails, etc.
 */
export async function getUsers(): Promise<Apex27User[]> {
  const url = `${APEX27_API_URL}/users`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': getApiKey(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Apex27 API error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as Apex27User[];
  } catch (error) {
    console.error('Error fetching users from Apex27:', error);
    throw error;
  }
}

/**
 * Find user by email address
 * @param email - Email to search for
 * @returns Apex27User or null
 */
export async function getUserByEmail(email: string): Promise<Apex27User | null> {
  const users = await getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Fetch branch details from Apex27
 * Used to get agent contact info for draft agent setup
 * @param branchId - Branch ID from Apex27
 * @returns Branch details including email, phone, name
 */
export async function getBranchDetails(branchId: string): Promise<Apex27Branch | null> {
  // Fetch a property from this branch to get branch details
  const { listings } = await getListings({ page: 1, pageSize: 100 });

  const listing = listings.find(l => String(l.branch.id) === branchId);

  if (!listing) {
    console.log(`No properties found for branch ${branchId}`);
    return null;
  }

  return listing.branch;
}
