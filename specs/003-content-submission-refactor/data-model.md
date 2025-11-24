# Data Model: Content Submission System Refactor

**Date**: 2025-11-24
**Phase**: 1 - Design & Contracts
**Status**: Complete

## Overview

This feature refactors the existing content submission system. The database schema already exists and is well-designed - no schema changes are required. This document describes the existing model and clarifies validation rules for the refactor.

---

## Existing Entities

### ContentSubmission

**Table**: `content_submissions`
**Purpose**: Stores agent-created content awaiting review or published to their sites

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL | Unique identifier |
| `agent_id` | UUID | FK → agents, NOT NULL | Author of content |
| `content_type` | ENUM | NOT NULL | Type: blog_post, area_guide, review, fee_structure |
| `title` | TEXT | NOT NULL, max 100 chars | Content title |
| `slug` | TEXT | NOT NULL, unique per agent | URL-friendly identifier |
| `content_body` | TEXT | NOT NULL | HTML from Tiptap editor (sanitized) |
| `excerpt` | TEXT | NULLABLE, max 250 chars | Brief summary |
| `featured_image_url` | TEXT | NULLABLE | URL to image in Supabase Storage |
| `seo_meta_title` | TEXT | NULLABLE, max 60 chars | SEO title override |
| `seo_meta_description` | TEXT | NULLABLE, max 160 chars | SEO description |
| `status` | ENUM | NOT NULL, default 'draft' | draft, pending_review, approved, rejected, published |
| `rejection_reason` | TEXT | NULLABLE, max 500 chars | Admin feedback on rejection |
| `submitted_at` | TIMESTAMPTZ | NULLABLE | When submitted for review |
| `reviewed_at` | TIMESTAMPTZ | NULLABLE | When admin reviewed |
| `reviewed_by_user_id` | UUID | FK → profiles, NULLABLE | Admin who reviewed |
| `published_at` | TIMESTAMPTZ | NULLABLE | When published to site |
| `version` | INTEGER | NOT NULL, default 1 | Version number for history |
| `parent_version_id` | UUID | FK → content_submissions, NULLABLE | Previous version link |
| `created_at` | TIMESTAMPTZ | NOT NULL, default NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default NOW() | Last update timestamp |

**Indexes**:
```sql
-- Primary key index (automatic)
CREATE UNIQUE INDEX content_submissions_pkey ON content_submissions(id);

-- Unique slug per agent
CREATE UNIQUE INDEX content_submissions_agent_id_slug_key ON content_submissions(agent_id, slug);

-- Agent lookup
CREATE INDEX idx_content_submissions_agent_id ON content_submissions(agent_id);

-- Status filtering
CREATE INDEX idx_content_submissions_status ON content_submissions(status);

-- Published content
CREATE INDEX idx_content_submissions_published_at ON content_submissions(published_at) WHERE published_at IS NOT NULL;

-- NEW: Cursor pagination (to be added)
CREATE INDEX idx_content_cursor ON content_submissions(agent_id, created_at DESC, id DESC) WHERE status != 'deleted';
```

**Constraints**:
- `agent_id` must exist in `agents` table
- `reviewed_by_user_id` must exist in `profiles` table with role 'admin' or 'super_admin'
- `slug` must be unique per agent (allows same slug across different agents)
- `title` length <= 100 characters
- `excerpt` length <= 250 characters
- `seo_meta_title` length <= 60 characters
- `seo_meta_description` length <= 160 characters
- `rejection_reason` length <= 500 characters

**State Transitions**:
```
draft → pending_review → approved → published
             ↓              ↓
         rejected ←──────────┘
             ↓
         draft (edit & resubmit)
```

**Validation Rules** (from `@nest/validation/src/content.ts`):
- `content_type`: Must be one of: 'blog_post', 'area_guide', 'review', 'fee_structure'
- `status`: Must be one of: 'draft', 'pending_review', 'approved', 'rejected', 'published'
- `title`: Required, 1-100 characters
- `slug`: Required, lowercase alphanumeric + hyphens, starts/ends with alphanumeric
- `content_body`: Required, min 1 character (no max - HTML can be long)
- `excerpt`: Optional, max 250 characters
- `featured_image_url`: Optional, must be valid URL if provided
- `seo_meta_title`: Optional, max 60 characters
- `seo_meta_description`: Optional, max 160 characters
- `rejection_reason`: Required when rejecting, 10-500 characters

**Relationships**:
- **Belongs to Agent**: `agent_id` → `agents.id`
- **Reviewed by User**: `reviewed_by_user_id` → `profiles.id` (admin/super_admin only)
- **Version History**: `parent_version_id` → `content_submissions.id` (self-reference)

---

### Agent (Existing, No Changes)

**Table**: `agents`
**Purpose**: Represents real estate agents using the platform

**Relevant Fields**:
- `id` (UUID): Primary key
- `user_id` (UUID): FK → profiles (the user who owns this agent profile)
- `business_name` (TEXT): Agent's business name
- `subdomain` (TEXT): Unique subdomain for agent's site (e.g., johndoe.nestagents.co.uk)
- `email` (TEXT): Contact email
- `created_at` (TIMESTAMPTZ): When agent joined

**Used for**:
- Content ownership (`content_submissions.agent_id`)
- Image upload folder naming (`content-images/{agent.user_id}/`)
- Filtering content in admin moderation queue

---

### Profile (Existing, No Changes)

**Table**: `profiles`
**Purpose**: User accounts with authentication and roles

**Relevant Fields**:
- `id` (UUID): Primary key, matches Supabase auth.users.id
- `email` (TEXT): User email
- `role` (ENUM): 'agent', 'admin', 'super_admin'
- `first_name` (TEXT): User's first name
- `last_name` (TEXT): User's last name

**Used for**:
- Authentication and authorization
- Admin reviewer tracking (`content_submissions.reviewed_by_user_id`)
- Image upload authentication (RLS policies)

---

## New Entities (Conceptual, Not Persisted)

### ContentFilter

**Purpose**: Represents filter state for admin moderation queue (URL params + UI state)

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `content_type` | ENUM | Filter by: 'all', 'blog_post', 'area_guide', 'review', 'fee_structure' |
| `agent_id` | UUID | Filter by specific agent |
| `date_from` | DATE | Filter submissions after this date |
| `date_to` | DATE | Filter submissions before this date |
| `search_query` | STRING | Search in title field |
| `cursor` | STRING | Base64-encoded {id, created_at} for pagination |
| `limit` | INTEGER | Items per page (default 20) |

**Not Stored**: These are transient query parameters

**Serialization**: Stored in URL query params for bookmarking
```
/admin/content-moderation?type=blog_post&agent=123&cursor=abc123&limit=20
```

---

### ImageUpload (Conceptual)

**Purpose**: Represents uploaded images in Supabase Storage (not a database table)

**Storage Path**: `content-images/{agent_user_id}/{content_type}/{uuid}.webp`

**Metadata** (from Supabase Storage API):
- `name`: File path in bucket
- `id`: Storage object ID
- `created_at`: Upload timestamp
- `updated_at`: Last modified
- `metadata`: Custom metadata (content_type, uploaded_by)

**Access Control**: RLS policies on `storage.objects`
- Agent can upload/read/delete files in their own folder
- Public can read all files (for published content)

**Not Persisted as Entity**: Image URLs are stored in `content_submissions.featured_image_url`

---

## RLS Policies (Existing, No Changes Needed)

### Content Submissions

1. **Agents can view own content**
   ```sql
   FOR SELECT TO authenticated
   USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()))
   ```

2. **Agents can create content**
   ```sql
   FOR INSERT TO authenticated
   WITH CHECK (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()))
   ```

3. **Agents can update own draft/rejected content**
   ```sql
   FOR UPDATE TO authenticated
   USING (
     agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
     AND status IN ('draft', 'rejected')
   )
   ```

4. **Agents can delete own draft content**
   ```sql
   FOR DELETE TO authenticated
   USING (
     agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
     AND status = 'draft'
   )
   ```

5. **Admins can view all content**
   ```sql
   FOR SELECT TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
       AND profiles.role IN ('admin', 'super_admin')
     )
   )
   ```

6. **Admins can moderate content**
   ```sql
   FOR UPDATE TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
       AND profiles.role IN ('admin', 'super_admin')
     )
   )
   ```

7. **Public can view published content**
   ```sql
   FOR SELECT TO anon
   USING (status = 'published' AND published_at IS NOT NULL)
   ```

---

## Database Migrations Required

### New Index for Cursor Pagination

**File**: `supabase/migrations/YYYYMMDDHHMMSS_add_content_cursor_index.sql`

```sql
-- Add index for cursor-based pagination on content submissions
-- Supports efficient queries ordered by created_at DESC, id DESC
-- Filtered by agent_id for agent content lists
CREATE INDEX IF NOT EXISTS idx_content_cursor
ON content_submissions(agent_id, created_at DESC, id DESC)
WHERE status != 'deleted';

-- Optional: Separate index for admin moderation queue
CREATE INDEX IF NOT EXISTS idx_content_admin_cursor
ON content_submissions(status, created_at DESC, id DESC)
WHERE status = 'pending_review';

COMMENT ON INDEX idx_content_cursor IS 'Supports cursor pagination for agent content lists';
COMMENT ON INDEX idx_content_admin_cursor IS 'Supports cursor pagination for admin moderation queue';
```

---

### Supabase Storage Bucket for Content Images

**File**: `supabase/migrations/YYYYMMDDHHMMSS_create_content_images_bucket.sql`

```sql
-- Create content-images bucket for agent-uploaded images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-images',
  'content-images',
  true, -- Public read access
  5242880, -- 5MB limit (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Agent can upload to own folder
CREATE POLICY "content_images_agent_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'content-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Agent can read own images
CREATE POLICY "content_images_agent_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'content-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Public can view all images (for published content)
CREATE POLICY "content_images_public_select"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'content-images');

-- RLS Policy: Agent can delete own images
CREATE POLICY "content_images_agent_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'content-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

COMMENT ON TABLE storage.buckets IS 'Storage buckets including content-images for agent content';
```

---

## Validation Schemas (Existing, Minor Updates)

### Extend Validation for Image Upload

**File**: `packages/validation/src/content.ts`

**Add**:
```typescript
// Image upload validation
export const imageUploadSchema = z.object({
  file: z.instanceof(File),
  bucket: z.enum(['content-images']).default('content-images'),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB
  allowedTypes: z.array(z.string()).default([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ]),
});

// Validate featured_image_url is from our Supabase Storage
export const contentImageUrlSchema = z.string().url().refine(
  (url) => url.includes('supabase.co/storage/v1/object/public/content-images/'),
  { message: 'Image must be hosted in Supabase content-images bucket' }
);
```

**Update `createContentSchema`**:
```typescript
export const createContentSchema = z.object({
  // ... existing fields
  featured_image_url: contentImageUrlSchema.optional(),
  // ... rest of fields
});
```

---

## Type Definitions (Existing, No Changes)

**File**: `packages/shared-types/src/entities.ts`

The `ContentSubmission` type already exists and matches the database schema perfectly. No changes needed.

```typescript
export interface ContentSubmission {
  id: string;
  agent_id: string;
  content_type: 'blog_post' | 'area_guide' | 'review' | 'fee_structure';
  title: string;
  slug: string;
  content_body: string; // HTML
  excerpt: string | null;
  featured_image_url: string | null;
  seo_meta_title: string | null;
  seo_meta_description: string | null;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published';
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by_user_id: string | null;
  published_at: string | null;
  version: number;
  parent_version_id: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## Summary of Data Changes

| Change | Type | Status |
|--------|------|--------|
| Add cursor pagination index | Migration | 🆕 Required |
| Create content-images bucket | Migration | 🆕 Required |
| Add RLS policies for storage | Migration | 🆕 Required |
| Image upload validation schema | Code | 🆕 Required |
| Content image URL validation | Code | 🆕 Required |
| ContentSubmission entity | Existing | ✅ No changes |
| RLS policies | Existing | ✅ No changes |
| TypeScript types | Existing | ✅ No changes |

**No breaking changes to existing schema - only additive improvements.**
