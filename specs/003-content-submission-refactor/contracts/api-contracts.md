# API Contracts: Content Submission System Refactor

**Date**: 2025-11-24
**Phase**: 1 - Design & Contracts
**Format**: REST API (Next.js API Routes)

---

## Overview

This document specifies all API endpoints for the content submission system refactor. Endpoints follow RESTful patterns and are organized by actor (Agent, Admin).

**Base URL**: `https://dashboard.nestagents.co.uk/api`

**Authentication**: All endpoints require authentication via Supabase session cookie (handled by Next.js middleware)

**Response Format**: JSON
**Request Format**: JSON or multipart/form-data (for image uploads)

---

## Agent Endpoints

### 1. Create Content

**Endpoint**: `POST /api/agent/content`
**Purpose**: Create new content submission (draft or pending review)
**Auth**: Authenticated agent

**Request Body**:
```typescript
{
  content_type: 'blog_post' | 'area_guide' | 'review' | 'fee_structure';
  title: string; // 1-100 chars
  slug?: string; // Auto-generated if not provided
  content_body: string; // HTML from Tiptap
  excerpt?: string; // Max 250 chars
  featured_image_url?: string; // Must be Supabase Storage URL
  seo_meta_title?: string; // Max 60 chars
  seo_meta_description?: string; // Max 160 chars
  status: 'draft' | 'pending_review'; // Cannot create as approved/rejected/published
}
```

**Response** (201 Created):
```typescript
{
  data: ContentSubmission; // Full content object
  message: string; // "Content created successfully"
}
```

**Errors**:
- `400 Bad Request`: Validation error (invalid fields, slug already exists)
- `401 Unauthorized`: Not authenticated or not an agent
- `500 Internal Server Error`: Database error

**Validation**:
- `content_body` is sanitized server-side before storage
- `slug` is auto-generated from `title` if not provided
- `slug` uniqueness is enforced per agent

---

### 2. Update Content

**Endpoint**: `PUT /api/agent/content/[id]`
**Purpose**: Update existing content (draft or rejected only)
**Auth**: Authenticated agent (must own the content)

**Request Body**:
```typescript
{
  // All fields optional - only provide fields to update
  title?: string;
  slug?: string;
  content_body?: string;
  excerpt?: string;
  featured_image_url?: string;
  seo_meta_title?: string;
  seo_meta_description?: string;
  status?: 'draft' | 'pending_review'; // Can change draft→pending or rejected→draft/pending
}
```

**Response** (200 OK):
```typescript
{
  data: ContentSubmission; // Updated content object
  message: string; // "Content updated successfully"
}
```

**Errors**:
- `400 Bad Request`: Validation error or trying to edit approved/published content
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not the owner of this content
- `404 Not Found`: Content ID doesn't exist
- `500 Internal Server Error`: Database error

**Business Rules**:
- Can only update content with status `draft` or `rejected`
- If status was `rejected` and now changed to `pending_review`, clear `rejection_reason` and `reviewed_at`
- Update `updated_at` timestamp
- Increment `version` number if submitting for review after rejection

---

### 3. List Agent Content

**Endpoint**: `GET /api/agent/content`
**Purpose**: List all content for the authenticated agent (with cursor pagination)
**Auth**: Authenticated agent

**Query Parameters**:
```typescript
{
  status?: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published' | 'all'; // Default 'all'
  content_type?: 'blog_post' | 'area_guide' | 'review' | 'fee_structure'; // Optional filter
  cursor?: string; // Base64-encoded {id, created_at}
  limit?: number; // Default 20, max 100
}
```

**Response** (200 OK):
```typescript
{
  data: ContentSubmission[]; // Array of content
  pagination: {
    nextCursor: string | null; // Base64 cursor for next page
    previousCursor: string | null; // Not implemented (forward-only pagination)
    hasNextPage: boolean;
    total?: number; // Optional total count
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Database error

---

### 4. Get Single Content

**Endpoint**: `GET /api/agent/content/[id]`
**Purpose**: Get full details of a specific content submission
**Auth**: Authenticated agent (must own the content)

**Response** (200 OK):
```typescript
{
  data: ContentSubmission; // Full content object
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not the owner
- `404 Not Found`: Content doesn't exist
- `500 Internal Server Error`: Database error

---

### 5. Delete Content

**Endpoint**: `DELETE /api/agent/content/[id]`
**Purpose**: Delete draft content
**Auth**: Authenticated agent (must own the content)

**Response** (200 OK):
```typescript
{
  message: string; // "Content deleted successfully"
}
```

**Errors**:
- `400 Bad Request`: Cannot delete non-draft content
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not the owner
- `404 Not Found`: Content doesn't exist
- `500 Internal Server Error`: Database error

**Business Rules**:
- Can only delete content with status `draft`
- Soft delete by setting status to 'deleted' (future enhancement)

---

## Admin Endpoints

### 6. List Moderation Queue

**Endpoint**: `GET /api/admin/content/moderation`
**Purpose**: List all pending content submissions with filters
**Auth**: Authenticated admin or super_admin

**Query Parameters**:
```typescript
{
  content_type?: 'blog_post' | 'area_guide' | 'review' | 'fee_structure'; // Optional filter
  agent_id?: string; // UUID of agent
  date_from?: string; // ISO 8601 date (e.g., "2025-01-01")
  date_to?: string; // ISO 8601 date
  search?: string; // Search in title
  cursor?: string; // Base64-encoded {id, created_at}
  limit?: number; // Default 20, max 100
}
```

**Response** (200 OK):
```typescript
{
  data: Array<ContentSubmission & {
    agent: {
      id: string;
      business_name: string;
      subdomain: string;
      email: string;
    };
  }>; // Content with agent details joined
  pagination: {
    nextCursor: string | null;
    hasNextPage: boolean;
    total?: number;
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not an admin
- `500 Internal Server Error`: Database error

**Query Behavior**:
- Default: Returns all `pending_review` content
- Filters are AND-combined (all must match)
- Search uses case-insensitive LIKE on title
- Results ordered by `created_at DESC, id DESC`

---

### 7. Get Content for Review

**Endpoint**: `GET /api/admin/content/[id]`
**Purpose**: Get full details of content for admin review
**Auth**: Authenticated admin or super_admin

**Response** (200 OK):
```typescript
{
  data: ContentSubmission & {
    agent: {
      id: string;
      business_name: string;
      subdomain: string;
      email: string;
      user_id: string;
    };
    reviewer?: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    } | null; // If reviewed
  };
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not an admin
- `404 Not Found`: Content doesn't exist
- `500 Internal Server Error`: Database error

---

### 8. Approve Content

**Endpoint**: `POST /api/admin/content/[id]/approve`
**Purpose**: Approve content submission (triggers build queue)
**Auth**: Authenticated admin or super_admin

**Request Body**: None

**Response** (200 OK):
```typescript
{
  data: ContentSubmission; // Updated content with status='approved'
  message: string; // "Content approved successfully"
}
```

**Errors**:
- `400 Bad Request`: Content is not in pending_review status
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not an admin
- `404 Not Found`: Content doesn't exist
- `500 Internal Server Error`: Database, email, or build queue error

**Side Effects**:
1. Update content status to `approved`
2. Set `reviewed_at` to current timestamp
3. Set `reviewed_by_user_id` to current admin's user ID
4. Send approval email to agent (non-blocking)
5. Queue site rebuild for agent (non-blocking, priority 2)

**Idempotency**: Approving already-approved content succeeds without error

---

### 9. Reject Content

**Endpoint**: `POST /api/admin/content/[id]/reject`
**Purpose**: Reject content submission with feedback
**Auth**: Authenticated admin or super_admin

**Request Body**:
```typescript
{
  rejection_reason: string; // Min 10, max 500 chars, required
}
```

**Response** (200 OK):
```typescript
{
  data: ContentSubmission; // Updated content with status='rejected'
  message: string; // "Content rejected successfully"
}
```

**Errors**:
- `400 Bad Request`: Missing/invalid rejection_reason or content not in pending_review
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not an admin
- `404 Not Found`: Content doesn't exist
- `500 Internal Server Error`: Database or email error

**Side Effects**:
1. Update content status to `rejected`
2. Set `rejection_reason` to provided feedback
3. Set `reviewed_at` to current timestamp
4. Set `reviewed_by_user_id` to current admin's user ID
5. Send rejection email to agent with feedback (non-blocking)

---

## Image Upload Endpoint

### 10. Upload Image

**Endpoint**: `POST /api/upload/image`
**Purpose**: Upload and optimize image for content
**Auth**: Authenticated user (agent or admin)

**Request** (multipart/form-data):
```typescript
{
  file: File; // Image file (JPEG, PNG, WebP, GIF)
  bucket?: string; // Default 'content-images'
  content_type?: string; // Optional: blog-posts, area-guides, etc.
}
```

**Response** (200 OK):
```typescript
{
  url: string; // Public URL to uploaded image
  path: string; // Storage path (for deletion if needed)
  size: number; // File size in bytes after optimization
}
```

**Errors**:
- `400 Bad Request`: File too large (>5MB), invalid image type, or corrupted file
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Storage or processing error

**Processing**:
1. Validate file is image (MIME type check + Sharp validation)
2. Enforce 5MB size limit (before optimization)
3. Optimize image:
   - Max width: 1200px (maintain aspect ratio)
   - Quality: 85%
   - Format: Convert to WebP
4. Generate unique filename: `{user_id}/{content_type}/{uuid}.webp`
5. Upload to Supabase Storage bucket
6. Return public URL

**Storage Path**: `content-images/{user_id}/{content_type}/{uuid}.webp`

---

## Utility Endpoints

### 11. List Agents (for Admin Filter)

**Endpoint**: `GET /api/admin/agents`
**Purpose**: Get list of agents for filtering in moderation queue
**Auth**: Authenticated admin or super_admin

**Query Parameters**:
```typescript
{
  search?: string; // Search by business_name or email
  limit?: number; // Default 50, max 100
}
```

**Response** (200 OK):
```typescript
{
  data: Array<{
    id: string;
    business_name: string;
    subdomain: string;
    email: string;
  }>;
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not an admin
- `500 Internal Server Error`: Database error

---

## Common Response Patterns

### Success Response
```typescript
{
  data: T; // Response payload
  message?: string; // Optional success message
}
```

### Error Response
```typescript
{
  error: string; // Human-readable error message
  code?: string; // Machine-readable error code (e.g., "VALIDATION_ERROR")
  details?: Record<string, string[]>; // Field-specific validation errors
}
```

### Pagination Response
```typescript
{
  data: T[];
  pagination: {
    nextCursor: string | null; // Base64-encoded cursor
    previousCursor?: string | null; // Optional, not implemented
    hasNextPage: boolean;
    hasPreviousPage?: boolean; // Optional, not implemented
    total?: number; // Optional total count
  };
}
```

---

## Rate Limiting

**Not Implemented Initially** - Consider adding rate limiting for:
- Image uploads: 10 per minute per user
- Content creation: 5 per minute per agent
- Moderation actions: 100 per minute per admin

---

## Webhook Events (Future)

**Not Implemented** - Potential webhook events for future integration:
- `content.submitted` - Agent submitted content for review
- `content.approved` - Admin approved content
- `content.rejected` - Admin rejected content
- `content.published` - Content was published to agent site

---

## Summary

| Endpoint | Method | Actor | Purpose |
|----------|--------|-------|---------|
| `/api/agent/content` | POST | Agent | Create content |
| `/api/agent/content/[id]` | PUT | Agent | Update content |
| `/api/agent/content/[id]` | GET | Agent | View own content |
| `/api/agent/content/[id]` | DELETE | Agent | Delete draft |
| `/api/agent/content` | GET | Agent | List own content |
| `/api/admin/content/moderation` | GET | Admin | List pending submissions |
| `/api/admin/content/[id]` | GET | Admin | View any content |
| `/api/admin/content/[id]/approve` | POST | Admin | Approve submission |
| `/api/admin/content/[id]/reject` | POST | Admin | Reject submission |
| `/api/upload/image` | POST | Both | Upload images |
| `/api/admin/agents` | GET | Admin | List agents for filter |

**Total**: 11 endpoints (8 existing, 3 new/modified)
