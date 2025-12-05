/**
 * Apex27 Main API Client
 * Handles all communication with Apex27 Standard API
 * API Key: Uses X-Api-Key header (not Portal API's form-encoded approach)
 */

import type {
  Apex27Listing,
  Apex27Branch,
  Apex27User,
  Apex27Contact,
  Apex27ContactInput,
  Apex27Lead,
  Apex27LeadInput,
} from './types';

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

export interface Apex27Image {
  id: number;
  order: number;
  caption: string | null;
  url: string;
  type?: string; // 'photo', 'floorplan', 'epc'
}

/**
 * Fetch images for a listing from Apex27 API
 * @param listingId - The Apex27 listing ID
 * @returns Array of image objects with URLs
 */
export async function getListingImages(listingId: number | string): Promise<Apex27Image[]> {
  const url = `${APEX27_API_URL}/listings/${listingId}/images`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': getApiKey(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch images for listing ${listingId}: ${response.status}`);
      return [];
    }

    return (await response.json()) as Apex27Image[];
  } catch (error) {
    console.error(`Error fetching images for listing ${listingId}:`, error);
    return [];
  }
}

/**
 * Fetch floorplans for a listing from Apex27 API
 * @param listingId - The Apex27 listing ID
 * @returns Array of floorplan objects with URLs
 */
export async function getListingFloorplans(listingId: number | string): Promise<Apex27Image[]> {
  const url = `${APEX27_API_URL}/listings/${listingId}/floorplans`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': getApiKey(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Floorplans are optional, don't log error for 404
      if (response.status !== 404) {
        console.error(`Failed to fetch floorplans for listing ${listingId}: ${response.status}`);
      }
      return [];
    }

    return (await response.json()) as Apex27Image[];
  } catch (error) {
    console.error(`Error fetching floorplans for listing ${listingId}:`, error);
    return [];
  }
}

/**
 * Fetch EPC images for a listing from Apex27 API
 * @param listingId - The Apex27 listing ID
 * @returns Array of EPC image objects with URLs
 */
export async function getListingEpc(listingId: number | string): Promise<Apex27Image[]> {
  const url = `${APEX27_API_URL}/listings/${listingId}/epcs`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': getApiKey(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // EPC is optional, don't log error for 404
      if (response.status !== 404) {
        console.error(`Failed to fetch EPC for listing ${listingId}: ${response.status}`);
      }
      return [];
    }

    return (await response.json()) as Apex27Image[];
  } catch (error) {
    console.error(`Error fetching EPC for listing ${listingId}:`, error);
    return [];
  }
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

// ============================================================================
// CONTACT & LEAD MANAGEMENT (for viewing requests)
// ============================================================================

/**
 * Create or find a contact in Apex27
 * If a contact with the same email exists, returns the existing contact
 * @param data - Contact information
 * @returns Created or existing contact
 */
export async function createContact(data: Apex27ContactInput): Promise<Apex27Contact> {
  const url = `${APEX27_API_URL}/contacts`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Api-Key': getApiKey(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        source: data.source || 'Agent Microsite',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Apex27 contact creation failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return (await response.json()) as Apex27Contact;
  } catch (error) {
    console.error('Error creating contact in Apex27:', error);
    throw error;
  }
}

/**
 * Find a contact by email address
 * @param email - Email to search for
 * @returns Contact or null if not found
 */
export async function findContactByEmail(email: string): Promise<Apex27Contact | null> {
  const url = `${APEX27_API_URL}/contacts?email=${encodeURIComponent(email)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': getApiKey(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(
        `Apex27 contact search failed: ${response.status} ${response.statusText}`
      );
    }

    const contacts = (await response.json()) as Apex27Contact[];
    return contacts.length > 0 ? contacts[0] : null;
  } catch (error) {
    console.error('Error finding contact in Apex27:', error);
    throw error;
  }
}

/**
 * Create or find a contact - if email exists, returns existing, otherwise creates new
 * @param data - Contact information
 * @returns Contact (existing or newly created)
 */
export async function getOrCreateContact(data: Apex27ContactInput): Promise<Apex27Contact> {
  // First try to find existing contact
  const existing = await findContactByEmail(data.email);
  if (existing) {
    return existing;
  }

  // Create new contact
  return createContact(data);
}

/**
 * Create a lead in Apex27 (e.g., viewing request)
 * @param data - Lead information including branchId, contactId, listingId
 * @returns Created lead
 */
export async function createLead(data: Apex27LeadInput): Promise<Apex27Lead> {
  const url = `${APEX27_API_URL}/leads`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Api-Key': getApiKey(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branchId: data.branchId,
        contactId: data.contactId,
        listingId: data.listingId || null,
        source: data.source || 'Agent Microsite',
        status: data.status || 'new',
        howDidYouHear: data.howDidYouHear || 'Website',
        requestViewing: data.requestViewing,
        requestListingDetails: data.requestListingDetails || false,
        requestValuation: data.requestValuation || false,
        notes: data.notes || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Apex27 lead creation failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return (await response.json()) as Apex27Lead;
  } catch (error) {
    console.error('Error creating lead in Apex27:', error);
    throw error;
  }
}

/**
 * Create a viewing request lead in Apex27
 * Convenience function that handles contact creation and lead creation
 * @param params - Viewing request parameters
 * @returns Object containing created contact and lead
 */
export async function createViewingRequestLead(params: {
  branchId: number;
  listingId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
}): Promise<{ contact: Apex27Contact; lead: Apex27Lead }> {
  // Step 1: Get or create contact
  const contact = await getOrCreateContact({
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    phone: params.phone,
    source: 'Agent Microsite',
  });

  // Step 2: Create lead with viewing request flag
  const lead = await createLead({
    branchId: params.branchId,
    contactId: contact.id,
    listingId: params.listingId,
    source: 'Agent Microsite',
    status: 'new',
    howDidYouHear: 'Website',
    requestViewing: true,
    requestListingDetails: false,
    requestValuation: false,
    notes: params.notes,
  });

  return { contact, lead };
}
