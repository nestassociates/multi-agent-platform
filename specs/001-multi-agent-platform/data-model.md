# Data Model: Multi-Agent Real Estate Platform

**Feature**: Multi-Agent Real Estate Platform
**Date**: 2025-10-29
**Database**: PostgreSQL 15 with PostGIS extension (Supabase)

## Overview

This document defines the complete database schema for the Multi-Agent Real Estate Platform, including all tables, relationships, indexes, constraints, and Row Level Security (RLS) policies.

---

## Database Schema Diagram

```
┌─────────────────┐
│  auth.users     │ (Supabase Auth - managed)
│  - id           │
│  - email        │
│  - encrypted_pw │
└────────┬────────┘
         │
         │ 1:1
         ↓
┌─────────────────┐        1:N        ┌──────────────────┐
│   profiles      │─────────────────→│   agents         │
│  - id (PK)      │                   │  - id (PK)       │
│  - user_id (FK) │                   │  - user_id (FK)  │
│  - role         │                   │  - subdomain     │
│  - first_name   │                   │  - apex27_branch │
│  - last_name    │                   │  - bio           │
│  - phone        │                   │  - status        │
│  - avatar_url   │                   └────────┬─────────┘
└─────────────────┘                            │
                                               │ 1:N
                         ┌─────────────────────┼──────────────────────┬────────────────┐
                         │                     │                      │                │
                         ↓                     ↓                      ↓                ↓
              ┌───────────────────┐ ┌──────────────────┐ ┌────────────────┐ ┌──────────────┐
              │  properties       │ │  territories     │ │  content_sub   │ │  build_queue │
              │  - id (PK)        │ │  - id (PK)       │ │  - id (PK)     │ │  - id (PK)   │
              │  - agent_id (FK)  │ │  - agent_id (FK) │ │  - agent_id    │ │  - agent_id  │
              │  - apex27_id      │ │  - name          │ │  - content_type│ │  - priority  │
              │  - type           │ │  - boundary      │ │  - title       │ │  - status    │
              │  - title          │ │  - prop_count    │ │  - status      │ │  - logs      │
              │  - price          │ └──────────────────┘ │  - rejection   │ └──────────────┘
              │  - bedrooms       │                      └────────────────┘
              │  - location (GIS) │
              └───────────────────┘

┌──────────────────┐
│  global_content  │
│  - id (PK)       │
│  - content_type  │
│  - content_body  │
│  - is_published  │
└──────────────────┘

┌──────────────────┐
│  audit_logs      │
│  - id (PK)       │
│  - user_id (FK)  │
│  - entity_type   │
│  - action        │
│  - old_values    │
│  - new_values    │
└──────────────────┘

┌──────────────────────┐
│  contact_form_sub    │
│  - id (PK)           │
│  - agent_id (FK)     │
│  - property_id (FK?) │
│  - name              │
│  - email             │
│  - message           │
└──────────────────────┘
```

---

## Core Tables

### 1. profiles

Extends Supabase Auth with additional user information. One profile per auth user.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'agent')),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Relationships**:
- `user_id` → `auth.users.id` (1:1) - Links to Supabase Auth user

**Validation Rules**:
- `role` must be one of: `super_admin`, `admin`, `agent`
- `email` must be unique and valid email format
- `first_name` and `last_name` required

**RLS Policy**:
```sql
-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    role = (SELECT role FROM profiles WHERE user_id = auth.uid())
  );

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Admins can update any profile
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );
```

---

### 2. agents

Stores real estate agent-specific information. One agent per agent user.

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(user_id) ON DELETE CASCADE,
  subdomain TEXT NOT NULL UNIQUE,
  apex27_branch_id TEXT,
  bio TEXT,
  qualifications TEXT[] DEFAULT '{}',
  social_media_links JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subdomain_format CHECK (subdomain ~ '^[a-z0-9-]+$')
);

-- Indexes
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE UNIQUE INDEX idx_agents_subdomain ON agents(subdomain);
CREATE INDEX idx_agents_apex27_branch_id ON agents(apex27_branch_id) WHERE apex27_branch_id IS NOT NULL;
CREATE INDEX idx_agents_status ON agents(status);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Relationships**:
- `user_id` → `profiles.user_id` (1:1) - Links to user profile

**Validation Rules**:
- `subdomain` must be unique, lowercase letters, numbers, and hyphens only
- `status` must be one of: `active`, `suspended`, `archived`
- `qualifications` is an array of strings (e.g., `['ARLA', 'NAEA', 'Registered Valuer']`)
- `social_media_links` is JSON object: `{"facebook": "url", "twitter": "url", "linkedin": "url", "instagram": "url"}`

**Example social_media_links**:
```json
{
  "facebook": "https://facebook.com/johnsmith",
  "twitter": "https://twitter.com/johnsmith",
  "linkedin": "https://linkedin.com/in/johnsmith",
  "instagram": "https://instagram.com/johnsmith"
}
```

**RLS Policy**:
```sql
-- Agents can view their own agent record
CREATE POLICY "Agents can view own agent record"
  ON agents FOR SELECT
  USING (
    user_id = (SELECT user_id FROM profiles WHERE user_id = auth.uid())
  );

-- Agents can update their own agent record (except status, subdomain)
CREATE POLICY "Agents can update own agent record"
  ON agents FOR UPDATE
  USING (
    user_id = (SELECT user_id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT user_id FROM profiles WHERE user_id = auth.uid()) AND
    status = OLD.status AND
    subdomain = OLD.subdomain
  );

-- Admins can view all agents
CREATE POLICY "Admins can view all agents"
  ON agents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Admins can insert/update/delete agents
CREATE POLICY "Admins can manage agents"
  ON agents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );
```

---

### 3. properties

Stores property listings synced from Apex27 CRM.

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  apex27_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'let', 'commercial')),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  property_type TEXT,
  address JSONB NOT NULL,
  postcode TEXT,
  location GEOGRAPHY(POINT, 4326), -- PostGIS point (latitude, longitude)
  images JSONB DEFAULT '[]',
  features TEXT[] DEFAULT '{}',
  floor_plan_url TEXT,
  virtual_tour_url TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'under_offer', 'sold', 'let')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  raw_data JSONB, -- Full JSON from Apex27 for debugging
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_agent_property UNIQUE (agent_id, apex27_id)
);

-- Indexes
CREATE INDEX idx_properties_agent_id ON properties(agent_id);
CREATE INDEX idx_properties_apex27_id ON properties(apex27_id);
CREATE INDEX idx_properties_postcode ON properties(postcode);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_transaction_type ON properties(transaction_type);
CREATE INDEX idx_properties_is_featured ON properties(is_featured) WHERE is_featured = true;
CREATE INDEX idx_properties_status ON properties(status);

-- Spatial index for location queries
CREATE INDEX idx_properties_location ON properties USING GIST(location);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Relationships**:
- `agent_id` → `agents.id` (N:1) - Many properties belong to one agent

**Validation Rules**:
- `transaction_type` must be one of: `sale`, `let`, `commercial`
- `status` must be one of: `available`, `under_offer`, `sold`, `let`
- `price` must be positive
- `unique_agent_property` constraint prevents duplicate properties from same Apex27 branch

**Example address JSON**:
```json
{
  "line1": "123 High Street",
  "line2": "Flat 2",
  "city": "London",
  "county": "Greater London",
  "postcode": "SW1A 1AA",
  "country": "United Kingdom"
}
```

**Example images JSON**:
```json
[
  {"url": "https://storage.supabase.co/...", "alt": "Living room", "order": 1},
  {"url": "https://storage.supabase.co/...", "alt": "Kitchen", "order": 2},
  {"url": "https://storage.supabase.co/...", "alt": "Bedroom", "order": 3}
]
```

**RLS Policy**:
```sql
-- Agents can view their own properties
CREATE POLICY "Agents can view own properties"
  ON properties FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = (
        SELECT user_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can view all properties
CREATE POLICY "Admins can view all properties"
  ON properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Public (unauthenticated) can view non-hidden properties
CREATE POLICY "Public can view non-hidden properties"
  ON properties FOR SELECT
  USING (is_hidden = false);

-- Only webhook endpoints (using service role key) can insert/update/delete
-- No RLS policy needed - handled at API route level
```

---

### 4. territories

Stores geographic territories assigned to agents. Uses PostGIS for polygon storage and spatial queries.

```sql
CREATE TABLE territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  boundary GEOGRAPHY(POLYGON, 4326) NOT NULL, -- PostGIS polygon
  property_count INTEGER,
  property_count_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_territories_agent_id ON territories(agent_id);

-- Spatial index for boundary queries (overlap detection, point-in-polygon)
CREATE INDEX idx_territories_boundary ON territories USING GIST(boundary);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_territories_updated_at
  BEFORE UPDATE ON territories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Relationships**:
- `agent_id` → `agents.id` (N:1) - Many territories can belong to one agent

**Validation Rules**:
- `boundary` must be a valid GeoJSON polygon (WGS84 coordinate system)
- `property_count` updated manually or via scheduled job

**Example boundary (GeoJSON)**:
```json
{
  "type": "Polygon",
  "coordinates": [
    [
      [-0.1278, 51.5074], // [longitude, latitude]
      [-0.1278, 51.5174],
      [-0.1178, 51.5174],
      [-0.1178, 51.5074],
      [-0.1278, 51.5074]  // Close the polygon
    ]
  ]
}
```

**Spatial Queries**:
```sql
-- Check if territories overlap
SELECT t1.id, t2.id
FROM territories t1, territories t2
WHERE t1.id < t2.id
  AND ST_Intersects(t1.boundary, t2.boundary);

-- Find properties within a territory
SELECT p.id, p.title, p.postcode
FROM properties p
INNER JOIN territories t ON ST_Within(p.location, t.boundary)
WHERE t.id = $1;

-- Calculate area of territory (in square meters)
SELECT id, name, ST_Area(boundary::geometry) / 1000000 AS area_km2
FROM territories;
```

**RLS Policy**:
```sql
-- Agents can view their own territories
CREATE POLICY "Agents can view own territories"
  ON territories FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = (
        SELECT user_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can view all territories
CREATE POLICY "Admins can view all territories"
  ON territories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Admins can insert/update/delete territories
CREATE POLICY "Admins can manage territories"
  ON territories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Public can view all territories (for map display on main site)
CREATE POLICY "Public can view territories"
  ON territories FOR SELECT
  USING (true);
```

---

### 5. content_submissions

Stores user-generated content created by agents (blog posts, area guides, reviews, fee structures).

```sql
CREATE TABLE content_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('blog_post', 'area_guide', 'review', 'fee_structure')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content_body TEXT NOT NULL, -- HTML from Tiptap editor
  excerpt TEXT,
  featured_image_url TEXT,
  seo_meta_title TEXT,
  seo_meta_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'published')),
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by_user_id UUID REFERENCES profiles(user_id),
  published_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  parent_version_id UUID REFERENCES content_submissions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_agent_slug UNIQUE (agent_id, slug)
);

-- Indexes
CREATE INDEX idx_content_agent_id ON content_submissions(agent_id);
CREATE INDEX idx_content_status ON content_submissions(status);
CREATE INDEX idx_content_status_agent_id ON content_submissions(status, agent_id);
CREATE INDEX idx_content_published_at ON content_submissions(published_at) WHERE status = 'published';
CREATE INDEX idx_content_reviewed_by ON content_submissions(reviewed_by_user_id) WHERE reviewed_by_user_id IS NOT NULL;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_content_submissions_updated_at
  BEFORE UPDATE ON content_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-set submitted_at when status changes to pending_review
CREATE OR REPLACE FUNCTION set_submitted_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending_review' AND OLD.status != 'pending_review' THEN
    NEW.submitted_at = NOW();
  END IF;
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_content_submission_timestamps
  BEFORE UPDATE ON content_submissions
  FOR EACH ROW
  EXECUTE FUNCTION set_submitted_at();
```

**Relationships**:
- `agent_id` → `agents.id` (N:1) - Many content submissions belong to one agent
- `reviewed_by_user_id` → `profiles.user_id` (N:1) - Many submissions reviewed by one admin
- `parent_version_id` → `content_submissions.id` (optional) - Version history

**Validation Rules**:
- `content_type` must be one of: `blog_post`, `area_guide`, `review`, `fee_structure`
- `status` must be one of: `draft`, `pending_review`, `approved`, `rejected`, `published`
- `slug` must be unique per agent (enables unique URLs like `/blog/{slug}`)
- `title` max 100 characters
- `excerpt` max 250 characters
- `seo_meta_description` max 160 characters

**Status State Machine**:
```
draft → pending_review → approved → published
                ↓
             rejected → (back to draft for editing)
```

**RLS Policy**:
```sql
-- Agents can view their own content
CREATE POLICY "Agents can view own content"
  ON content_submissions FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = (
        SELECT user_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Agents can insert/update own content (only if status is draft or rejected)
CREATE POLICY "Agents can create content"
  ON content_submissions FOR INSERT
  WITH CHECK (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = (
        SELECT user_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Agents can update own draft/rejected content"
  ON content_submissions FOR UPDATE
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = (
        SELECT user_id FROM profiles WHERE user_id = auth.uid()
      )
    ) AND status IN ('draft', 'rejected')
  );

-- Admins can view all content
CREATE POLICY "Admins can view all content"
  ON content_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Admins can update content (approve/reject)
CREATE POLICY "Admins can moderate content"
  ON content_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Public can view published content
CREATE POLICY "Public can view published content"
  ON content_submissions FOR SELECT
  USING (status = 'published');
```

---

### 6. build_queue

Tracks pending and completed static site builds for agents.

```sql
CREATE TABLE build_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 4),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  trigger_reason TEXT NOT NULL,
  build_logs TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_build_queue_agent_id ON build_queue(agent_id);
CREATE INDEX idx_build_queue_status ON build_queue(status);

-- Index for processing queue (priority, created_at) for pending builds
CREATE INDEX idx_build_queue_processing ON build_queue(priority, created_at) WHERE status = 'pending';

-- Unique index: only one pending build per agent at a time
CREATE UNIQUE INDEX idx_build_queue_pending_agent ON build_queue(agent_id) WHERE status = 'pending';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_build_queue_updated_at
  BEFORE UPDATE ON build_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Relationships**:
- `agent_id` → `agents.id` (N:1) - Many build jobs for one agent

**Validation Rules**:
- `priority` must be between 1 and 4 (1 = Emergency, 2 = High, 3 = Normal, 4 = Low)
- `status` must be one of: `pending`, `processing`, `completed`, `failed`
- `unique_pending_agent` constraint ensures only one pending build per agent (prevents queue flooding)

**Priority Levels**:
- **P1 (Emergency)**: Legal updates, critical security fixes (process immediately)
- **P2 (High)**: Content approvals, property updates (process within 5 minutes)
- **P3 (Normal)**: Global template updates, bulk operations (process within 30 minutes)
- **P4 (Low)**: Scheduled rebuilds, non-urgent updates (process within 24 hours)

**RLS Policy**:
```sql
-- Agents can view their own build queue
CREATE POLICY "Agents can view own build queue"
  ON build_queue FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = (
        SELECT user_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can view all build queue
CREATE POLICY "Admins can view all build queue"
  ON build_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Only cron job (using service role key) can insert/update/delete
-- No RLS policy needed - handled at API route level
```

---

### 7. global_content

Stores platform-wide templates and legal pages (header, footer, privacy policy, etc.).

```sql
CREATE TABLE global_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL UNIQUE CHECK (content_type IN ('header', 'footer', 'privacy_policy', 'terms_of_service', 'cookie_policy')),
  content_body TEXT NOT NULL, -- HTML or JSON
  version INTEGER NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by_user_id UUID NOT NULL REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_global_content_type ON global_content(content_type);
CREATE INDEX idx_global_content_published ON global_content(is_published) WHERE is_published = true;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_global_content_updated_at
  BEFORE UPDATE ON global_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Relationships**:
- `created_by_user_id` → `profiles.user_id` (N:1) - Many global content pieces created by admins

**Validation Rules**:
- `content_type` must be unique (only one header, one footer, etc.)
- `content_type` must be one of: `header`, `footer`, `privacy_policy`, `terms_of_service`, `cookie_policy`

**RLS Policy**:
```sql
-- Admins can view all global content
CREATE POLICY "Admins can view global content"
  ON global_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Admins can insert/update global content
CREATE POLICY "Admins can manage global content"
  ON global_content FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Public can view published global content
CREATE POLICY "Public can view published global content"
  ON global_content FOR SELECT
  USING (is_published = true);
```

---

### 8. audit_logs

Tracks all sensitive operations for GDPR compliance and security auditing.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'view')),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Partition by created_at (monthly) for better performance
-- (Advanced feature - implement after initial launch)
```

**Validation Rules**:
- `action` must be one of: `create`, `update`, `delete`, `view`
- `entity_type` examples: `agent`, `property`, `content_submission`, `territory`
- `old_values` and `new_values` are JSONB (stores changed fields only for `update` actions)

**Example audit log entry**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "admin-user-id",
  "entity_type": "agent",
  "entity_id": "agent-id",
  "action": "update",
  "old_values": {"status": "active"},
  "new_values": {"status": "suspended"},
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2025-10-29T10:30:00Z"
}
```

**RLS Policy**:
```sql
-- Admins can view all audit logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Only API routes (using service role key) can insert audit logs
-- No RLS policy needed - handled at API route level
```

---

### 9. contact_form_submissions

Stores contact form submissions from agent microsites.

```sql
CREATE TABLE contact_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  source_page TEXT, -- e.g., "/contact", "/properties/123"
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contact_form_agent_id ON contact_form_submissions(agent_id);
CREATE INDEX idx_contact_form_property_id ON contact_form_submissions(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX idx_contact_form_created_at ON contact_form_submissions(created_at);
CREATE INDEX idx_contact_form_email ON contact_form_submissions(email);
```

**Relationships**:
- `agent_id` → `agents.id` (N:1) - Many submissions for one agent
- `property_id` → `properties.id` (N:1, optional) - Submission might be about specific property

**Validation Rules**:
- `name`, `email`, `message` required
- `email` must be valid email format
- `property_id` optional (contact page vs property enquiry)

**RLS Policy**:
```sql
-- Agents can view their own contact form submissions
CREATE POLICY "Agents can view own submissions"
  ON contact_form_submissions FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = (
        SELECT user_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
  ON contact_form_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Public (unauthenticated) can insert contact form submissions
CREATE POLICY "Public can submit contact forms"
  ON contact_form_submissions FOR INSERT
  WITH CHECK (true);
```

---

## Database Functions

### update_updated_at_column()

Automatically updates `updated_at` timestamp on row update.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Initial Seed Data

### Seed admin user

```sql
-- Insert a super admin profile (after creating auth.user via Supabase Auth)
INSERT INTO profiles (user_id, role, email, first_name, last_name)
VALUES (
  'auth-user-id-from-supabase',
  'super_admin',
  'admin@nestassociates.com',
  'Admin',
  'User'
);
```

### Seed global content

```sql
INSERT INTO global_content (content_type, content_body, is_published, created_by_user_id)
VALUES
  ('header', '{"logo": "url", "nav": []}', true, 'admin-user-id'),
  ('footer', '{"links": [], "copyright": "© 2025 Nest Associates"}', true, 'admin-user-id'),
  ('privacy_policy', '<h1>Privacy Policy</h1><p>...</p>', true, 'admin-user-id'),
  ('terms_of_service', '<h1>Terms of Service</h1><p>...</p>', true, 'admin-user-id'),
  ('cookie_policy', '<h1>Cookie Policy</h1><p>...</p>', true, 'admin-user-id');
```

---

## Data Migration Plan

### Phase 1: Core Schema
1. Create `profiles` table
2. Create `agents` table
3. Seed admin user

### Phase 2: Content & Properties
1. Enable PostGIS extension
2. Create `properties` table
3. Create `territories` table
4. Create `content_submissions` table

### Phase 3: Build System
1. Create `build_queue` table
2. Create `global_content` table

### Phase 4: Audit & Compliance
1. Create `audit_logs` table
2. Create `contact_form_submissions` table

### Phase 5: RLS Policies
1. Enable RLS on all tables
2. Create policies for each table
3. Test policies with different user roles

---

## Database Backup & Recovery

**Backup Strategy**:
- **Automated Daily Backups**: Supabase Pro provides automatic daily backups with 30-day retention
- **Point-in-Time Recovery (PITR)**: Restore database to any point in last 7 days
- **Manual Backups**: Can trigger manual backup before major migrations

**Recovery Procedures**:
1. Identify failure point (timestamp)
2. Restore from PITR or latest backup
3. Verify data integrity
4. Re-run migrations if needed
5. Test critical flows (auth, property sync, builds)

---

## Performance Optimization

### Recommended Indexes (already included above)
- All foreign keys indexed
- Frequently queried columns indexed (status, email, postcode)
- Composite indexes for common query patterns
- Spatial indexes (GIST) for PostGIS columns
- Partial indexes for filtered queries (e.g., `is_featured = true`)

### Query Optimization Tips
- Use `EXPLAIN ANALYZE` to identify slow queries
- Avoid N+1 queries (use JOINs or batch fetches)
- Use database views for complex queries
- Consider materialized views for expensive aggregations
- Monitor slow query log in Supabase dashboard

---

## Next Steps

With the data model complete:
1. Generate API contracts based on these entities
2. Create TypeScript types matching this schema
3. Implement RLS policies in Supabase
4. Write database migrations
5. Seed initial data for development/testing
