# Feature Specification: Astro Agent Microsite Deployment System

**Feature Branch**: `006-astro-microsite-deployment`
**Created**: 2025-11-28
**Status**: Draft
**Input**: User description: "Astro Agent Microsite Deployment System - Build the static site generation and deployment pipeline for agent microsites. Each agent gets their own Astro static site at a subdomain. Properties are fetched client-side (always fresh). Blog posts, area guides, fees, and profile are baked at build time. Sections hide entirely if agent has no content. Global content (header, footer, legal pages) is admin-controlled and triggers all-site rebuilds when published. Build queue processes rebuilds triggered by content approval, profile updates, or global content changes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Agent Site Visitor Views Property Listings (Priority: P1)

A potential home buyer visits an agent's microsite to browse available properties. They can filter and search properties, view detailed listings with photos, and contact the agent about properties of interest.

**Why this priority**: Property listings are the core value proposition - visitors come to see what properties the agent has available. Without working property display, the site has no purpose.

**Independent Test**: Can be fully tested by loading an agent's property page and verifying properties display correctly with filtering, delivering immediate value to site visitors.

**Acceptance Scenarios**:

1. **Given** a visitor lands on agent's property listing page, **When** the page loads, **Then** all available properties for that agent display with photos, price, bedrooms, and location
2. **Given** properties are displayed, **When** visitor filters by price range or bedrooms, **Then** only matching properties show
3. **Given** a new property is added in Apex27, **When** visitor refreshes the property page, **Then** the new property appears without requiring a site rebuild
4. **Given** visitor clicks a property, **When** property detail page loads, **Then** full property information displays including gallery, description, and contact form

---

### User Story 2 - Agent Content Gets Published to Their Site (Priority: P1)

An agent writes a blog post or area guide in the dashboard. After admin approval, the content automatically appears on their microsite without manual intervention.

**Why this priority**: Content publishing is the primary workflow for agents to add value to their sites. The automated build pipeline is the core technical capability of this feature.

**Independent Test**: Can be fully tested by creating content, approving it, and verifying it appears on the live agent site.

**Acceptance Scenarios**:

1. **Given** an agent has a draft blog post, **When** admin approves the content, **Then** a site rebuild is automatically triggered
2. **Given** rebuild is triggered, **When** build completes successfully, **Then** the blog post appears on the agent's live site at their subdomain
3. **Given** agent has no published blog posts, **When** their site builds, **Then** the Blog navigation link is hidden entirely
4. **Given** agent publishes their first blog post, **When** site rebuilds, **Then** the Blog navigation link appears

---

### User Story 3 - Admin Manages Global Site Content (Priority: P2)

An administrator updates shared content like the header navigation, footer, or legal pages (privacy policy, terms of service). These changes propagate to all agent sites.

**Why this priority**: Global content ensures brand consistency and legal compliance across all sites. Less frequent than agent content but affects all sites.

**Independent Test**: Can be tested by editing global footer content and verifying it appears on multiple agent sites after rebuild.

**Acceptance Scenarios**:

1. **Given** admin is on global content management page, **When** they edit the footer content, **Then** changes are saved as draft
2. **Given** admin has edited global content, **When** they publish changes, **Then** rebuild jobs are queued for ALL active agents
3. **Given** global content rebuild is triggered, **When** all builds complete, **Then** every agent site displays the updated footer
4. **Given** admin edits privacy policy, **When** published and rebuilt, **Then** all agent sites show updated privacy policy page

---

### User Story 4 - Site Visitor Contacts Agent (Priority: P2)

A visitor on an agent's microsite wants to inquire about a property or service. They fill out the contact form and the agent receives the inquiry.

**Why this priority**: Lead capture is essential for business value, but the site can function for browsing without it.

**Independent Test**: Can be tested by submitting a contact form and verifying the submission is recorded and agent notified.

**Acceptance Scenarios**:

1. **Given** visitor is on contact page, **When** they fill in name, email, phone, and message, **Then** they can submit the form
2. **Given** form is submitted, **When** submission is processed, **Then** visitor sees confirmation message
3. **Given** valid submission, **When** processed, **Then** submission is stored and agent receives notification
4. **Given** visitor submits with invalid email, **When** form validates, **Then** error message displays and submission is prevented

---

### User Story 5 - Agent Profile and Fees Display (Priority: P3)

An agent's personal branding, bio, qualifications, and fee structure display on their microsite, giving visitors confidence in the agent's expertise.

**Why this priority**: Profile content enhances trust but site can function without complete profile information.

**Independent Test**: Can be tested by updating agent profile/fees in dashboard and verifying changes appear on site after rebuild.

**Acceptance Scenarios**:

1. **Given** agent has complete profile, **When** their site loads, **Then** about page shows bio, photo, qualifications, and contact details
2. **Given** agent has saved fee structure, **When** site builds, **Then** fees page is included with Fees link in navigation
3. **Given** agent has no fee structure saved, **When** site builds, **Then** fees page and navigation link are hidden
4. **Given** agent updates their bio, **When** profile save triggers rebuild, **Then** updated bio appears on live site

---

### Edge Cases

- What happens when a build fails? Build is marked failed, agent site remains on previous version, admin is notified
- What happens when agent is deactivated? Site deployment is removed, subdomain returns 404
- What happens when 50+ agents need rebuilding simultaneously (global content change)? Build queue processes in batches with priority ordering
- What happens when agent has no published content at all? Site still builds with homepage, about, services, properties, and contact pages
- What happens when property images fail to load? Placeholder image shown, property still displays
- What happens when Google Reviews API is unavailable? Reviews section gracefully degrades with message

## Requirements *(mandatory)*

### Functional Requirements

**Site Generation & Deployment**
- **FR-001**: System MUST generate a static site for each active agent at their configured subdomain
- **FR-002**: System MUST include conditional navigation based on agent's available content (blog, area guides, reviews, fees)
- **FR-003**: System MUST bake agent profile, published blog posts, published area guides, and fee structure into static HTML at build time
- **FR-004**: System MUST fetch properties dynamically via client-side request (not baked at build time)
- **FR-005**: System MUST deploy completed builds to agent's subdomain within 60 seconds of build completion

**Build Queue & Triggers**
- **FR-006**: System MUST queue a rebuild when agent content is approved
- **FR-007**: System MUST queue a rebuild when agent profile is updated
- **FR-008**: System MUST queue a rebuild when agent fees are updated
- **FR-009**: System MUST queue rebuilds for ALL active agents when global content is published
- **FR-010**: System MUST NOT queue rebuild when properties sync from Apex27 (properties are fetched at runtime)
- **FR-011**: System MUST process build queue with priority ordering (global content > content approval > profile updates)
- **FR-012**: System MUST handle up to 20 concurrent builds without failure

**Global Content Management**
- **FR-013**: System MUST allow admins to edit header template (navigation links, logo, CTA)
- **FR-014**: System MUST allow admins to edit footer template (columns, contact info, social links)
- **FR-015**: System MUST allow admins to edit legal pages (privacy policy, terms of service, cookie policy)
- **FR-016**: System MUST support draft/published states for global content
- **FR-017**: System MUST include all published global content in every agent site build

**Public API**
- **FR-018**: System MUST provide public endpoint for fetching agent's properties (for client-side loading)
- **FR-019**: System MUST provide public endpoint for contact form submissions
- **FR-020**: System MUST validate and sanitize all contact form submissions

**Content Visibility**
- **FR-021**: System MUST hide Blog navigation and pages when agent has zero published blog posts
- **FR-022**: System MUST hide Area Guides navigation and pages when agent has zero published area guides
- **FR-023**: System MUST hide Reviews navigation and page when agent has no Google My Business Place ID configured
- **FR-024**: System MUST hide Fees navigation and page when agent has no fee structure saved
- **FR-025**: System MUST always show Properties section (data is fetched at runtime)

### Key Entities

- **Agent Site Configuration**: Determines which sections to display based on content availability, links agent to their subdomain and content
- **Global Content**: Shared templates and legal pages managed by admins, versioned with draft/published states
- **Build Job**: Represents a queued or in-progress site generation, tracks status, priority, trigger reason, and result
- **Contact Submission**: Visitor inquiry captured from agent site contact form, associated with agent

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Agent sites load completely in under 2 seconds on standard mobile connection (3G)
- **SC-002**: Site builds complete in under 45 seconds from trigger to deployment
- **SC-003**: System processes global content updates affecting 100+ agents within 30 minutes
- **SC-004**: Properties display current data (less than 5 minutes old) without requiring site rebuild
- **SC-005**: 100% of approved content appears on agent sites within 5 minutes of approval
- **SC-006**: Zero manual intervention required for content-to-site publishing workflow
- **SC-007**: Contact form submissions have 99.9% delivery rate to storage

## Assumptions

- Agents already exist in the system with profiles and optional content
- Apex27 property sync is already functioning and properties are in the database
- Content submission and approval workflow already exists
- Vercel is the deployment target for agent sites
- Supabase is the database and storage backend
- Figma designs for agent site templates are provided by external designer (blocked dependency)

## Scope

### In Scope
- Static site generation pipeline for agent microsites
- Build queue with priority processing
- Global content management admin interface
- Public API endpoints for properties and contact forms
- Conditional navigation based on content availability
- Client-side property fetching

### Out of Scope
- Agent site visual design (depends on Figma templates from designer)
- Custom theming per agent (all sites use same design)
- Property search with map view (future enhancement)
- Analytics tracking implementation (separate feature)
- A/B testing for content variants
- Multi-language support

## Dependencies

- **Blocked**: Figma design templates from external designer (required for Astro template implementation)
- **Required**: Existing content submission system (features 003, 005)
- **Required**: Existing agent management system (feature 004)
- **Required**: Apex27 property sync (feature 002)
- **Required**: Vercel account with API access for deployments
