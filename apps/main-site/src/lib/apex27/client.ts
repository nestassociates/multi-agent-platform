/* eslint-disable no-console */
/**
 * Apex27 CRM Client
 * Handles all form submissions to Apex27 CRM
 * Console logging is intentional for debugging mock mode
 */

import type {
  Apex27ContactInput,
  Apex27Contact,
  Apex27LeadInput,
  Apex27Lead,
} from './types'

const APEX27_API_URL = 'https://api.apex27.co.uk'

/**
 * Get API key from environment
 */
function getApiKey(): string {
  const key = process.env.APEX27_API_KEY
  if (!key) {
    throw new Error('APEX27_API_KEY not configured')
  }
  return key
}

/**
 * Get default branch ID from environment
 */
export function getDefaultBranchId(): number {
  const branchId = process.env.APEX27_DEFAULT_BRANCH_ID
  if (!branchId) {
    throw new Error('APEX27_DEFAULT_BRANCH_ID not configured')
  }
  return parseInt(branchId, 10)
}

/**
 * Check if mock mode is enabled
 */
function isMockMode(): boolean {
  return process.env.APEX27_MOCK === 'true'
}

/**
 * Find a contact by email address
 */
export async function findContactByEmail(
  email: string
): Promise<Apex27Contact | null> {
  if (isMockMode()) {
    console.log('[Apex27 Mock] Finding contact by email:', email)
    return null
  }

  const response = await fetch(
    `${APEX27_API_URL}/contacts?email=${encodeURIComponent(email)}`,
    {
      headers: {
        'X-Api-Key': getApiKey(),
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error(`Apex27 error: ${response.status}`)
  }

  const contacts = await response.json()
  return contacts[0] || null
}

/**
 * Create a new contact in Apex27
 */
export async function createContact(
  data: Apex27ContactInput
): Promise<Apex27Contact> {
  if (isMockMode()) {
    console.log('[Apex27 Mock] Creating contact:', data)
    return {
      id: Math.floor(Math.random() * 10000),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      source: data.source,
      dtsCreated: new Date().toISOString(),
      dtsUpdated: new Date().toISOString(),
    }
  }

  const response = await fetch(`${APEX27_API_URL}/contacts`, {
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
      source: data.source || 'Main Website',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Apex27 contact creation failed: ${error}`)
  }

  return response.json()
}

/**
 * Get an existing contact or create a new one
 */
export async function getOrCreateContact(
  data: Apex27ContactInput
): Promise<Apex27Contact> {
  const existing = await findContactByEmail(data.email)
  if (existing) return existing
  return createContact(data)
}

/**
 * Create a lead in Apex27
 */
export async function createLead(data: Apex27LeadInput): Promise<Apex27Lead> {
  if (isMockMode()) {
    console.log('[Apex27 Mock] Creating lead:', data)
    return {
      id: Math.floor(Math.random() * 10000),
      branchId: data.branchId,
      contactId: data.contactId,
      listingId: data.listingId,
      source: data.source,
      howDidYouHear: data.howDidYouHear,
      requestViewing: data.requestViewing || false,
      requestListingDetails: data.requestListingDetails || false,
      requestValuation: data.requestValuation || false,
      notes: data.notes,
      dtsCreated: new Date().toISOString(),
      dtsUpdated: new Date().toISOString(),
    }
  }

  const response = await fetch(`${APEX27_API_URL}/leads`, {
    method: 'POST',
    headers: {
      'X-Api-Key': getApiKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Apex27 lead creation failed: ${error}`)
  }

  return response.json()
}

/**
 * Submit a form to Apex27 with retry logic
 */
export async function submitWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      console.error(`Apex27 submission attempt ${attempt} failed:`, error)
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      }
    }
  }

  throw lastError
}
