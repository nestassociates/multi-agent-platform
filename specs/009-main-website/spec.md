# Feature Specification: Nest Associates Main Website

**Feature Branch**: `009-main-website`
**Created**: 2025-12-18
**Status**: Draft
**Input**: Public marketing website for Nest Associates serving property buyers, renters, sellers, landlords, and prospective agents.

## Clarifications

### Session 2025-12-18

- Q: What level of privacy/GDPR compliance features should be included? → A: Standard - Cookie consent banner, privacy policy, data retention disclosure
- Q: Where should form submissions be sent/stored? → A: CRM integration - All forms (Sell, Landlords, Contact, Join, agent contact) push to Apex27 CRM
- Q: How should Google reviews be ingested into the system? → A: Phase 1: Manual CMS entry via admin form. Phase 2 (future): Automated Google Places API integration
- Q: What level of SEO optimization should be built in? → A: Standard (XML sitemap, Open Graph, schema.org for properties) plus breadcrumbs markup for navigation (even if not in Figma designs)
- Q: Should the site include analytics tracking? → A: Google Analytics 4 (respecting cookie consent)

## Overview

The Nest Associates main website (nestassociates.co.uk) serves as the primary public-facing digital presence for the brand. It enables property searching, lead generation, agent discovery, content marketing, and buyer registration for property alerts.

**Key Audiences:**
- Property buyers and renters searching for homes
- Property sellers and landlords seeking agent services
- Prospective agents interested in joining the network
- General visitors seeking information about Nest Associates

**Data Sources:**
- Property and agent data fetched from existing dashboard API (`/api/public/properties`, `/api/public/agents`)
- Blog content managed via integrated CMS (internal marketing team only)
- Buyer registrations submitted to Apex27 CRM
- Reviews from Google (with ingestion) and agent-submitted content

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Property Search and Discovery (Priority: P1)

A property buyer or renter visits the website to find available properties. They can browse listings, filter by criteria, and view detailed property information including photos, features, price, and the assigned agent.

**Why this priority**: Property search is the core value proposition - without it, the site has no primary purpose. This drives traffic and leads.

**Independent Test**: Can be fully tested by navigating to Buy or Rent pages, applying filters, and viewing property details. Delivers immediate value by enabling property discovery.

**Acceptance Scenarios**:

1. **Given** a visitor on the homepage, **When** they click "Buy" or "Rent", **Then** they see a list of available properties with key details (image, price, location, bedrooms, bathrooms)
2. **Given** a visitor on property listings, **When** they apply filters (location, price range, bedrooms), **Then** the results update to show only matching properties
3. **Given** a visitor viewing listings, **When** they click a property card, **Then** they see a detailed property page with full gallery, description, features, agent info, and contact options
4. **Given** a property detail page, **When** the property is sold/let, **Then** a "SOLD" or "LET" badge is displayed on the image

---

### User Story 2 - Seller/Landlord Lead Generation (Priority: P2)

A property owner wanting to sell or let their property visits the dedicated pages to learn about Nest Associates services and submit their details for a valuation or consultation.

**Why this priority**: Lead generation is the primary revenue driver - converting visitors to clients is essential for business growth.

**Independent Test**: Can be tested by visiting Sell or Landlords pages, completing the enquiry form, and verifying submission is received.

**Acceptance Scenarios**:

1. **Given** a visitor on the Sell page, **When** they view the content, **Then** they see compelling information about selling with Nest Associates and a clear call-to-action
2. **Given** a visitor on the Sell or Landlords page, **When** they complete and submit the enquiry form, **Then** they receive confirmation and the lead is captured for follow-up
3. **Given** an incomplete form submission, **When** the visitor tries to submit, **Then** they see clear validation messages indicating required fields

---

### User Story 3 - Agent Directory and Contact (Priority: P3)

A visitor wants to find and contact a specific agent or browse available agents in their area. They can view agent profiles and reach out directly.

**Why this priority**: Agents are the face of Nest Associates - showcasing them builds trust and enables direct contact.

**Independent Test**: Can be tested by browsing the Agents page, viewing individual agent profiles, and using contact forms.

**Acceptance Scenarios**:

1. **Given** a visitor on the Agents page, **When** they browse the directory, **Then** they see agent cards with photo, name, location/territory, and contact options
2. **Given** a visitor viewing an agent card, **When** they click to view more, **Then** they see the agent's full profile including bio, reviews, and their current listings
3. **Given** an agent profile, **When** the visitor clicks contact options, **Then** they can call, email, or submit a contact form to that specific agent

---

### User Story 4 - General Contact (Priority: P3)

A visitor wants to contact Nest Associates with a general enquiry not specific to selling, letting, or a particular agent.

**Why this priority**: Provides a catch-all for enquiries and builds accessibility/trust.

**Independent Test**: Can be tested by visiting Contact page and submitting an enquiry.

**Acceptance Scenarios**:

1. **Given** a visitor on the Contact page, **When** they view the page, **Then** they see contact form, office address, phone number, and email
2. **Given** a visitor completing the contact form, **When** they submit, **Then** they receive confirmation and the enquiry is routed appropriately

---

### User Story 5 - Blog/Journal Reading (Priority: P4)

A visitor reads blog articles about property market insights, buying/selling tips, local area information, or company news.

**Why this priority**: Content marketing drives SEO traffic and establishes thought leadership, but is not essential for core transactions.

**Independent Test**: Can be tested by browsing Journal page, reading articles, and navigating between posts.

**Acceptance Scenarios**:

1. **Given** a visitor on the Journal page, **When** they browse articles, **Then** they see a list of blog posts with featured image, title, excerpt, date, and category
2. **Given** a visitor clicking an article, **When** the page loads, **Then** they see the full article with rich content, images, and related posts
3. **Given** articles exist in multiple categories, **When** a visitor filters by category, **Then** only matching articles are displayed

---

### User Story 6 - Agent Recruitment (Priority: P4)

A prospective agent interested in joining Nest Associates can learn about the opportunity and submit an application.

**Why this priority**: Agent recruitment grows the network but is lower volume than customer-facing features.

**Independent Test**: Can be tested by visiting Join page and submitting an application form.

**Acceptance Scenarios**:

1. **Given** a visitor on the Join page, **When** they view the content, **Then** they see benefits of joining, requirements, and an application form
2. **Given** a prospective agent completing the application, **When** they submit, **Then** they receive confirmation and the application is captured for review

---

### User Story 7 - Buyer Property Alert Registration (Priority: P5)

A property buyer registers their details and preferences to receive alerts when matching properties become available. This integrates with Apex27 CRM.

**Why this priority**: Valuable for engagement but secondary to active property searching.

**Independent Test**: Can be tested by visiting Register page, completing preferences, and verifying data reaches Apex27.

**Acceptance Scenarios**:

1. **Given** a visitor on the Register page, **When** they view the form, **Then** they see fields for contact details and property preferences (location, type, budget, bedrooms)
2. **Given** a buyer completing registration, **When** they submit, **Then** their details are sent to Apex27 CRM and they receive confirmation
3. **Given** invalid or incomplete data, **When** submission is attempted, **Then** clear validation errors guide the user

---

### User Story 8 - Reviews Viewing (Priority: P5)

A visitor views testimonials and reviews from satisfied clients to build trust in Nest Associates and its agents.

**Why this priority**: Social proof is important but supporting rather than primary functionality.

**Independent Test**: Can be tested by visiting Reviews page and viewing testimonials.

**Acceptance Scenarios**:

1. **Given** a visitor on the Reviews page, **When** they view the content, **Then** they see curated reviews with ratings, text, and attribution
2. **Given** reviews from multiple sources (Google, agent-submitted), **When** displayed, **Then** the source is indicated appropriately

---

### User Story 9 - CMS Content Management (Priority: P6)

An internal marketing team member logs into the admin panel to create, edit, and publish blog posts and curated reviews.

**Why this priority**: Backend functionality that enables P4 and P5 stories.

**Independent Test**: Can be tested by admin logging in, creating a post, and verifying it appears on public site.

**Acceptance Scenarios**:

1. **Given** an admin user, **When** they access /admin, **Then** they can log in with their credentials
2. **Given** a logged-in admin, **When** they create a new blog post with title, content, image, and category, **Then** they can save as draft or publish
3. **Given** a published post, **When** a visitor browses the Journal, **Then** the post appears in listings

---

### User Story 10 - Static Information Pages (Priority: P6)

Visitors can access About, Policies, and Area Guides (hidden) pages for company information and legal requirements.

**Why this priority**: Supporting content that builds trust and meets legal requirements.

**Independent Test**: Can be tested by navigating to About and Policies pages.

**Acceptance Scenarios**:

1. **Given** a visitor clicking About, **When** the page loads, **Then** they see company information, values, and history
2. **Given** a visitor clicking Policies, **When** the page loads, **Then** they can access Privacy Policy, Terms of Service, and Cookie Policy
3. **Given** Area Guides is hidden, **When** a visitor navigates the site, **Then** the Area Guides link is not visible in navigation

---

### Edge Cases

- What happens when no properties match the search criteria? Display friendly "no results" message with suggestions
- What happens when the dashboard API is unavailable? Display cached data if available, or graceful error message
- What happens when an agent has no current listings? Show agent profile without listings section
- What happens when a property is removed while a user is viewing it? Show "property no longer available" message
- How does the site handle very long property descriptions? Truncate with "read more" expansion
- What happens when Apex27 registration fails? Show error message and offer alternative contact method

## Requirements *(mandatory)*

### Functional Requirements

**Property Listings:**
- **FR-001**: System MUST display property listings from the dashboard API with image, price, location, bedrooms, bathrooms, and property type
- **FR-002**: System MUST provide filtering by sale/rent status, location, price range, bedrooms, and property type
- **FR-003**: System MUST display individual property detail pages with full image gallery, description, features list, location, and assigned agent
- **FR-004**: System MUST indicate property status (available, sold, let, under offer) visually

**Lead Generation:**
- **FR-005**: System MUST provide enquiry forms on Sell and Landlords pages capturing name, email, phone, property details, and message
- **FR-006**: System MUST validate form inputs and display clear error messages
- **FR-007**: System MUST send confirmation to users upon successful form submission
- **FR-007a**: System MUST submit all lead form data (Sell, Landlords) to Apex27 CRM

**Agent Directory:**
- **FR-008**: System MUST display all active agents from the dashboard API with photo, name, and territory
- **FR-009**: System MUST provide individual agent profile pages with bio, contact details, reviews, and current listings
- **FR-010**: System MUST enable direct contact with agents via phone, email link, and contact form

**Contact:**
- **FR-011**: System MUST provide a general contact page with form, address, phone, and email
- **FR-012**: System MUST submit contact form data to Apex27 CRM
- **FR-012a**: System MUST submit agent-specific contact form data to Apex27 CRM (tagged with agent identifier)

**Blog/Journal:**
- **FR-013**: System MUST display blog posts with featured image, title, excerpt, date, author, and category
- **FR-014**: System MUST provide individual article pages with full rich-text content
- **FR-015**: System MUST support filtering articles by category

**Registration:**
- **FR-016**: System MUST provide buyer registration form with contact details and property preferences
- **FR-017**: System MUST submit registration data to Apex27 CRM
- **FR-018**: System MUST confirm successful registration to users

**Agent Recruitment:**
- **FR-018a**: System MUST provide agent application form on Join page
- **FR-018b**: System MUST submit agent applications to Apex27 CRM

**Reviews:**
- **FR-019**: System MUST display curated reviews with rating, text, date, and source attribution
- **FR-020**: System MUST provide CMS interface for manually entering Google reviews (source marked as "Google")
- **FR-020a**: System MUST support agent-submitted reviews managed via CMS
- **FR-020b**: (Future) System SHOULD support automated Google Places API integration for review ingestion

**CMS Administration:**
- **FR-021**: System MUST provide admin interface for creating and editing blog posts
- **FR-022**: System MUST support rich-text editing with images for blog content
- **FR-023**: System MUST allow posts to be saved as draft or published
- **FR-024**: System MUST restrict admin access to authorized users only

**Navigation & Structure:**
- **FR-025**: System MUST provide consistent navigation across all pages (Home, Buy, Rent, Sell, Landlords, Agents, Join, Journal, About, Review, Policies, Register, Contact)
- **FR-026**: System MUST hide Area Guides from navigation (feature flagged for future)
- **FR-027**: System MUST be fully responsive across desktop, tablet, and mobile devices
- **FR-028**: System MUST follow the design language from provided Figma mockups

**Privacy & Compliance (GDPR):**
- **FR-029**: System MUST display a cookie consent banner on first visit allowing users to accept/reject non-essential cookies
- **FR-030**: System MUST provide a Privacy Policy page explaining data collection, usage, and retention
- **FR-031**: System MUST disclose data retention periods for form submissions
- **FR-032**: System MUST only set non-essential cookies (analytics, marketing) after user consent

**SEO & Discoverability:**
- **FR-033**: System MUST generate XML sitemap including all public pages and property listings
- **FR-034**: System MUST include Open Graph meta tags for social sharing on all pages
- **FR-035**: System MUST include schema.org structured data for properties (RealEstateListing)
- **FR-036**: System MUST include schema.org structured data for agents (RealEstateAgent)
- **FR-037**: System MUST include breadcrumb navigation with schema.org BreadcrumbList markup
- **FR-038**: System MUST provide unique, descriptive meta titles and descriptions per page

**Analytics:**
- **FR-039**: System MUST integrate Google Analytics 4 for visitor tracking
- **FR-040**: System MUST only load GA4 tracking after user consents to analytics cookies

### Key Entities

- **Property**: Listing with images, price, location, features, status, and assigned agent. Sourced from dashboard API.
- **Agent**: Team member with profile photo, bio, contact details, territory, and associated listings. Sourced from dashboard API.
- **Blog Post**: Article with title, content, featured image, category, author, publish date, and status (draft/published). Managed via CMS.
- **Review**: Testimonial with rating, text, date, reviewer name, and source (Google/agent). Managed via CMS.
- **Lead**: Enquiry submission with contact details, property interest, and message. Captured via forms.
- **Buyer Registration**: Property alert signup with contact details and preferences. Sent to Apex27.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Visitors can find and view a property listing within 3 clicks from the homepage
- **SC-002**: Property search results load within 2 seconds
- **SC-003**: All forms can be completed in under 2 minutes
- **SC-004**: Site is fully functional on devices with screen widths from 320px to 2560px
- **SC-005**: 95% of page loads complete within 3 seconds on standard broadband
- **SC-006**: Contact form submissions result in confirmation within 5 seconds
- **SC-007**: Admin users can create and publish a blog post within 5 minutes
- **SC-008**: All property and agent data displayed matches the dashboard source
- **SC-009**: Site navigation allows access to all pages within 2 clicks from any page
- **SC-010**: All form submissions (leads, contact, registration, applications) successfully transmit to Apex27 CRM in 100% of valid submissions

## Assumptions

- Dashboard API endpoints (`/api/public/properties`, `/api/public/agents`) are available and documented
- Apex27 CRM has API endpoints for all form types: buyer registration, seller/landlord leads, general contact, agent contact, and agent recruitment applications
- Google review ingestion mechanism exists or can be implemented
- Internal marketing team has basic CMS literacy for content management
- Figma designs provide sufficient detail for all page types
- SSL certificate and domain (nestassociates.co.uk) are available
- Hosting infrastructure supports the chosen technology stack

## Out of Scope

- User accounts for property buyers/renters (beyond Apex27 registration)
- Property saved/favorites functionality
- Online payments or transactions
- Agent microsites (handled by separate `apps/agent-site` project)
- Property valuation calculator
- Mortgage calculator
- Live chat functionality
- Multi-language support
