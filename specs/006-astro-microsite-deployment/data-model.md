# Data Model: Astro Agent Microsite Deployment System

**Feature**: 006-astro-microsite-deployment
**Date**: 2025-11-28
**Status**: Complete

## 1. Entity Overview

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│     agents      │──────│    profiles     │──────│   agent_fees    │
│   (existing)    │ 1:1  │   (existing)    │ 1:1  │   (existing)    │
└────────┬────────┘      └─────────────────┘      └─────────────────┘
         │
         │ 1:n
         ▼
┌─────────────────┐      ┌─────────────────┐
│content_submissions│    │ global_content  │
│   (existing)    │      │   (existing)    │
└────────┬────────┘      └─────────────────┘
         │                        │
         │ 1:n                    │ (all agents)
         ▼                        │
┌─────────────────┐              │
│  build_queue    │◄─────────────┘
│   (existing)    │
└────────┬────────┘
         │
         │ triggers
         ▼
┌─────────────────┐
│contact_form_    │
│  submissions    │
│   (existing)    │
└─────────────────┘
```

## 2. Existing Tables (No Changes Required)

### 2.1 agents
Primary agent entity with status and subdomain.

```sql
-- Relevant columns for this feature
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  subdomain TEXT UNIQUE,           -- Agent's site subdomain
  status TEXT DEFAULT 'pending',   -- active, pending, suspended, deactivated
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 profiles
Agent profile information baked into site at build time.

```sql
-- Relevant columns for this feature
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  google_place_id TEXT,            -- For GMB reviews widget
  qualifications JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 agent_fees
Fee structure HTML baked into site at build time.

```sql
-- Relevant columns for this feature
CREATE TABLE agent_fees (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agents(id),
  content TEXT,                    -- HTML content from TipTap
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.4 content_submissions
Blog posts and area guides baked at build time.

```sql
-- Relevant columns for this feature
CREATE TABLE content_submissions (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agents(id),
  content_type TEXT,               -- 'blog_post' | 'area_guide'
  status TEXT,                     -- 'draft' | 'pending' | 'approved' | 'rejected'
  title TEXT,
  slug TEXT,
  content TEXT,                    -- HTML content
  featured_image_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.5 global_content
Admin-controlled content triggering all-site rebuilds.

```sql
-- Existing table
CREATE TABLE global_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}',
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content types:
-- 'header' - { navigation: [...], logo: {...}, cta: {...} }
-- 'footer' - { columns: [...], contact: {...}, social: [...] }
-- 'privacy_policy' - { html: "..." }
-- 'terms_of_service' - { html: "..." }
-- 'cookie_policy' - { html: "..." }
```

### 2.6 build_queue
Priority-based build queue for agent site rebuilds.

```sql
-- Existing table
CREATE TABLE build_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  priority INTEGER DEFAULT 3,      -- 1=Emergency, 2=High, 3=Normal, 4=Low
  trigger_reason TEXT,             -- 'content_approval', 'profile_update', 'global_content'
  status TEXT DEFAULT 'pending',   -- 'pending', 'processing', 'completed', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT
);
```

### 2.7 contact_form_submissions
Stores contact form submissions from agent sites.

```sql
-- Existing table
CREATE TABLE contact_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  property_id UUID REFERENCES properties(id),  -- Optional
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3. TypeScript Interfaces

### 3.1 Agent Site Data (Enhanced)

```typescript
// packages/build-system/src/types.ts

export interface SectionVisibility {
  blog: boolean;
  areaGuides: boolean;
  reviews: boolean;
  fees: boolean;
  properties: boolean;  // Always true
}

export interface NavItem {
  label: string;
  href: string;
}

export interface AgentSiteData {
  agent: {
    id: string;
    subdomain: string;
    name: string;
    bio: string | null;
    avatarUrl: string | null;
    phone: string | null;
    email: string | null;
    googlePlaceId: string | null;
    qualifications: string[];
  };
  sections: SectionVisibility;
  navigation: NavItem[];
  content: {
    blogPosts: BlogPostData[];
    areaGuides: AreaGuideData[];
    fees: string | null;  // HTML
  };
  globalContent: {
    header: HeaderContent;
    footer: FooterContent;
    privacyPolicy: string;
    termsOfService: string;
    cookiePolicy: string;
  };
  meta: {
    generatedAt: string;
    buildVersion: string;
  };
}
```

### 3.2 Blog Post Data

```typescript
export interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;  // HTML
  featuredImageUrl: string | null;
  publishedAt: string;
}
```

### 3.3 Area Guide Data

```typescript
export interface AreaGuideData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;  // HTML
  featuredImageUrl: string | null;
  publishedAt: string;
}
```

### 3.4 Global Content Structures

```typescript
export interface HeaderContent {
  logo: {
    url: string;
    alt: string;
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

export interface FooterContent {
  columns: {
    title: string;
    links: {
      label: string;
      href: string;
    }[];
  }[];
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  social: {
    platform: string;
    url: string;
  }[];
  copyright: string;
}
```

## 4. Public API Response Types

### 4.1 Properties Endpoint Response

```typescript
// GET /api/public/agents/[id]/properties

export interface PublicPropertyResponse {
  data: PublicProperty[];
  pagination: {
    nextCursor: string | null;
    hasNextPage: boolean;
    total: number;
  };
}

export interface PublicProperty {
  id: string;
  apex27Id: string;
  marketingType: 'sale' | 'rent';
  price: number;
  priceQualifier: string | null;
  address: {
    line1: string;
    line2: string | null;
    city: string;
    postcode: string;
  };
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  summary: string;
  images: {
    url: string;
    caption: string | null;
  }[];
  features: string[];
  status: string;
  createdAt: string;
}
```

### 4.2 Agent Info Response

```typescript
// GET /api/public/agents/[id]/info

export interface PublicAgentInfoResponse {
  id: string;
  name: string;
  avatarUrl: string | null;
  phone: string | null;
  subdomain: string;
}
```

### 4.3 Contact Form Submission

```typescript
// POST /api/public/contact

export interface ContactFormRequest {
  agentId: string;
  propertyId?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  honeypot?: string;  // Should be empty (bot detection)
}

export interface ContactFormResponse {
  success: boolean;
  message: string;
}
```

## 5. Section Visibility Logic

### 5.1 Determination Rules

```typescript
function determineSectionVisibility(
  agent: Agent,
  profile: Profile,
  blogPosts: ContentSubmission[],
  areaGuides: ContentSubmission[],
  fees: AgentFee | null
): SectionVisibility {
  return {
    blog: blogPosts.filter(p => p.status === 'approved').length > 0,
    areaGuides: areaGuides.filter(g => g.status === 'approved').length > 0,
    reviews: !!profile.google_place_id,
    fees: !!fees?.content,
    properties: true,  // Always shown - runtime fetch
  };
}
```

### 5.2 Navigation Generation

```typescript
function generateNavigation(sections: SectionVisibility): NavItem[] {
  const nav: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Properties', href: '/properties' },
  ];

  if (sections.blog) {
    nav.push({ label: 'Blog', href: '/blog' });
  }
  if (sections.areaGuides) {
    nav.push({ label: 'Area Guides', href: '/areas' });
  }
  if (sections.reviews) {
    nav.push({ label: 'Reviews', href: '/reviews' });
  }
  if (sections.fees) {
    nav.push({ label: 'Fees', href: '/fees' });
  }

  nav.push({ label: 'Contact', href: '/contact' });

  return nav;
}
```

## 6. Build Queue Trigger Events

### 6.1 Single-Agent Rebuild Triggers

| Event | Priority | Trigger Reason |
|-------|----------|----------------|
| Blog post approved | 3 (Normal) | `content_approval` |
| Area guide approved | 3 (Normal) | `content_approval` |
| Profile updated | 4 (Low) | `profile_update` |
| Fees updated | 4 (Low) | `fees_update` |
| Agent activated | 2 (High) | `agent_activation` |

### 6.2 All-Agent Rebuild Trigger

| Event | Priority | Trigger Reason |
|-------|----------|----------------|
| Global content published | 1 (Emergency) | `global_content` |

### 6.3 Queue Function Enhancement

```typescript
// packages/build-system/src/queue.ts

export async function queueGlobalContentRebuild(
  supabase: SupabaseClient,
  contentType: string
): Promise<void> {
  // Get all active agents
  const { data: agents } = await supabase
    .from('agents')
    .select('id')
    .eq('status', 'active');

  if (!agents?.length) return;

  // Queue rebuild for each agent with emergency priority
  const builds = agents.map(agent => ({
    agent_id: agent.id,
    priority: 1,  // Emergency
    trigger_reason: `global_content:${contentType}`,
    status: 'pending',
  }));

  await supabase.from('build_queue').insert(builds);
}
```

## 7. Data Migration

No database migrations required - all tables exist.

### 7.1 Global Content Seed Data

If global_content table is empty, seed with defaults:

```sql
INSERT INTO global_content (content_type, content, is_published) VALUES
('header', '{
  "logo": {"url": "/logo.svg", "alt": "Nest Associates"},
  "navigation": [],
  "cta": {"label": "Get Started", "href": "/contact"}
}', true),
('footer', '{
  "columns": [],
  "contact": {"email": "", "phone": "", "address": ""},
  "social": [],
  "copyright": "© 2024 Nest Associates. All rights reserved."
}', true),
('privacy_policy', '{"html": "<h1>Privacy Policy</h1><p>Coming soon.</p>"}', true),
('terms_of_service', '{"html": "<h1>Terms of Service</h1><p>Coming soon.</p>"}', true),
('cookie_policy', '{"html": "<h1>Cookie Policy</h1><p>Coming soon.</p>"}', true)
ON CONFLICT (content_type) DO NOTHING;
```

## 8. Validation Schemas

### 8.1 Contact Form Validation

```typescript
// packages/validation/src/contact.ts
import { z } from 'zod';

export const contactFormSchema = z.object({
  agentId: z.string().uuid(),
  propertyId: z.string().uuid().optional(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  message: z.string().min(10).max(2000),
  honeypot: z.string().max(0).optional(),  // Must be empty
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
```

### 8.2 Global Content Validation

```typescript
// packages/validation/src/global-content.ts
import { z } from 'zod';

export const headerContentSchema = z.object({
  logo: z.object({
    url: z.string().url(),
    alt: z.string(),
  }),
  navigation: z.array(z.object({
    label: z.string(),
    href: z.string(),
  })),
  cta: z.object({
    label: z.string(),
    href: z.string(),
  }).nullable(),
});

export const footerContentSchema = z.object({
  columns: z.array(z.object({
    title: z.string(),
    links: z.array(z.object({
      label: z.string(),
      href: z.string(),
    })),
  })),
  contact: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
  social: z.array(z.object({
    platform: z.string(),
    url: z.string().url(),
  })),
  copyright: z.string(),
});

export const legalContentSchema = z.object({
  html: z.string(),
});
```
