# Data Model: Separate Reviews & Fees

**Feature**: 005-separate-reviews-fees
**Date**: 2025-11-26

## Entity Overview

### Modified Entities

#### content_submissions (Modified)
Existing table, add archival support for deprecated types.

**New Fields**:
- `is_archived` (BOOLEAN, DEFAULT FALSE) - Marks deprecated content types

**Modified Constraints**:
- content_type CHECK: Allow old types only when is_archived=TRUE, otherwise restrict to ['blog_post', 'area_guide']

**Indexes**:
- `idx_content_archived` - Partial index on (is_archived) WHERE is_archived = FALSE

**No changes to existing fields**: id, agent_id, content_type, title, slug, content_body, excerpt, featured_image_url, seo_meta_title, seo_meta_description, status, rejection_reason, submitted_at, reviewed_at, reviewed_by_user_id, published_at, version, parent_version_id, created_at, updated_at

---

#### agents (Modified)
Existing table, add Google My Business integration.

**New Fields**:
- `google_place_id` (TEXT, NULLABLE) - Google My Business Place ID for reviews widget

**Indexes**:
- `idx_agents_google_place_id` - On (google_place_id) WHERE google_place_id IS NOT NULL

**No changes to existing fields**: id, user_id, subdomain, company_name, bio, phone, office_address, coverage_areas, social_media_links, profile_image_url, is_active, onboarding_completed, created_at, updated_at

---

### New Entities

#### agent_fees (New Table)
Stores agent commission rates and fee information.

**Fields**:
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `agent_id` (UUID, FK → agents.id, UNIQUE) - One fee structure per agent
- `sales_percentage` (DECIMAL(5,2), CHECK >= 0 AND <= 100) - Sales commission %
- `lettings_percentage` (DECIMAL(5,2), CHECK >= 0 AND <= 100) - Lettings commission %
- `minimum_fee` (DECIMAL(10,2), NULLABLE, CHECK >= 0) - Minimum fee in GBP
- `notes` (TEXT, NULLABLE) - Additional fee information
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

**Constraints**:
- PRIMARY KEY: id
- UNIQUE: agent_id (one current fee structure per agent)
- FOREIGN KEY: agent_id → agents(id) ON DELETE CASCADE
- CHECK: sales_percentage BETWEEN 0 AND 100
- CHECK: lettings_percentage BETWEEN 0 AND 100
- CHECK: minimum_fee >= 0

**Indexes**:
- Primary key index on id (automatic)
- Unique index on agent_id (automatic)

**RLS Policies**:
- "Agents manage own fees" - FOR ALL USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()))
- "Public read fees" - FOR SELECT USING (TRUE)

**Relationships**:
- `agent_fees.agent_id` → `agents.id` (Many-to-One, but UNIQUE constraint makes it One-to-One)

---

## State Transitions

### Content Submissions

Existing state machine (unchanged for blog_post/area_guide):
```
draft → pending_review → approved → published
                      ↓
                   rejected → (can be edited and resubmitted)
```

New behavior for archived content:
```
review/fee_structure (active) → is_archived=TRUE (one-time migration)
```

Archived content has no valid transitions (read-only historical data).

### Agent Fees

No state machine. Simple CRUD:
```
NULL (not configured) → Created → Updated (in-place, no versioning)
```

Agent can update at any time. Last write wins.

---

## Data Validation Rules

### content_submissions

**Existing validation** (applies to blog_post/area_guide):
- title: required, max 200 chars
- slug: required, unique per agent, lowercase alphanumeric + hyphens
- content_type: enum ['blog_post', 'area_guide']
- status: enum ['draft', 'pending_review', 'approved', 'rejected', 'published']
- content_body: optional HTML (sanitized server-side)

**New validation**:
- content_type: Must be in ['blog_post', 'area_guide'] OR is_archived=TRUE

### agent_fees

**Field validation**:
- sales_percentage: number, 0-100, up to 2 decimal places (e.g., 1.50)
- lettings_percentage: number, 0-100, up to 2 decimal places (e.g., 10.00)
- minimum_fee: optional number, >= 0, up to 2 decimal places (e.g., 2000.00)
- notes: optional text, max 1000 characters

**Business rules**:
- At least one of sales_percentage or lettings_percentage should be set (client-side guidance, not enforced)
- Minimum fee applies to both sales and lettings (documented in UI, not separate fields)

### agents.google_place_id

**Field validation**:
- Optional text field
- Format validation (client-side): Must start with "ChIJ" if provided
- Google validates actual Place ID existence (via widget error state)

---

## Query Patterns

### Content Submissions (Updated)

**Agent content list** (apps/dashboard/app/(agent)/content/page.tsx):
```sql
SELECT * FROM content_submissions
WHERE agent_id = $agentId
  AND is_archived = FALSE
ORDER BY updated_at DESC;
```

**Agent content by ID**:
```sql
SELECT * FROM content_submissions
WHERE id = $contentId
  AND agent_id = $agentId
  AND is_archived = FALSE;
```

**Admin moderation queue** (apps/dashboard/app/api/admin/content/moderation/route.ts):
```sql
SELECT cs.*, a.subdomain, p.first_name, p.last_name, p.email
FROM content_submissions cs
LEFT JOIN agents a ON cs.agent_id = a.id
LEFT JOIN profiles p ON a.user_id = p.user_id
WHERE cs.status = 'pending_review'
  AND cs.is_archived = FALSE
ORDER BY cs.created_at DESC;
```

### Agent Fees

**Get agent fees**:
```sql
SELECT * FROM agent_fees
WHERE agent_id = $agentId;
```

**Upsert agent fees**:
```sql
INSERT INTO agent_fees (agent_id, sales_percentage, lettings_percentage, minimum_fee, notes)
VALUES ($agentId, $sales, $lettings, $minFee, $notes)
ON CONFLICT (agent_id)
DO UPDATE SET
  sales_percentage = EXCLUDED.sales_percentage,
  lettings_percentage = EXCLUDED.lettings_percentage,
  minimum_fee = EXCLUDED.minimum_fee,
  notes = EXCLUDED.notes,
  updated_at = NOW();
```

**Public fee lookup** (for agent site display):
```sql
SELECT sales_percentage, lettings_percentage, minimum_fee, notes
FROM agent_fees
WHERE agent_id = $agentId;
```

### Google Place ID

**Get agent Place ID**:
```sql
SELECT google_place_id FROM agents
WHERE user_id = $userId;
```

**Update Place ID**:
```sql
UPDATE agents
SET google_place_id = $placeId, updated_at = NOW()
WHERE user_id = $userId;
```

---

## Migration Strategy

### Migration 1: Archive deprecated content
1. Add is_archived column (default FALSE)
2. UPDATE existing review/fee_structure to is_archived=TRUE
3. Drop old CHECK constraint
4. Add new CHECK constraint allowing old types only when archived
5. Create partial index on non-archived content

**Rollback**: DROP column, restore original constraint

### Migration 2: Create agent_fees table
1. CREATE TABLE with all fields and constraints
2. CREATE RLS policies
3. No data migration (agents will populate via UI)

**Rollback**: DROP TABLE agent_fees

### Migration 3: Add google_place_id
1. ALTER TABLE agents ADD COLUMN
2. CREATE index
3. No data migration (agents will populate via UI)

**Rollback**: DROP COLUMN google_place_id

**Order**: Must run in sequence (1 → 2 → 3). No dependencies between migrations.

---

## Data Integrity

### Referential Integrity

- `agent_fees.agent_id` → `agents.id` CASCADE DELETE (if agent deleted, fees deleted)
- `content_submissions.agent_id` → `agents.id` CASCADE DELETE (existing, unchanged)

### Uniqueness Constraints

- `agent_fees.agent_id` UNIQUE - One fee structure per agent
- `content_submissions.slug` + `agent_id` UNIQUE - Per-agent unique slugs (existing, unchanged)

### Data Consistency

- Fee percentages capped at 100% via CHECK constraint
- Fee amounts non-negative via CHECK constraint
- Archived content preserves original type value for historical accuracy
- google_place_id stored as-is (no normalization), Google widget validates

---

## Security & Access Control

### RLS Policies

**agent_fees**:
- Agents: Full access to own fees (SELECT, INSERT, UPDATE, DELETE)
- Public: Read-only access to all fees (for displaying on agent sites)
- Admins: No special access needed (use service role client if admin reporting needed)

**agents.google_place_id**:
- Inherits existing agents table RLS policies
- Agents: Can update own google_place_id
- Public: Can read for displaying reviews on agent sites

**content_submissions**:
- Existing RLS policies apply
- is_archived field checked in application layer (not RLS), ensures clean separation

### Data Privacy

- Fee structure: Public information (displayed on agent websites)
- Google Place ID: Public information (non-sensitive Google identifier)
- Archived content: Retains original RLS policies, hidden via is_archived filter

---

## Performance Optimization

### Indexes

- `idx_content_archived` - Speeds up non-archived content queries (most common)
- `idx_agents_google_place_id` - Fast lookup for agents with GMB configured

### Query Optimization

- Partial indexes reduce index size (only index relevant records)
- UNIQUE constraint on agent_fees.agent_id creates automatic index for lookups
- No N+1 queries (fees fetched with single query per page load)

### Caching Strategy

- Fee structure: Can cache at edge (rarely changes)
- Google Maps widget: Cached by Google CDN
- Content lists: Existing caching unchanged

---

## Extensibility

### Future Enhancements (Out of V1 Scope)

**Fee Versioning**:
- Add: `effective_from`, `effective_until`, `version`, `superseded_by_id` columns
- Migration: Rename current table to agent_fees_history, create new agent_fees_current view
- Minimal code changes (API/UI already supports single current fee)

**GMB API Integration**:
- Add: `gmb_credentials` table for OAuth tokens (encrypted)
- Add: `gmb_reviews` cache table
- Add: Cron job for scheduled sync
- Keep existing embedded widget as fallback

**Fee Audit Log**:
- Add: `fee_change_audit` table
- Trigger on agent_fees UPDATE
- Minimal code changes (transparent to application)
