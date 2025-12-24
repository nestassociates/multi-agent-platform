# Apex27 CRM Integration Specification

**Feature Branch**: `009-main-website`
**Created**: 2025-12-18
**Status**: Draft

## Overview

All forms on the main website submit data to Apex27 CRM. This document specifies the integration patterns for each form type.

## API Reference

### Base Configuration

```typescript
const APEX27_API_URL = 'https://api.apex27.co.uk';

const headers = {
  'X-Api-Key': process.env.APEX27_API_KEY,
  'Content-Type': 'application/json',
};
```

### Environment Variables

```bash
APEX27_API_KEY=your-api-key
APEX27_DEFAULT_BRANCH_ID=123  # Main office branch
```

---

## Integration Patterns

### Contact + Lead Pattern

All forms follow this two-step pattern:

1. **Get or Create Contact**
2. **Create Lead** with appropriate flags

```typescript
async function submitForm(formData: FormInput): Promise<FormResult> {
  // Step 1: Get or create contact
  const contact = await getOrCreateContact({
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    source: 'Main Website',
  });

  // Step 2: Create lead
  const lead = await createLead({
    branchId: APEX27_DEFAULT_BRANCH_ID,
    contactId: contact.id,
    source: 'Main Website',
    howDidYouHear: 'Website',
    // ... form-specific flags
  });

  return { success: true, referenceId: String(lead.id) };
}
```

---

## Form Integrations

### 1. General Contact Form

**Source Page**: `/contact`

**Apex27 Configuration**:
```typescript
const contactLead: Apex27LeadInput = {
  branchId: APEX27_DEFAULT_BRANCH_ID,
  contactId: contact.id,
  source: 'Main Website - Contact Form',
  howDidYouHear: 'Website',
  requestViewing: false,
  requestListingDetails: false,
  requestValuation: false,
  notes: `Subject: ${formData.subject}\n\nMessage:\n${formData.message}`,
};
```

### 2. Valuation Request (Sell/Landlords)

**Source Pages**: `/sell`, `/landlords`

**Apex27 Configuration**:
```typescript
const valuationLead: Apex27LeadInput = {
  branchId: APEX27_DEFAULT_BRANCH_ID,
  contactId: contact.id,
  source: formData.propertyType === 'sale'
    ? 'Main Website - Sell Page'
    : 'Main Website - Landlords Page',
  howDidYouHear: 'Website',
  requestViewing: false,
  requestListingDetails: false,
  requestValuation: true,  // Key flag
  notes: buildValuationNotes(formData),
};

function buildValuationNotes(formData: ValuationFormInput): string {
  return `
VALUATION REQUEST

Property Type: ${formData.propertyType === 'sale' ? 'Sale' : 'Rental'}
Property Address:
${formData.propertyAddress.line1}
${formData.propertyAddress.line2 || ''}
${formData.propertyAddress.city}
${formData.propertyAddress.postcode}

Bedrooms: ${formData.bedrooms || 'Not specified'}
Property Type: ${formData.propertyTypeName || 'Not specified'}

Additional Notes:
${formData.message || 'None'}
  `.trim();
}
```

### 3. Buyer Registration

**Source Page**: `/register`

**Apex27 Configuration**:
```typescript
const registrationLead: Apex27LeadInput = {
  branchId: APEX27_DEFAULT_BRANCH_ID,
  contactId: contact.id,
  source: 'Main Website - Buyer Registration',
  howDidYouHear: 'Website',
  requestViewing: false,
  requestListingDetails: true,  // Key flag - wants property info
  requestValuation: false,
  notes: buildRegistrationNotes(formData),
};

function buildRegistrationNotes(formData: RegistrationFormInput): string {
  return `
BUYER REGISTRATION

Looking to: ${formData.transactionType === 'buy' ? 'Buy' : 'Rent'}

Preferences:
- Locations: ${formData.locations?.join(', ') || 'Any'}
- Budget: ${formatBudget(formData.minBudget, formData.maxBudget)}
- Bedrooms: ${formatBedrooms(formData.minBedrooms, formData.maxBedrooms)}
- Property Types: ${formData.propertyTypes?.join(', ') || 'Any'}

Additional Requirements:
${formData.additionalRequirements || 'None'}
  `.trim();
}
```

### 4. Agent-Specific Contact

**Source Page**: `/agent/[id]` (contact form)

**Apex27 Configuration**:
```typescript
// Note: branchId comes from agent's branch, not default
const agentContactLead: Apex27LeadInput = {
  branchId: agent.apex27BranchId,  // Agent's specific branch
  contactId: contact.id,
  listingId: formData.propertyId
    ? await getApex27ListingId(formData.propertyId)
    : undefined,  // Link to property if provided
  source: 'Main Website - Agent Contact',
  howDidYouHear: 'Website',
  requestViewing: !!formData.propertyId,  // If property-specific, assume viewing request
  requestListingDetails: !!formData.propertyId,
  requestValuation: false,
  notes: `Agent: ${agent.name}\n\nMessage:\n${formData.message}`,
};
```

**Agent Branch ID Resolution**:
```typescript
async function getAgentBranchId(agentId: string): Promise<number> {
  // Fetch agent from dashboard API
  const response = await fetch(
    `${DASHBOARD_API}/api/public/agents/${agentId}`
  );
  const agent = await response.json();

  // Agent profile should include apex27_branch_id
  return agent.apex27BranchId;
}
```

### 5. Agent Recruitment (Join)

**Source Page**: `/join`

**Apex27 Configuration**:
```typescript
const joinLead: Apex27LeadInput = {
  branchId: APEX27_DEFAULT_BRANCH_ID,
  contactId: contact.id,
  source: 'Main Website - Agent Recruitment',
  howDidYouHear: 'Website',
  requestViewing: false,
  requestListingDetails: false,
  requestValuation: false,
  notes: buildRecruitmentNotes(formData),
};

function buildRecruitmentNotes(formData: JoinFormInput): string {
  return `
AGENT RECRUITMENT APPLICATION

Current Role: ${formData.currentRole}
Years Experience: ${formData.yearsExperience || 'Not specified'}
Preferred Location: ${formData.preferredLocation || 'Any'}
LinkedIn: ${formData.linkedIn || 'Not provided'}

Cover Letter:
${formData.message || 'None provided'}
  `.trim();
}
```

---

## Implementation

### Shared Apex27 Client

Create `apps/main-site/src/lib/apex27/client.ts`:

```typescript
import type {
  Apex27ContactInput,
  Apex27Contact,
  Apex27LeadInput,
  Apex27Lead,
} from './types';

const APEX27_API_URL = 'https://api.apex27.co.uk';

function getApiKey(): string {
  const key = process.env.APEX27_API_KEY;
  if (!key) throw new Error('APEX27_API_KEY not configured');
  return key;
}

export async function findContactByEmail(email: string): Promise<Apex27Contact | null> {
  const response = await fetch(
    `${APEX27_API_URL}/contacts?email=${encodeURIComponent(email)}`,
    {
      headers: {
        'X-Api-Key': getApiKey(),
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Apex27 error: ${response.status}`);
  }

  const contacts = await response.json();
  return contacts[0] || null;
}

export async function createContact(data: Apex27ContactInput): Promise<Apex27Contact> {
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
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Apex27 contact creation failed: ${error}`);
  }

  return response.json();
}

export async function getOrCreateContact(data: Apex27ContactInput): Promise<Apex27Contact> {
  const existing = await findContactByEmail(data.email);
  if (existing) return existing;
  return createContact(data);
}

export async function createLead(data: Apex27LeadInput): Promise<Apex27Lead> {
  const response = await fetch(`${APEX27_API_URL}/leads`, {
    method: 'POST',
    headers: {
      'X-Api-Key': getApiKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Apex27 lead creation failed: ${error}`);
  }

  return response.json();
}
```

### Form Handler Example

```typescript
// app/api/forms/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrCreateContact, createLead } from '@/lib/apex27/client';

const schema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(10).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    const contact = await getOrCreateContact({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      source: 'Main Website',
    });

    const lead = await createLead({
      branchId: parseInt(process.env.APEX27_DEFAULT_BRANCH_ID!),
      contactId: contact.id,
      source: 'Main Website - Contact Form',
      howDidYouHear: 'Website',
      requestViewing: false,
      requestListingDetails: false,
      requestValuation: false,
      notes: `Subject: ${data.subject || 'General Enquiry'}\n\n${data.message}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your enquiry. We will be in touch shortly.',
      referenceId: String(lead.id),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid form data',
            fields: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Contact form error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred. Please try again.',
        },
      },
      { status: 500 }
    );
  }
}
```

---

## Error Handling

### Retry Strategy

```typescript
async function submitWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }

  throw lastError;
}
```

### Fallback Behavior

If Apex27 is unavailable:
1. Log the form data securely for manual entry
2. Send email notification to admin
3. Show user success message (don't expose CRM failure)

```typescript
async function handleFormSubmission(data: FormData): Promise<FormResult> {
  try {
    return await submitToApex27(data);
  } catch (error) {
    // Log for manual processing
    await logFailedSubmission(data, error);

    // Notify admin
    await sendAdminNotification({
      subject: 'Form submission failed - manual action required',
      formType: data.formType,
      contactEmail: data.email,
    });

    // Return success to user (we'll handle manually)
    return {
      success: true,
      message: 'Thank you for your enquiry. We will be in touch shortly.',
    };
  }
}
```

---

## Testing

### Test API Key

Contact Apex27 for a sandbox/test API key for development.

### Mock Implementation

For local development without API access:

```typescript
// lib/apex27/client.mock.ts
export async function getOrCreateContact(data: Apex27ContactInput): Promise<Apex27Contact> {
  console.log('Mock: Creating contact', data);
  return {
    id: Math.floor(Math.random() * 10000),
    ...data,
    dtsCreated: new Date().toISOString(),
    dtsUpdated: new Date().toISOString(),
  };
}

export async function createLead(data: Apex27LeadInput): Promise<Apex27Lead> {
  console.log('Mock: Creating lead', data);
  return {
    id: Math.floor(Math.random() * 10000),
    ...data,
    dtsCreated: new Date().toISOString(),
    dtsUpdated: new Date().toISOString(),
  };
}
```

Use environment variable to switch:

```typescript
const client = process.env.APEX27_MOCK === 'true'
  ? await import('./client.mock')
  : await import('./client');
```
