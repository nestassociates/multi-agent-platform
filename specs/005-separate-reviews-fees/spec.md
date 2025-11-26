# Feature Specification: Separate Reviews & Fees from Content System

**Feature Branch**: `005-separate-reviews-fees`
**Created**: 2025-11-26
**Status**: Draft
**Input**: User description: "Refactor content system to separate reviews and fees from blog posts. Remove review and fee_structure content types, keep only blog_post and area_guide. Add Google My Business reviews integration with embedded maps widget. Add dedicated fee structure management for agents with sales and lettings commission rates."

## User Scenarios & Testing

### User Story 1 - Agent Creates Blog Content (Priority: P1)

Agents can create and submit blog posts and area guides for admin review, without being presented with review or fee structure options that are no longer part of the content workflow.

**Why this priority**: Core functionality that agents use daily to publish content. Must work correctly after refactoring to prevent workflow disruption.

**Independent Test**: Can be fully tested by logging in as an agent, navigating to content creation, and verifying only blog_post and area_guide options appear in the dropdown. Delivers immediate value by preventing confusion from deprecated content types.

**Acceptance Scenarios**:

1. **Given** an agent is on the content creation page, **When** they view the content type dropdown, **Then** only "Blog Post" and "Area Guide" options are displayed
2. **Given** an agent selects "Blog Post" and completes the form, **When** they submit for review, **Then** the content is successfully created with type blog_post
3. **Given** an agent views their existing content list, **When** the page loads, **Then** old review and fee_structure content is not displayed in the list
4. **Given** an agent tries to create content with type "review" via API, **When** the request is sent, **Then** the system returns a validation error

---

### User Story 2 - Agent Manages Fee Structure (Priority: P2)

Agents can configure and update their commission rates (sales percentage, lettings percentage, minimum fee) through a dedicated fee management page, with changes taking effect immediately without requiring admin approval.

**Why this priority**: Essential for agents to communicate their pricing to potential clients. Self-service reduces admin burden and enables quick fee updates.

**Independent Test**: Can be tested independently by creating the fee structure page, API, and database table. Agent can save fees and see them displayed without any other feature dependencies. Delivers value by providing transparent pricing information.

**Acceptance Scenarios**:

1. **Given** an agent has not configured fees yet, **When** they visit the fee structure page, **Then** they see an empty form with sales percentage, lettings percentage, minimum fee, and notes fields
2. **Given** an agent fills in sales commission as 1.5% and lettings as 10%, **When** they click save, **Then** the fee structure is saved and displayed on the same page
3. **Given** an agent has existing fee structure, **When** they update the sales percentage from 1.5% to 2.0%, **Then** the new value replaces the old value (no versioning in v1)
4. **Given** an agent enters a sales percentage of 150%, **When** they try to save, **Then** the system shows a validation error that percentage must be between 0 and 100
5. **Given** an agent views their fee structure, **When** the page displays fees, **Then** they see sales percentage, lettings percentage, minimum fee (if set), and last updated timestamp

---

### User Story 3 - Agent Displays Google My Business Reviews (Priority: P3)

Agents can connect their Google My Business profile by entering their Place ID, enabling an embedded Google Maps widget to display their business reviews directly in the dashboard and potentially on their public site.

**Why this priority**: Enhances agent credibility by showcasing real customer reviews from Google. Lower priority than core content/fees as it's a value-add feature that can be configured anytime.

**Independent Test**: Can be tested by creating the reviews page, Place ID form, and widget component. Agent enters a valid Place ID, and the embedded map shows their GMB reviews. No dependencies on content or fee systems.

**Acceptance Scenarios**:

1. **Given** an agent has not connected their GMB account, **When** they visit the reviews page, **Then** they see a form to enter their Google Place ID
2. **Given** an agent enters a valid Google Place ID (format: ChIJ...), **When** they click save, **Then** the Place ID is stored and they see the embedded Google Maps widget showing their reviews
3. **Given** an agent has already saved their Place ID, **When** they visit the reviews page, **Then** they see the embedded map widget displaying their GMB reviews
4. **Given** an agent wants to update their Place ID, **When** they view the reviews page, **Then** they can access a form to change the Place ID below the widget
5. **Given** an invalid or non-existent Place ID is entered, **When** the widget loads, **Then** the embedded map shows an error state (handled by Google)

---

### Edge Cases

- What happens when an agent tries to directly access old archived review or fee_structure content by URL? (Should return 404 or redirect)
- How does the system handle validation when trying to create content with deprecated types through API calls? (Should return validation error with clear message)
- What happens if an agent enters a negative percentage or fee amount? (Validation should reject with clear error message)
- How does the system handle concurrent updates to fee structure by the same agent in multiple browser tabs? (Last write wins, show "last updated" timestamp to indicate freshness)
- What happens if Google Maps API key is missing or invalid? (Widget should show error message or placeholder with instructions)
- What happens when an agent deletes their Google Place ID? (Widget should be removed and configuration form shown again)

## Requirements

### Functional Requirements

- **FR-001**: System MUST restrict content_submissions to only blog_post and area_guide types
- **FR-002**: System MUST archive existing review and fee_structure content without deleting data (soft delete with is_archived flag)
- **FR-003**: System MUST prevent creation of new review or fee_structure content through both UI and API
- **FR-004**: System MUST validate content type as enum containing only ['blog_post', 'area_guide']
- **FR-005**: System MUST filter out archived content from agent content lists and queries
- **FR-006**: Agents MUST be able to configure their fee structure with sales percentage, lettings percentage, minimum fee (optional), and notes (optional)
- **FR-007**: System MUST validate fee percentages are between 0 and 100
- **FR-008**: System MUST validate minimum fee is a positive number or zero
- **FR-009**: System MUST allow agents to update their fee structure at any time without admin approval
- **FR-010**: System MUST store one current fee structure per agent (no versioning in v1)
- **FR-011**: Agents MUST be able to save their Google My Business Place ID
- **FR-012**: System MUST display Google My Business reviews using embedded Google Maps widget when Place ID is configured
- **FR-013**: System MUST validate Google Place ID format (starts with "ChIJ")
- **FR-014**: System MUST allow agents to update their Google Place ID at any time
- **FR-015**: System MUST use a single Google Maps Embed API key from Nest Associates for all agents

### Key Entities

- **Content Submission**: Existing entity, now restricted to blog_post and area_guide types only. Archive flag added to mark deprecated content. No structural changes to fields (title, slug, content_body, excerpt, etc.)

- **Agent Fee**: New entity representing an agent's fee structure. Contains sales_percentage (decimal 0-100), lettings_percentage (decimal 0-100), minimum_fee (optional decimal >= 0), notes (optional text up to 1000 chars). One current record per agent, no versioning.

- **Agent**: Existing entity, extended with google_place_id field (optional text) to store Google My Business Place ID for reviews integration.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Agents can create blog posts and area guides with zero errors related to deprecated content types
- **SC-002**: All existing review and fee_structure content is hidden from agent views while preserved in database for potential future recovery
- **SC-003**: Agents can configure their fee structure in under 2 minutes
- **SC-004**: Fee structure changes are reflected immediately without waiting for admin approval
- **SC-005**: Agents can connect their Google My Business profile and see their reviews displayed within 5 minutes
- **SC-006**: System prevents any creation of review or fee_structure content types through all interfaces (UI and API)
- **SC-007**: Fee percentage validation catches 100% of invalid inputs (negative numbers, values > 100%)

## Assumptions

- Google Maps Embed API key will be obtained by Nest Associates and added to environment variables before deployment
- Each agent has only one Google My Business location (single Place ID)
- Fee structures do not require version history or audit trail in v1 (can be added later if needed)
- Agents know how to find their Google Place ID (link to Google's Place ID Finder provided in UI)
- Archived content (review/fee_structure) may be unarchived in the future, so data must be preserved
- Fee percentages are displayed as entered (no automatic formatting or calculations)
- Google Maps embed widget is acceptable for displaying reviews (no custom styling or review response functionality needed in v1)
- All agents use the same currency (GBP) for minimum fee
- Fee notes field is plain text (no rich text editor needed)

## Scope

### In Scope

- Remove review and fee_structure from content type dropdowns and validation
- Add is_archived column to content_submissions table and archive old content
- Update TypeScript types and Zod validation schemas
- Filter archived content from all agent-facing queries and lists
- Create agent_fees table with basic fields (sales %, lettings %, min fee, notes)
- Build fee structure management page with form for agents
- Create fee structure API endpoint (GET and POST/upsert)
- Add google_place_id column to agents table
- Build Google My Business reviews page with Place ID configuration form
- Create embedded Google Maps widget component for displaying reviews
- Update agent profile API to accept google_place_id updates
- Add navigation links for Reviews and Fees pages
- RLS policies for agent_fees table (agents manage own fees, public read access)

### Out of Scope

- Fee structure versioning or history tracking
- Audit log for fee changes
- Google My Business OAuth integration or automatic review syncing
- Review response management or moderation
- Custom review display UI (using Google's embed widget only)
- Migration of existing review/fee_structure content to new systems (archived only)
- Admin moderation workflow for fees (auto-publish/agent-controlled)
- Email notifications for fee changes
- Public API endpoints for external access to fees
- Analytics or reporting on fee structures
- Multi-currency support for fees
- Complex fee structures (tiered rates, conditional pricing)
- Integration with third-party CRM or accounting systems

## Dependencies

- Google Cloud Console account access to create Maps Embed API key
- Supabase database access for running migrations
- Existing content_submissions, agents, and profiles tables
- React Hook Form library (already in use)
- Zod validation library (already in use)
- shadcn/ui components (Card, Button, Input, Textarea) - already available

## Constraints

- Must maintain backwards compatibility with existing blog_post and area_guide content
- Must preserve archived review/fee_structure data in database (soft delete only)
- Must not break existing content submission workflow or admin moderation queue
- Must use existing Supabase RLS patterns for security
- Must follow existing validation patterns (Zod schemas in packages/validation)
- Must follow existing API patterns (Next.js route handlers with error responses)
- Google Maps Embed API free tier limit: 25,000 map loads/month for all agents combined
- Fee percentages must be stored as DECIMAL(5,2) allowing values like 12.75%
- Minimum fee stored as DECIMAL(10,2) for amounts up to £99,999,999.99
