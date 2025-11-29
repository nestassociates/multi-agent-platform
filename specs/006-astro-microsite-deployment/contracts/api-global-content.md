# API Contract: Global Content Admin Endpoints

**Feature**: 006-astro-microsite-deployment
**Base Path**: `/api/admin/global-content`
**Authentication**: Required (Admin role)

## Overview

CRUD operations for global content (header, footer, legal pages) that appears on all agent microsites. Publishing global content triggers rebuilds for all active agents.

---

## Endpoints

### 1. List All Global Content

**Endpoint**: `GET /api/admin/global-content`

Returns all global content types with their publish status.

#### Response (200 OK)

```json
{
  "data": [
    {
      "id": "uuid-1",
      "contentType": "header",
      "isPublished": true,
      "publishedAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-16T14:20:00Z"
    },
    {
      "id": "uuid-2",
      "contentType": "footer",
      "isPublished": true,
      "publishedAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "uuid-3",
      "contentType": "privacy_policy",
      "isPublished": false,
      "publishedAt": null,
      "updatedAt": "2024-01-17T09:00:00Z"
    }
  ]
}
```

---

### 2. Get Specific Content Type

**Endpoint**: `GET /api/admin/global-content/[type]`

Returns full content for a specific type.

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Content type (see valid types below) |

#### Valid Content Types

- `header` - Site header configuration
- `footer` - Site footer configuration
- `privacy_policy` - Privacy policy HTML
- `terms_of_service` - Terms of service HTML
- `cookie_policy` - Cookie policy HTML

#### Response (200 OK) - Header Example

```json
{
  "id": "uuid-1",
  "contentType": "header",
  "content": {
    "logo": {
      "url": "https://storage.supabase.co/.../logo.svg",
      "alt": "Nest Associates"
    },
    "navigation": [
      { "label": "Home", "href": "/" },
      { "label": "About", "href": "/about" }
    ],
    "cta": {
      "label": "Get Valuation",
      "href": "/contact"
    }
  },
  "isPublished": true,
  "publishedAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-16T14:20:00Z"
}
```

#### Response (200 OK) - Legal Page Example

```json
{
  "id": "uuid-3",
  "contentType": "privacy_policy",
  "content": {
    "html": "<h1>Privacy Policy</h1><p>Last updated: January 2024</p>..."
  },
  "isPublished": false,
  "publishedAt": null,
  "updatedAt": "2024-01-17T09:00:00Z"
}
```

#### Error (404)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Content type 'invalid_type' not found"
  }
}
```

---

### 3. Update Content Type

**Endpoint**: `PUT /api/admin/global-content/[type]`

Updates content (saves as draft, does not publish).

#### Request Body - Header

```json
{
  "content": {
    "logo": {
      "url": "https://storage.supabase.co/.../logo.svg",
      "alt": "Nest Associates"
    },
    "navigation": [
      { "label": "Home", "href": "/" },
      { "label": "About", "href": "/about" },
      { "label": "Services", "href": "/services" }
    ],
    "cta": {
      "label": "Book Valuation",
      "href": "/contact?source=header-cta"
    }
  }
}
```

#### Request Body - Footer

```json
{
  "content": {
    "columns": [
      {
        "title": "Quick Links",
        "links": [
          { "label": "Home", "href": "/" },
          { "label": "Properties", "href": "/properties" }
        ]
      },
      {
        "title": "Legal",
        "links": [
          { "label": "Privacy Policy", "href": "/privacy" },
          { "label": "Terms of Service", "href": "/terms" }
        ]
      }
    ],
    "contact": {
      "email": "info@nestassociates.co.uk",
      "phone": "+44 20 1234 5678",
      "address": "123 High Street, London SW1A 1AA"
    },
    "social": [
      { "platform": "facebook", "url": "https://facebook.com/nestassociates" },
      { "platform": "instagram", "url": "https://instagram.com/nestassociates" }
    ],
    "copyright": "© 2024 Nest Associates. All rights reserved."
  }
}
```

#### Request Body - Legal Page

```json
{
  "content": {
    "html": "<h1>Privacy Policy</h1><p>Last updated: January 2024</p><h2>Data Collection</h2>..."
  }
}
```

#### Response (200 OK)

```json
{
  "id": "uuid-1",
  "contentType": "header",
  "content": { ... },
  "isPublished": false,
  "publishedAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-17T11:00:00Z",
  "hasUnpublishedChanges": true
}
```

#### Error (400 - Validation)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid content structure",
    "details": {
      "path": "content.logo.url",
      "reason": "Must be a valid URL"
    }
  }
}
```

---

### 4. Publish Content Type

**Endpoint**: `POST /api/admin/global-content/[type]/publish`

Publishes content and triggers rebuilds for ALL active agents.

#### Request Body

```json
{}
```

No body required - publishes current draft content.

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Content published successfully",
  "rebuildsQueued": 47,
  "content": {
    "id": "uuid-1",
    "contentType": "header",
    "isPublished": true,
    "publishedAt": "2024-01-17T11:05:00Z"
  }
}
```

#### Error (409 - No Changes)

```json
{
  "error": {
    "code": "NO_CHANGES",
    "message": "No unpublished changes to publish"
  }
}
```

---

## Content Schemas

### Header Content Schema

```typescript
interface HeaderContent {
  logo: {
    url: string;  // URL to logo image
    alt: string;  // Alt text
  };
  navigation: {
    label: string;
    href: string;
  }[];
  cta: {
    label: string;
    href: string;
  } | null;
}
```

### Footer Content Schema

```typescript
interface FooterContent {
  columns: {
    title: string;
    links: {
      label: string;
      href: string;
    }[];
  }[];
  contact: {
    email?: string;
    phone?: string;
    address?: string;
  };
  social: {
    platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube';
    url: string;
  }[];
  copyright: string;
}
```

### Legal Content Schema

```typescript
interface LegalContent {
  html: string;  // Sanitized HTML content
}
```

---

## Implementation Notes

### Authentication

All endpoints require admin authentication:

```typescript
const { user, role } = await getAuthenticatedUser(request);
if (role !== 'admin') {
  return Response.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
}
```

### Publish Flow

```typescript
async function publishGlobalContent(type: string) {
  // 1. Update publish status
  await supabase
    .from('global_content')
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .eq('content_type', type);

  // 2. Get all active agents
  const { data: agents } = await supabase
    .from('agents')
    .select('id')
    .eq('status', 'active');

  // 3. Queue rebuilds for all agents
  const builds = agents.map(agent => ({
    agent_id: agent.id,
    priority: 1,  // Emergency priority
    trigger_reason: `global_content:${type}`,
    status: 'pending',
  }));

  await supabase.from('build_queue').insert(builds);

  return { rebuildsQueued: builds.length };
}
```

### Content Validation

```typescript
// Zod schemas for each content type
const contentSchemas: Record<string, z.ZodSchema> = {
  header: headerContentSchema,
  footer: footerContentSchema,
  privacy_policy: legalContentSchema,
  terms_of_service: legalContentSchema,
  cookie_policy: legalContentSchema,
};

// Validate before saving
const schema = contentSchemas[type];
const result = schema.safeParse(body.content);
if (!result.success) {
  return Response.json({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid content structure',
      details: result.error.issues[0],
    },
  }, { status: 400 });
}
```

### HTML Sanitization (Legal Pages)

```typescript
import DOMPurify from 'isomorphic-dompurify';

function sanitizeLegalHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}
```

---

## TypeScript Types

```typescript
// List response
interface GlobalContentListResponse {
  data: {
    id: string;
    contentType: string;
    isPublished: boolean;
    publishedAt: string | null;
    updatedAt: string;
  }[];
}

// Single content response
interface GlobalContentResponse {
  id: string;
  contentType: string;
  content: HeaderContent | FooterContent | LegalContent;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string;
  hasUnpublishedChanges?: boolean;
}

// Publish response
interface PublishResponse {
  success: true;
  message: string;
  rebuildsQueued: number;
  content: {
    id: string;
    contentType: string;
    isPublished: true;
    publishedAt: string;
  };
}
```

---

## Testing Scenarios

1. **List all content**: Returns all content types with status
2. **Get header content**: Returns full header structure
3. **Get legal page**: Returns HTML content
4. **Update header**: Saves changes without publishing
5. **Update footer**: Validates schema before saving
6. **Update legal page**: Sanitizes HTML content
7. **Publish header**: Sets published, queues all agent rebuilds
8. **Publish with no changes**: Returns 409 error
9. **Invalid content type**: Returns 404
10. **Non-admin user**: Returns 403 forbidden
11. **Invalid schema**: Returns 400 with validation details
