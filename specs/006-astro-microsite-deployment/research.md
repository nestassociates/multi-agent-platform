# Research: Astro Agent Microsite Deployment System

**Feature**: 006-astro-microsite-deployment
**Date**: 2025-11-28
**Status**: Complete

## Executive Summary

This research documents the architecture decisions for the agent microsite deployment system. Each agent gets a static Astro site at their subdomain with content baked at build time, except for properties which are fetched client-side for freshness.

## 1. Existing Infrastructure Analysis

### 1.1 Build System Package

**Location**: `packages/build-system/src/`

**Current Components**:
- `data-generator.ts` - Generates `AgentSiteData` with agent profile, properties, content, global content
- `queue.ts` - Priority-based build queue with deduplication (5-min window)
- `types.ts` - TypeScript interfaces for build system

**Key Findings**:
- Data generator already fetches all required data (agent, properties, content, global)
- Queue supports priority levels (1=Emergency, 2=High, 3=Normal, 4=Low)
- Deduplication prevents redundant rebuilds within 5 minutes
- No section visibility flags currently - all sections always included

### 1.2 Global Content Table

**Location**: Supabase `global_content` table

**Schema** (existing):
```sql
CREATE TABLE global_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}',
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current Content Types**:
- `header` - Navigation structure
- `footer` - Footer columns and links
- `privacy_policy` - Legal HTML
- `terms_of_service` - Legal HTML
- `cookie_policy` - Legal HTML

**Gap**: No admin UI exists to manage this table.

### 1.3 Agent Site Template

**Location**: `apps/agent-site/`

**Current State**:
- Astro 4.x configured with React integration
- Basic page structure exists
- No dynamic data loading implemented
- Placeholder components only

## 2. Architecture Decisions

### 2.1 Static vs Dynamic Content

| Content Type | Decision | Rationale |
|--------------|----------|-----------|
| Agent Profile | **Static** (build-time) | Changes rarely, rebuild acceptable |
| Blog Posts | **Static** (build-time) | Content is curated, rebuild on approval |
| Area Guides | **Static** (build-time) | Content is curated, rebuild on approval |
| Fees | **Static** (build-time) | Changes rarely, rebuild acceptable |
| Properties | **Dynamic** (client-side) | Changes frequently from Apex27, must be fresh |
| GMB Reviews | **Dynamic** (client-side) | Third-party data, Google API handles freshness |

### 2.2 Section Visibility Logic

Sections are conditionally shown based on agent content availability:

```typescript
interface SectionVisibility {
  blog: boolean;       // Has ≥1 published blog post
  areaGuides: boolean; // Has ≥1 published area guide
  reviews: boolean;    // Has google_place_id configured
  fees: boolean;       // Has fee structure saved
  properties: boolean; // Always true (runtime fetch)
}
```

**Navigation Generation**:
- Navigation links only rendered for sections where `visibility[section] === true`
- Pages only generated in Astro build for enabled sections
- Uses Astro's `getStaticPaths()` to conditionally include pages

### 2.3 Rebuild Trigger Strategy

**Single-Agent Triggers** (queue single agent):
1. Content approval (blog_post, area_guide)
2. Profile update
3. Fees update
4. Agent activation

**All-Agent Triggers** (queue ALL active agents):
1. Global content publish (header, footer, legal pages)

**No Rebuild** (runtime fetch):
1. Property sync from Apex27
2. GMB review changes

### 2.4 Public API Design

**Namespace**: `/api/public/` for unauthenticated endpoints

**Endpoints**:

1. **GET `/api/public/agents/[id]/properties`**
   - Returns agent's available properties
   - Filters: `status=available`, `marketing_type` (optional)
   - Pagination: Cursor-based
   - Cache: 5 minutes (client-side)

2. **GET `/api/public/agents/[id]/info`**
   - Returns basic agent info for contact forms
   - Fields: name, email (optional), phone, avatar
   - No sensitive data exposed

3. **POST `/api/public/contact`**
   - Accepts contact form submissions
   - Validates: name, email, phone (optional), message, agent_id
   - Stores to `contact_form_submissions` table
   - Triggers notification (email via Resend)

## 3. Technology Research

### 3.1 Vercel Deployment API

**For Agent Site Deployments**:
- Use Vercel Deploy Hooks for triggered builds
- Each agent site = separate Vercel project
- Deploy hook URL stored per agent in database

**Alternative Considered**: Single multi-tenant site
- Rejected: Too complex routing, less isolation, harder caching

### 3.2 Astro Static Generation

**Conditional Page Generation**:
```typescript
// blog/index.astro
export async function getStaticPaths() {
  const data = await loadSiteData();
  // Return empty array if no blog posts = page not generated
  if (!data.sections.blog) return [];
  return [{ params: {} }];
}
```

**Client-Side React Islands**:
```astro
---
import PropertyList from '../components/PropertyList.tsx';
---
<PropertyList client:load agentId={data.agent.id} />
```

### 3.3 Contact Form Handling

**Security Measures**:
1. Rate limiting: 5 submissions per IP per hour
2. Honeypot field for bot detection
3. HTML sanitization on message content
4. CSRF protection via origin validation

**Storage**:
- `contact_form_submissions` table (existing)
- Links to agent via `agent_id`
- Optional property reference via `property_id`

## 4. Data Generator Enhancements

### 4.1 Current Output Structure

```typescript
interface AgentSiteData {
  agent: AgentProfile;
  properties: Property[];
  content: {
    blogPosts: BlogPost[];
    areaGuides: AreaGuide[];
  };
  globalContent: GlobalContent;
}
```

### 4.2 Enhanced Output Structure

```typescript
interface AgentSiteData {
  agent: AgentProfile;
  sections: SectionVisibility;  // NEW
  content: {
    blogPosts: BlogPost[];
    areaGuides: AreaGuide[];
    fees: string | null;        // HTML content
  };
  navigation: NavItem[];        // NEW - Generated from sections
  globalContent: GlobalContent;
  // Properties removed - fetched at runtime
}
```

### 4.3 Navigation Generation

```typescript
function generateNavigation(sections: SectionVisibility): NavItem[] {
  const nav: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Properties', href: '/properties' },  // Always shown
  ];

  if (sections.blog) nav.push({ label: 'Blog', href: '/blog' });
  if (sections.areaGuides) nav.push({ label: 'Area Guides', href: '/areas' });
  if (sections.reviews) nav.push({ label: 'Reviews', href: '/reviews' });
  if (sections.fees) nav.push({ label: 'Fees', href: '/fees' });

  nav.push({ label: 'Contact', href: '/contact' });
  return nav;
}
```

## 5. Global Content Admin UI

### 5.1 Content Type Management

**Admin Interface Requirements**:
- List all content types with publish status
- Edit each content type with preview
- Publish action triggers all-site rebuilds
- Version history (future enhancement)

**Content Editor**:
- Rich text editor for legal pages (TipTap)
- JSON editor for structured content (header, footer)
- Preview pane showing rendered output

### 5.2 Publish Flow

```
Edit Content → Save Draft → Preview → Publish
                                        ↓
                              Queue ALL agent rebuilds
                                        ↓
                              Process builds (batched)
```

## 6. Testing Strategy

### 6.1 Unit Tests

- Data generator produces correct section flags
- Navigation generation logic
- Contact form validation
- API response formatting

### 6.2 Integration Tests

- Global content publish queues all agents
- Single-agent triggers queue only that agent
- Deduplication prevents redundant builds

### 6.3 E2E Tests

- Agent with no blogs → no /blog page in sitemap
- Agent with blogs → /blog page accessible
- Property fetch works on live static site
- Contact form submits and stores correctly

## 7. Blocked Dependencies

### 7.1 Figma Design Templates (BLOCKED)

**Status**: Waiting for external designer
**Impact**: Cannot implement Astro page templates
**Workaround**: Backend work can proceed in parallel

**Can Proceed Without Figma**:
- Public API endpoints
- Global content admin UI
- Data generator enhancements
- Build queue modifications

**Blocked Until Figma**:
- Astro page layouts
- Component styling
- Responsive design
- Final visual integration

## 8. Open Questions (Resolved)

| Question | Decision |
|----------|----------|
| Same design for all agents? | Yes - brand consistency, conditional sections |
| Properties static or dynamic? | Dynamic - always fresh, no rebuild on sync |
| What triggers all-site rebuild? | Global content publish only |
| Empty sections behavior? | Hide entirely (nav link and page) |
| Properties API structure? | Agent-specific: `/api/public/agents/[id]/properties` |

## 9. Recommendations

1. **Implement backend first** - API endpoints, admin UI, data generator can proceed without Figma
2. **Use feature flags** - Enable gradual rollout when Astro templates ready
3. **Monitor build queue** - Ensure global content rebuilds don't overwhelm system
4. **Cache API responses** - 5-minute cache on properties endpoint reduces load

## References

- [Astro Documentation](https://docs.astro.build/)
- [Vercel Deploy Hooks](https://vercel.com/docs/deploy-hooks)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
