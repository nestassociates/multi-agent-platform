/**
 * Apex27 CRM Types
 * Types for Apex27 API integration
 */

// Contact input for creating/updating contacts
export interface Apex27ContactInput {
  firstName: string
  lastName: string
  email: string
  phone?: string
  source?: string
}

// Contact response from API
export interface Apex27Contact {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  source?: string
  dtsCreated: string
  dtsUpdated: string
}

// Lead input for creating leads
export interface Apex27LeadInput {
  branchId: number
  contactId: number
  listingId?: number
  source: string
  howDidYouHear?: string
  requestViewing?: boolean
  requestListingDetails?: boolean
  requestValuation?: boolean
  notes?: string
}

// Lead response from API
export interface Apex27Lead {
  id: number
  branchId: number
  contactId: number
  listingId?: number
  source: string
  howDidYouHear?: string
  requestViewing: boolean
  requestListingDetails: boolean
  requestValuation: boolean
  notes?: string
  dtsCreated: string
  dtsUpdated: string
}

// Form submission result
export interface FormSubmissionResult {
  success: boolean
  message: string
  referenceId?: string
  error?: {
    code: string
    message: string
    fields?: Record<string, string[]>
  }
}

// Form-specific input types
export interface ContactFormInput {
  firstName: string
  lastName: string
  email: string
  phone?: string
  subject?: string
  message: string
}

export interface ValuationFormInput {
  firstName: string
  lastName: string
  email: string
  phone?: string
  propertyType: 'sale' | 'rental'
  propertyAddress: {
    line1: string
    line2?: string
    city: string
    postcode: string
  }
  bedrooms?: number
  propertyTypeName?: string
  message?: string
}

export interface RegistrationFormInput {
  firstName: string
  lastName: string
  email: string
  phone?: string
  transactionType: 'buy' | 'rent'
  locations?: string[]
  minBudget?: number
  maxBudget?: number
  minBedrooms?: number
  maxBedrooms?: number
  propertyTypes?: string[]
  additionalRequirements?: string
}

export interface AgentContactFormInput {
  firstName: string
  lastName: string
  email: string
  phone?: string
  agentId: string
  propertyId?: string
  message: string
}

export interface JoinFormInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  currentRole: string
  yearsExperience?: number
  preferredLocation?: string
  linkedIn?: string
  message?: string
}
