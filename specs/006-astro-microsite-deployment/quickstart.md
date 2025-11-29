# Quickstart Guide: Astro Agent Microsite Deployment System

**Feature**: 006-astro-microsite-deployment
**Date**: 2025-11-28

## Prerequisites

Before starting implementation, ensure:

- [ ] Supabase project is configured with existing tables
- [ ] `global_content` table exists with seed data
- [ ] `build_queue` table exists
- [ ] Vercel account with API access
- [ ] Resend account for email notifications

## Implementation Order

### Phase 1: Backend (No Figma Dependency) ✅ CAN START

1. **Public API Endpoints** - Priority: High
2. **Global Content Admin API** - Priority: High
3. **Global Content Admin UI** - Priority: Medium
4. **Data Generator Enhancements** - Priority: High

### Phase 2: Astro Templates (⏸️ BLOCKED ON FIGMA)

1. Astro page templates
2. Component styling
3. Client-side property fetching
4. Final integration

---

## Task Checklist

### 1. Public Properties Endpoint

**File**: `apps/dashboard/app/api/public/agents/[id]/properties/route.ts`

```typescript
// GET /api/public/agents/[id]/properties
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Implementation steps:
  // 1. Validate agent ID is UUID
  // 2. Check agent exists and is active
  // 3. Parse query params (marketing_type, cursor, limit)
  // 4. Query properties with filters
  // 5. Apply cursor pagination
  // 6. Return formatted response with Cache-Control
}
```

- [ ] Create route file
- [ ] Implement agent validation
- [ ] Implement property query with filters
- [ ] Implement cursor pagination
- [ ] Add caching headers
- [ ] Add rate limiting
- [ ] Write tests

### 2. Public Agent Info Endpoint

**File**: `apps/dashboard/app/api/public/agents/[id]/info/route.ts`

```typescript
// GET /api/public/agents/[id]/info
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Returns: id, name, avatarUrl, phone, subdomain
}
```

- [ ] Create route file
- [ ] Return public-safe agent info only
- [ ] Add caching headers
- [ ] Write tests

### 3. Contact Form Endpoint

**File**: `apps/dashboard/app/api/public/contact/route.ts`

```typescript
// POST /api/public/contact
export async function POST(request: NextRequest) {
  // Implementation steps:
  // 1. Validate origin (CORS)
  // 2. Parse and validate body with Zod
  // 3. Check honeypot field (bot detection)
  // 4. Check rate limits
  // 5. Validate agent exists
  // 6. Sanitize message content
  // 7. Insert into contact_form_submissions
  // 8. Send notification email via Resend
  // 9. Return success response
}
```

- [ ] Create route file
- [ ] Add Zod validation schema to `packages/validation`
- [ ] Implement CORS validation
- [ ] Implement honeypot detection
- [ ] Implement rate limiting
- [ ] Implement HTML sanitization
- [ ] Implement Resend email notification
- [ ] Write tests

### 4. Global Content Admin API

**Files**:
- `apps/dashboard/app/api/admin/global-content/route.ts`
- `apps/dashboard/app/api/admin/global-content/[type]/route.ts`
- `apps/dashboard/app/api/admin/global-content/[type]/publish/route.ts`

- [ ] Create list endpoint (GET)
- [ ] Create get single endpoint (GET /[type])
- [ ] Create update endpoint (PUT /[type])
- [ ] Create publish endpoint (POST /[type]/publish)
- [ ] Add admin authentication middleware
- [ ] Add Zod validation for each content type
- [ ] Implement queue-all-agents on publish
- [ ] Write tests

### 5. Global Content Admin UI

**Files**:
- `apps/dashboard/app/(admin)/global-content/page.tsx`
- `apps/dashboard/app/(admin)/global-content/[type]/page.tsx`
- `apps/dashboard/components/admin/global-content-list.tsx`
- `apps/dashboard/components/admin/global-content-editor.tsx`

- [ ] Create list page with content types
- [ ] Create editor page for each type
- [ ] Use TipTap for legal page HTML editing
- [ ] Use JSON editor for header/footer structure
- [ ] Add preview functionality
- [ ] Add publish confirmation dialog
- [ ] Show rebuild status after publish
- [ ] Write E2E tests

### 6. Data Generator Enhancements

**File**: `packages/build-system/src/data-generator.ts`

```typescript
// Add section visibility
function determineSectionVisibility(
  profile: Profile,
  blogPosts: ContentSubmission[],
  areaGuides: ContentSubmission[],
  fees: AgentFee | null
): SectionVisibility {
  return {
    blog: blogPosts.length > 0,
    areaGuides: areaGuides.length > 0,
    reviews: !!profile.google_place_id,
    fees: !!fees?.content,
    properties: true,
  };
}

// Add navigation generation
function generateNavigation(sections: SectionVisibility): NavItem[] {
  // Conditional nav items based on sections
}
```

- [ ] Add `SectionVisibility` interface to types
- [ ] Add `NavItem` interface to types
- [ ] Implement `determineSectionVisibility()`
- [ ] Implement `generateNavigation()`
- [ ] Remove properties from build-time data (move to runtime)
- [ ] Update `AgentSiteData` interface
- [ ] Write unit tests

### 7. Build Queue Enhancement

**File**: `packages/build-system/src/queue.ts`

```typescript
// Add function to queue all agents
export async function queueGlobalContentRebuild(
  supabase: SupabaseClient,
  contentType: string
): Promise<{ queued: number }> {
  // Get all active agents
  // Insert build requests with emergency priority
}
```

- [ ] Add `queueGlobalContentRebuild()` function
- [ ] Use emergency priority (1) for global content
- [ ] Return count of queued builds
- [ ] Write unit tests

---

## Validation Schemas to Create

### Contact Form Schema

**File**: `packages/validation/src/contact.ts`

```typescript
import { z } from 'zod';

export const contactFormSchema = z.object({
  agentId: z.string().uuid(),
  propertyId: z.string().uuid().optional(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  message: z.string().min(10).max(2000),
  honeypot: z.string().max(0).optional(),
});
```

### Global Content Schemas

**File**: `packages/validation/src/global-content.ts`

```typescript
export const headerContentSchema = z.object({...});
export const footerContentSchema = z.object({...});
export const legalContentSchema = z.object({...});
```

---

## Testing Scenarios

### Public Properties API

| Test | Expected Result |
|------|-----------------|
| Valid agent with properties | Returns property list |
| Valid agent with no properties | Returns empty array |
| Marketing type filter | Returns only matching type |
| Cursor pagination | Returns next page correctly |
| Inactive agent | Returns 404 |
| Invalid UUID | Returns 400 |
| Rate limited | Returns 429 |

### Contact Form API

| Test | Expected Result |
|------|-----------------|
| Valid submission | Stores and sends email |
| Missing required fields | Returns 400 |
| Invalid email | Returns 400 |
| Honeypot filled | Returns 400 |
| Rate limited | Returns 429 |
| Invalid origin | Returns 403 |

### Global Content Admin

| Test | Expected Result |
|------|-----------------|
| List all content | Returns all types with status |
| Get header | Returns header structure |
| Update header | Saves draft without publishing |
| Publish header | Queues all agent rebuilds |
| Non-admin access | Returns 403 |

---

## Environment Variables

Ensure these are configured:

```env
# Existing
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Required for this feature
RESEND_API_KEY=           # For contact form notifications
VERCEL_API_TOKEN=         # For deployment triggers (future)

# Rate limiting
RATE_LIMIT_CONTACT=5      # Per hour per IP
RATE_LIMIT_PROPERTIES=100 # Per minute per IP
```

---

## Next Steps After Backend

Once Figma designs arrive:

1. Review design tokens (colors, typography, spacing)
2. Create Astro component library
3. Implement page layouts
4. Wire up data from `site-data.json`
5. Implement client-side property fetching
6. Test build and deploy pipeline
7. Configure Vercel projects for agent sites

---

## Commands

```bash
# Run development
pnpm --filter @nest/dashboard dev

# Run tests
pnpm --filter @nest/dashboard test

# Type check
pnpm --filter @nest/dashboard typecheck

# Build
pnpm --filter @nest/dashboard build
```
