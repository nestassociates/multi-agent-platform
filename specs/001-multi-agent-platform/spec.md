# Feature Specification: Multi-Agent Real Estate Platform

**Feature Branch**: `001-multi-agent-platform`
**Created**: 2025-10-29
**Status**: Draft
**Input**: User description: "JAMstack multi-agent real estate platform with admin dashboard, agent microsites, and property synchronization"

## User Scenarios & Testing

### User Story 1 - Agent Account Creation and First Login (Priority: P1)

An admin creates a new agent account, the agent receives credentials, logs in for the first time, and updates their profile with bio and qualifications.

**Why this priority**: This is the foundational user flow that enables all other functionality. Without agents in the system, there are no microsites to build or content to moderate.

**Independent Test**: Can be fully tested by creating an agent account through the admin dashboard, receiving the welcome email, logging in with temporary credentials, changing the password, and updating the profile. Delivers immediate value by establishing the agent's presence in the system.

**Acceptance Scenarios**:

1. **Given** I am an admin user, **When** I fill out the agent creation form with valid details and submit, **Then** a new agent account is created, a Supabase Auth user is provisioned, and a welcome email is sent with login credentials
2. **Given** I am a new agent who received welcome credentials, **When** I log in with the temporary password, **Then** I am prompted to change my password before accessing the dashboard
3. **Given** I am an agent on first login, **When** I update my profile with bio, qualifications, and social links, **Then** these details are saved and will appear on my future microsite

---

### User Story 2 - Property Synchronization from Apex27 (Priority: P1)

The system receives property data from Apex27 CRM via webhook, matches it to the correct agent by branch ID, and stores it in the database, making it available for display on agent microsites.

**Why this priority**: Properties are the core content of a real estate agent's site. Without automated property sync, agents have no listings to showcase, making the platform non-functional for its primary purpose.

**Independent Test**: Can be fully tested by configuring Apex27 webhook, sending a test property payload, verifying the signature validation, confirming the property is stored in the database linked to the correct agent, and checking that it appears in the agent's property list. Delivers immediate value by populating agent sites with live property data.

**Acceptance Scenarios**:

1. **Given** Apex27 sends a property create webhook with valid HMAC-SHA256 signature and branch ID, **When** the system receives and processes it, **Then** the property is stored in the database linked to the agent with matching apex27_branch_id
2. **Given** Apex27 sends a property update webhook for an existing property, **When** the system processes it, **Then** the existing property record is updated with new data
3. **Given** Apex27 sends a property delete webhook, **When** the system processes it, **Then** the property is marked as deleted or removed from the database
4. **Given** Apex27 sends a webhook with an invalid signature, **When** the system validates it, **Then** the webhook is rejected and logged as a security event

---

### User Story 3 - Agent Content Creation and Approval (Priority: P1)

An agent creates a blog post or area guide in their dashboard, submits it for review, an admin reviews and approves it, and the content is queued for publication on the agent's microsite.

**Why this priority**: User-generated content (blogs, area guides) differentiates agent microsites and provides SEO value. This workflow ensures quality control while enabling agents to contribute content.

**Independent Test**: Can be fully tested by logging in as an agent, creating a blog post with rich text content and images, submitting it for review, logging in as an admin, viewing the submission in the moderation queue, approving it, and verifying it's queued for the next site build. Delivers immediate value by establishing the content approval workflow.

**Acceptance Scenarios**:

1. **Given** I am an agent, **When** I create a blog post with title, content, and featured image and save as draft, **Then** the content is auto-saved every 30 seconds and stored with status "draft"
2. **Given** I am an agent with a draft blog post, **When** I click "Submit for Review", **Then** the status changes to "pending_review" and the content appears in the admin moderation queue
3. **Given** I am an admin viewing the moderation queue, **When** I review a pending blog post and click "Approve", **Then** the status changes to "approved" and a build job is created for that agent's site with priority P2
4. **Given** I am an admin viewing a pending submission, **When** I click "Reject" and enter a rejection reason, **Then** the status changes to "rejected", the reason is saved, and the agent receives an email notification with feedback

---

### User Story 4 - Visual Territory Assignment (Priority: P2)

An admin uses the interactive map to draw a polygon representing an agent's territory, the system calculates the number of residential properties in that area, checks for overlaps with existing territories, and saves the territory linked to the agent.

**Why this priority**: Territory management provides market intelligence and helps with agent resource allocation, but isn't strictly required for basic site functionality. It adds significant value for platform management but can be implemented after core agent and property features.

**Independent Test**: Can be fully tested by logging into the admin dashboard, navigating to the territory map, drawing a polygon using Mapbox drawing tools, selecting an agent from a dropdown, viewing the calculated property count from OS Data Hub API, seeing overlap warnings if applicable, and saving the territory. Delivers value by enabling geographic organization of agents.

**Acceptance Scenarios**:

1. **Given** I am an admin on the territory map, **When** I click "Create Territory" and draw a polygon by clicking points on the map, **Then** the map enters drawing mode and displays the polygon boundary as I draw
2. **Given** I have completed drawing a territory polygon, **When** I close the polygon and enter a territory name and select an agent, **Then** the system queries OS Data Hub API for residential property count within the boundary
3. **Given** the system has calculated the property count, **When** the territory boundary overlaps with an existing territory, **Then** a warning message is displayed showing which agent's territory it overlaps with, but I can still proceed to save
4. **Given** I have entered all territory details, **When** I click "Save", **Then** the territory is stored with PostGIS geography type, linked to the agent, and displayed on the map with a color unique to that agent

---

### User Story 5 - Agent Microsite Static Build and Deployment (Priority: P2)

When an agent's content is approved or their profile is updated, a build job is added to the queue, processed by a cron job, which fetches all agent data and content, generates an Astro static site, and deploys it to the agent's subdomain.

**Why this priority**: This is the delivery mechanism that makes content visible to end users, but depends on having agents, properties, and content in the system first. It's critical for production but can be delayed until there's content to publish.

**Independent Test**: Can be fully tested by triggering a manual build from the admin dashboard, monitoring the build queue status, observing the build process fetch agent data and properties, seeing the Astro site generation complete, verifying deployment to the subdomain, and visiting the live agent microsite URL. Delivers value by making agent sites publicly accessible.

**Acceptance Scenarios**:

1. **Given** an admin approves a blog post for an agent, **When** the approval is saved, **Then** a build job is added to the build_queue with priority P2 and status "pending"
2. **Given** a cron job runs every 2 minutes, **When** it finds pending build jobs, **Then** it processes up to 20 builds in parallel, starting with the highest priority
3. **Given** a build job is processing, **When** the system fetches agent data, approved content, properties, and global templates, **Then** a JSON data file is generated for the Astro build
4. **Given** the data file is ready, **When** the Astro build is triggered via Vercel API, **Then** the static site is deployed to [subdomain].agents.nestassociates.com
5. **Given** a build completes successfully, **When** the build status is updated, **Then** the build_queue record is marked as "completed" with a completion timestamp
6. **Given** a build fails, **When** the system detects the failure, **Then** the build is retried up to 3 times with exponential backoff, and if still failing, an email is sent to the admin team

---

### User Story 6 - Admin Agent Management Interface (Priority: P2)

An admin views a searchable, filterable list of all agents, clicks on an agent to view detailed information across tabs (Overview, Content, Properties, Analytics, Settings), edits agent details via a modal form, and triggers a manual site rebuild.

**Why this priority**: This provides essential management capabilities but isn't needed until there are multiple agents in the system. It's important for operational efficiency but can be basic initially.

**Independent Test**: Can be fully tested by logging into the admin dashboard, viewing the agent list with search and filters, clicking an agent row to view details, switching between tabs, clicking "Edit" to open the modal form, updating agent information, saving changes, and verifying a site rebuild is triggered. Delivers value by providing centralized agent administration.

**Acceptance Scenarios**:

1. **Given** I am an admin on the agents page, **When** I view the agent list, **Then** I see a table with columns for Name, Email, Subdomain, Status, Territory, Property Count, and Created Date, paginated at 50 per page
2. **Given** I am viewing the agent list, **When** I use the search box to filter by name, email, or subdomain, **Then** the table updates to show only matching agents
3. **Given** I am viewing the agent list, **When** I click on an agent row, **Then** I am taken to the agent detail view with tabs for Overview, Content, Properties, Analytics, and Settings
4. **Given** I am on the agent detail view, **When** I click "Edit" and update the agent's bio or qualifications, **Then** a modal form opens, I can make changes, and clicking "Save" updates the agent record and triggers a site rebuild
5. **Given** I am on the agent detail view, **When** I click "View Live Site", **Then** the agent's microsite opens in a new browser tab

---

### User Story 7 - Global Content Management and Deployment (Priority: P3)

An admin edits global templates (header, footer, privacy policy, terms of service), previews how they will look on agent sites, publishes the changes, and triggers a batch rebuild of all agent sites.

**Why this priority**: Global content provides consistency across agent sites but isn't critical for initial launch. It's important for branding and legal compliance but can be set up once and rarely changed.

**Independent Test**: Can be fully tested by logging into the admin dashboard, navigating to global content management, editing a footer template in the rich text editor, previewing the changes, clicking "Publish", confirming the batch rebuild dialog, and monitoring the rebuild progress as all agent sites are updated. Delivers value by enabling platform-wide updates.

**Acceptance Scenarios**:

1. **Given** I am an admin in the global content editor, **When** I edit the footer template using the rich text editor, **Then** my changes are auto-saved as a draft
2. **Given** I have edited global content, **When** I click "Preview", **Then** I see a preview of how the content will appear on agent sites
3. **Given** I am satisfied with my changes, **When** I click "Publish", **Then** a confirmation dialog appears asking "This will rebuild all X agent sites. Continue?"
4. **Given** I confirm the batch rebuild, **When** the system processes it, **Then** build jobs are created for all active agents with priority P3, and a progress indicator shows "Rebuilding sites: X/Y complete"
5. **Given** the batch rebuild completes, **When** all jobs finish, **Then** I receive an email notification confirming completion

---

### User Story 8 - Agent Analytics Dashboard (Priority: P3)

An agent logs into their dashboard, views traffic statistics from Google Analytics 4 (page views, unique visitors, bounce rate), sees which properties are getting the most views, and tracks lead sources and conversion metrics.

**Why this priority**: Analytics provide valuable insights but aren't essential for launching the platform. Agents need to have sites with traffic before analytics become useful.

**Independent Test**: Can be fully tested by logging in as an agent, navigating to the analytics dashboard, selecting a date range (last 7/30/90 days), viewing traffic overview charts, checking the top pages list, seeing property view statistics, and reviewing lead source data. Delivers value by giving agents visibility into their site performance.

**Acceptance Scenarios**:

1. **Given** I am an agent on my dashboard home, **When** I view the overview stats section, **Then** I see total site visits (last 30 days), total properties live, content pieces published, and pending submissions
2. **Given** I am an agent on the analytics dashboard, **When** I view the traffic overview, **Then** I see page views, unique visitors, bounce rate, and average session duration from GA4
3. **Given** I am viewing analytics, **When** I check the property views section, **Then** I see a list of properties ranked by number of views
4. **Given** I am viewing analytics, **When** I select a custom date range, **Then** all metrics update to reflect data for that time period

---

### User Story 9 - Agent Profile Self-Management (Priority: P3)

An agent edits their own profile (phone number, bio, qualifications, certifications, social media links, profile photo), previews how it will look on their site, and saves changes which trigger a site rebuild.

**Why this priority**: Self-service profile management reduces admin workload but isn't critical at launch. Admins can initially set up profiles during agent onboarding.

**Independent Test**: Can be fully tested by logging in as an agent, navigating to the profile editor, updating bio text in the rich text editor, adding qualifications, uploading a profile photo, clicking "Preview" to see the changes, and clicking "Save" to trigger a site rebuild. Delivers value by empowering agents to maintain their own information.

**Acceptance Scenarios**:

1. **Given** I am an agent on the profile editor, **When** I update my phone number, **Then** the change is saved and will appear on my contact page
2. **Given** I am editing my profile, **When** I add or remove qualifications, **Then** the list is updated and will display on my about page
3. **Given** I am editing my profile, **When** I upload a profile photo, **Then** it is auto-cropped to square and stored in Supabase Storage
4. **Given** I have made profile changes, **When** I click "Preview", **Then** I see a preview of how my profile will appear on my microsite
5. **Given** I am satisfied with changes, **When** I click "Save", **Then** the profile is updated and a site rebuild is triggered

---

### User Story 10 - Public API Endpoints for WordPress Integration (Priority: P3)

The WordPress main site calls the public API endpoint to fetch a list of all active agents with profiles, and calls another endpoint to search properties across the entire network based on criteria like price, bedrooms, and location.

**Why this priority**: WordPress integration extends the platform's reach but isn't essential for the core multi-agent functionality. It's valuable for marketing but can be added after the main platform is stable.

**Independent Test**: Can be fully tested by making a GET request to /api/public/agents from the WordPress domain, receiving the JSON response with agent data, making a GET request to /api/public/properties with query parameters, receiving filtered property results, and verifying CORS headers allow the WordPress domain. Delivers value by enabling property search and agent directory widgets on the main site.

**Acceptance Scenarios**:

1. **Given** the WordPress site calls /api/public/agents, **When** the request is received, **Then** a JSON array of all active agents is returned with id, name, email, phone, bio, subdomain, and avatar_url
2. **Given** the WordPress site calls /api/public/properties with query parameters (e.g., ?transaction_type=sale&min_price=200000&bedrooms=3), **When** the request is processed, **Then** a filtered list of properties is returned matching all criteria
3. **Given** a public API endpoint is called, **When** the response is returned, **Then** appropriate CORS headers are included allowing the WordPress domain
4. **Given** multiple requests are made to the same endpoint within 5 minutes, **When** the system processes them, **Then** cached responses are returned for improved performance

---

### Edge Cases

- What happens when an agent is deleted but still has pending content submissions in the moderation queue?
- How does the system handle Apex27 webhooks for a branch ID that doesn't match any existing agent?
- What happens when a territory polygon is drawn incorrectly or covers an invalid geographic area?
- How does the system handle a build failure after 3 retry attempts?
- What happens when two admins try to edit the same global template simultaneously?
- How does the system handle an agent uploading an extremely large image (>10MB) for their profile photo or blog post?
- What happens when the OS Data Hub API is unavailable when creating a territory?
- How does the system handle an agent creating multiple pieces of content with identical slugs?
- What happens when a site build is triggered while another build for the same agent is still in progress?
- How does the system handle password reset requests for suspended or archived agents?
- What happens when an agent tries to submit content for review while their account status is "suspended"?
- How does the system handle a webhook replay attack (same webhook received multiple times)?

## Requirements

### Functional Requirements

#### Authentication & User Management

- **FR-001**: System MUST authenticate users via email and password using Supabase Auth
- **FR-002**: System MUST enforce 2FA (TOTP) for all super admin and admin accounts
- **FR-003**: System MUST enforce password requirements: minimum 12 characters with at least one uppercase letter, one lowercase letter, one number, and one symbol
- **FR-004**: System MUST implement rate limiting on login attempts: maximum 5 attempts per 15 minutes per email address
- **FR-005**: System MUST lock user accounts after 10 consecutive failed login attempts
- **FR-006**: System MUST provide password reset flow via email with time-limited reset links
- **FR-007**: System MUST use JWT tokens with 1-hour expiry for session management
- **FR-008**: System MUST implement refresh token rotation for maintaining sessions
- **FR-009**: System MUST enforce role-based access control with three roles: super_admin, admin, and agent
- **FR-010**: System MUST store extended user profiles with fields: role, email, first_name, last_name, phone, avatar_url

#### Agent Management (Admin Only)

- **FR-011**: System MUST allow admins to create new agent accounts with fields: email, temporary password, first_name, last_name, phone, subdomain, apex27_branch_id, bio, qualifications, and social_media_links
- **FR-012**: System MUST create a Supabase Auth user, profile record, and agent record atomically when creating an agent account
- **FR-013**: System MUST send a welcome email with login credentials immediately after agent account creation
- **FR-014**: System MUST force agents to change their temporary password on first login
- **FR-015**: System MUST provide a searchable and filterable agent list with columns: Name, Email, Subdomain, Status, Territory, Property Count, Created Date
- **FR-016**: System MUST support filtering agents by status: active, suspended, archived
- **FR-017**: System MUST support searching agents by name, email, or subdomain
- **FR-018**: System MUST paginate the agent list at 50 agents per page
- **FR-019**: System MUST provide an agent detail view with tabs: Overview, Content, Properties, Analytics, Settings
- **FR-020**: System MUST allow admins to edit agent profile information, bio, qualifications, social links, and status via a modal form
- **FR-021**: System MUST prevent admins from changing agent email or subdomain without going through a specific workflow that handles cascading changes
- **FR-022**: System MUST trigger a site rebuild when agent profile content is changed and saved
- **FR-023**: System MUST allow admins to delete agent accounts with a confirmation dialog warning about cascading deletes
- **FR-024**: System MUST cascade delete agent records, user accounts, all content, all properties, and all territories when an agent is deleted
- **FR-025**: System MUST archive site deployments rather than deleting them when an agent is deleted

#### Visual Territory Management (Admin Only)

- **FR-026**: System MUST provide an interactive full-screen map interface using Mapbox GL JS
- **FR-027**: System MUST display all existing territories as colored polygons on the map
- **FR-028**: System MUST label each territory with the assigned agent's name
- **FR-029**: System MUST assign a unique color to each agent for visual distinction of territories
- **FR-030**: System MUST allow admins to create new territories by drawing polygon boundaries on the map
- **FR-031**: System MUST provide a form to enter territory name and assign to an agent after drawing a polygon
- **FR-032**: System MUST query OS Data Hub Features API to calculate residential property count within territory polygon boundaries
- **FR-033**: System MUST check for overlaps with existing territories when creating or editing a territory
- **FR-034**: System MUST display a warning message if territory overlaps are detected but still allow saving
- **FR-035**: System MUST store territory boundaries using PostGIS geography type for geospatial queries
- **FR-036**: System MUST display property count with format "This territory contains approximately X residential properties"
- **FR-037**: System MUST allow admins to edit existing territories by dragging polygon vertices
- **FR-038**: System MUST allow admins to reassign territories to different agents
- **FR-039**: System MUST allow admins to manually refresh property counts for existing territories
- **FR-040**: System MUST provide a territory list view with columns: Territory Name, Agent, Property Count, Created Date
- **FR-041**: System MUST highlight territories on the map when clicked from the list view
- **FR-042**: System MUST allow admins to delete territories with confirmation

#### Property Synchronization from Apex27

- **FR-043**: System MUST provide a webhook endpoint at /api/webhooks/apex27 to receive property events from Apex27 CRM
- **FR-044**: System MUST validate webhook payloads using HMAC-SHA256 signature verification
- **FR-045**: System MUST reject webhooks with invalid signatures and log them as security events
- **FR-046**: System MUST extract branch_id from webhook payload and map to agent via agents.apex27_branch_id
- **FR-047**: System MUST upsert property data (create or update) based on apex27_id and agent_id
- **FR-048**: System MUST handle property create, update, and delete events from Apex27
- **FR-049**: System MUST store property data with fields: apex27_id, agent_id, transaction_type, title, description, price, bedrooms, bathrooms, property_type, address (JSON), postcode, location (PostGIS point), images (JSON array), features (array), floor_plan_url, virtual_tour_url, status, is_featured, is_hidden, raw_data (full JSON)
- **FR-050**: System MUST enforce unique constraint on (agent_id, apex27_id) for properties
- **FR-051**: System MUST create database indexes on: agent_id, postcode, price, transaction_type, is_featured
- **FR-052**: System MUST trigger a site rebuild with priority P2 when properties are added or updated for an agent

#### Content Creation & Approval Workflow

- **FR-053**: System MUST support four content types: blog posts, area guides, reviews/testimonials, fee structure
- **FR-054**: System MUST provide a rich text editor (Tiptap) with formatting tools: bold, italic, underline, headings (H1-H6), bullet lists, numbered lists, links, images, blockquotes
- **FR-055**: System MUST auto-save content as draft every 30 seconds
- **FR-056**: System MUST require title (max 100 chars) and content body for all content submissions
- **FR-057**: System MUST auto-generate URL-friendly slugs from titles but allow manual editing
- **FR-058**: System MUST support optional fields: excerpt (max 250 chars), featured_image, seo_meta_title, seo_meta_description (max 160 chars)
- **FR-059**: System MUST display character counters for all fields with length limits
- **FR-060**: System MUST upload images to Supabase Storage and auto-resize them
- **FR-061**: System MUST crop featured images to 16:9 aspect ratio
- **FR-062**: System MUST support five content status states: draft, pending_review, approved, rejected, published
- **FR-063**: System MUST allow agents to save content as draft without submitting for review
- **FR-064**: System MUST allow agents to submit drafts for review, changing status to pending_review
- **FR-065**: System MUST prevent agents from editing content while status is pending_review
- **FR-066**: System MUST display content in the admin moderation queue when status is pending_review
- **FR-067**: System MUST allow admins to sort and filter moderation queue by: Agent, Content Type, Submission Date
- **FR-068**: System MUST provide a preview pane to show formatted content in the moderation queue
- **FR-069**: System MUST allow admins to approve content, changing status to approved and queuing a site rebuild
- **FR-070**: System MUST allow admins to reject content with a required rejection reason
- **FR-071**: System MUST change content status to rejected and send an email notification to the agent when rejected
- **FR-072**: System MUST provide quick-select rejection reasons: "Contains spelling/grammar errors", "Not on-brand", "Needs more detail", "Inappropriate content", plus custom input
- **FR-073**: System MUST store rejection reasons in content_submissions.rejection_reason field
- **FR-074**: System MUST allow agents to view rejection feedback in their dashboard
- **FR-075**: System MUST allow agents to edit and resubmit rejected content
- **FR-076**: System MUST support bulk approval of multiple content submissions
- **FR-077**: System MUST change content status to published after a successful site build
- **FR-078**: System MUST create a new draft version when editing published content
- **FR-079**: System MUST track version history with what changed, who changed it, and when
- **FR-080**: System MUST maintain an audit log of all content changes

#### Global Content Management (Admin Only)

- **FR-081**: System MUST support global templates for: header, footer, privacy policy, terms of service, cookie policy
- **FR-082**: System MUST provide a rich text editor for editing global content
- **FR-083**: System MUST provide a preview mode showing how global content will appear on agent sites
- **FR-084**: System MUST implement version control for global content with rollback capability
- **FR-085**: System MUST allow saving global content as draft or publishing it
- **FR-086**: System MUST trigger a batch rebuild of ALL active agent sites when global content is published
- **FR-087**: System MUST provide a "Deploy to All Agent Sites" button with confirmation dialog
- **FR-088**: System MUST create build jobs for all active agents with priority P3 when global content is deployed
- **FR-089**: System MUST display rebuild progress: "Rebuilding sites: X/Y complete"
- **FR-090**: System MUST send an email notification when batch rebuild completes

#### Static Site Build System

- **FR-091**: System MUST maintain a build_queue database table with fields: agent_id, priority (1-4), status (pending/processing/completed/failed), trigger_reason, build_logs, started_at, completed_at, error_message, retry_count
- **FR-092**: System MUST support four priority levels: P1 (Emergency) - immediate, P2 (High) - within 5 minutes, P3 (Normal) - within 30 minutes, P4 (Low) - within 24 hours
- **FR-093**: System MUST run a Vercel cron job every 2 minutes to process the build queue
- **FR-094**: System MUST process up to 20 builds in parallel
- **FR-095**: System MUST process build jobs ordered by priority then created_at
- **FR-096**: System MUST check for duplicate pending builds for the same agent before adding to queue
- **FR-097**: System MUST update trigger_reason if a pending build already exists for an agent instead of creating a duplicate
- **FR-098**: System MUST fetch agent data, approved content, properties, and global templates for each build
- **FR-099**: System MUST generate a JSON data file containing all content for the Astro build
- **FR-100**: System MUST trigger Astro static site builds via Vercel API
- **FR-101**: System MUST deploy completed builds to subdomains with format: [agent.subdomain].agents.nestassociates.com
- **FR-102**: System MUST update build_queue status to completed or failed after each build attempt
- **FR-103**: System MUST retry failed builds up to 3 times with exponential backoff
- **FR-104**: System MUST mark builds as permanently failed after 3 failed attempts
- **FR-105**: System MUST send email notifications to admin team when builds permanently fail
- **FR-106**: System MUST store full error logs in build_logs field for failed builds
- **FR-107**: System MUST provide a Build Queue page in admin dashboard showing: pending builds count, currently processing builds, completed builds (last 100), failed builds
- **FR-108**: System MUST allow admins to manually trigger builds for any agent
- **FR-109**: System MUST allow admins to retry failed builds
- **FR-110**: System MUST allow admins to filter build queue by: Agent, Status, Date Range

#### Agent Microsite Template (Astro)

- **FR-111**: System MUST generate agent microsites with 11 page types: Homepage, About, Services, Properties, Property Detail, Blog, Blog Post, Area Guides, Area Guide Detail, Reviews, Contact
- **FR-112**: System MUST display agent photo, bio, featured properties carousel, recent blog posts (latest 3), and stats section on homepage
- **FR-113**: System MUST display full bio, qualifications, certifications, professional photo, social media links, and contact information on About page
- **FR-114**: System MUST display services offered, fee structure (if published), process overview, and FAQ section on Services page
- **FR-115**: System MUST provide client-side filtering on Properties page by: transaction type (sale/let), price range (slider), bedrooms (1-5+), property type
- **FR-116**: System MUST provide postcode search on Properties page
- **FR-117**: System MUST provide sorting on Properties page by: Newest, Price (high-low, low-high), Bedrooms
- **FR-118**: System MUST paginate Properties page at 20 properties per page
- **FR-119**: System MUST display image gallery, full description, key details, features list, floor plan (if available), virtual tour (if available), location map, and property enquiry form on Property Detail page
- **FR-120**: System MUST display blog archive with preview cards (featured image, title, excerpt, date) sorted by publish date on Blog page
- **FR-121**: System MUST paginate Blog page at 10 posts per page
- **FR-122**: System MUST display featured image, full content, publish date, social share buttons, and related posts (same agent, newest 3) on Blog Post page
- **FR-123**: System MUST display area guide archive with preview cards on Area Guides page
- **FR-124**: System MUST display area guide content with area map on Area Guide Detail page
- **FR-125**: System MUST display customer testimonials with star ratings, customer name, and property type on Reviews page
- **FR-126**: System MUST display contact form (name, email, phone, message), agent contact details, office location map (if available), and social media links on Contact page
- **FR-127**: System MUST submit contact forms to API endpoint which sends email to agent and stores submission in database
- **FR-128**: System MUST implement SEO optimization with meta tags, Open Graph, and Twitter Cards on all pages
- **FR-129**: System MUST implement schema markup (Organization, LocalBusiness, Person, Product for properties) on relevant pages
- **FR-130**: System MUST generate sitemap.xml automatically for each agent site
- **FR-131**: System MUST generate robots.txt configuration for each agent site
- **FR-132**: System MUST implement responsive design with mobile-first approach
- **FR-133**: System MUST comply with WCAG 2.1 AA accessibility standards
- **FR-134**: System MUST optimize images (WebP format with responsive sizes)
- **FR-135**: System MUST inline critical CSS for above-the-fold content
- **FR-136**: System MUST lazy load images below the fold
- **FR-137**: System MUST minimize JavaScript usage (only for filtering, forms, interactive features)
- **FR-138**: System MUST integrate Google Analytics 4 for tracking
- **FR-139**: System MUST integrate Google Tag Manager for tag management
- **FR-140**: System MUST fetch properties client-side from /api/public/properties?agent_id=X
- **FR-141**: System MUST build content (blog, areas, reviews) into static pages at build time
- **FR-142**: System MUST inject agent data at build time

#### Agent Dashboard Features

- **FR-143**: System MUST display overview stats on agent dashboard home: total site visits (last 30 days), total properties live, content pieces published, pending submissions
- **FR-144**: System MUST display a chart showing site traffic over time (last 3 months) on agent dashboard home
- **FR-145**: System MUST display recent activity feed on agent dashboard home
- **FR-146**: System MUST provide quick actions on agent dashboard home: Create Content, View Site, Edit Profile
- **FR-147**: System MUST allow agents to edit phone number, bio (rich text, max 1000 words), qualifications, certifications, social media links, and profile photo in profile editor
- **FR-148**: System MUST prevent agents from changing first_name and last_name (admin only)
- **FR-149**: System MUST auto-crop profile photos to square aspect ratio
- **FR-150**: System MUST provide a preview button showing how profile will look on microsite
- **FR-151**: System MUST trigger site rebuild when agent saves profile changes
- **FR-152**: System MUST provide tabs on agent content management page: All, Drafts, Pending, Published, Rejected
- **FR-153**: System MUST display content table with columns: Title, Type, Status, Last Updated, Actions
- **FR-154**: System MUST provide "Create New" dropdown for selecting content type
- **FR-155**: System MUST display traffic overview from GA4: page views, unique visitors, bounce rate, average session duration
- **FR-156**: System MUST display top pages (most visited) in analytics dashboard
- **FR-157**: System MUST display property views (which properties getting most traffic) in analytics dashboard
- **FR-158**: System MUST display lead sources in analytics dashboard
- **FR-159**: System MUST track conversion metrics (contact form submissions) in analytics dashboard
- **FR-160**: System MUST provide date range selector in analytics dashboard: last 7/30/90 days, custom
- **FR-161**: System MUST allow agents to change their password in settings
- **FR-162**: System MUST allow agents to configure email notification preferences in settings
- **FR-163**: System MUST allow agents to download all their data (GDPR compliance) in settings

#### Admin Dashboard Features

- **FR-164**: System MUST display overview stats on admin dashboard home: total agents, active agents, pending content submissions (with urgent indicator if >10), total properties across network, build queue depth
- **FR-165**: System MUST display charts on admin dashboard home: agent growth over time, content approval trends, network-wide traffic
- **FR-166**: System MUST display recent activity feed on admin dashboard home: agent logins, content submissions, builds
- **FR-167**: System MUST display pending tasks widget (content needing approval) on admin dashboard home
- **FR-168**: System MUST provide Agents section with features: Create, List, View, Edit, Delete agents
- **FR-169**: System MUST provide Territories section with features: Map view, Create, Edit, Delete territories, Property counting
- **FR-170**: System MUST provide Content Moderation section with queue view, Approve/Reject actions, Bulk actions
- **FR-171**: System MUST provide Build Queue section with: Monitor builds, Manual triggers, View logs
- **FR-172**: System MUST provide Global Content section with: Edit templates, Deploy to all sites
- **FR-173**: System MUST display network-wide analytics: total traffic across all agent sites, agent performance comparison table, property view statistics, content engagement metrics
- **FR-174**: System MUST display top performing agents in analytics dashboard
- **FR-175**: System MUST display agents needing attention (low traffic, no content, etc.) in analytics dashboard
- **FR-176**: System MUST provide date range selector in analytics dashboard
- **FR-177**: System MUST allow admins to configure platform settings
- **FR-178**: System MUST allow admins to configure email template settings
- **FR-179**: System MUST allow admins to configure webhook settings (Apex27 details)
- **FR-180**: System MUST allow admins to manage API keys (Mapbox, OS Data Hub)
- **FR-181**: System MUST allow super admins to create and manage admin users

#### WordPress Main Site Integration

- **FR-182**: System MUST provide public API endpoint /api/public/agents returning all active agents with fields: id, name, email, phone, bio, subdomain, avatar_url
- **FR-183**: System MUST provide public API endpoint /api/public/properties with query parameters: transaction_type, min_price, max_price, bedrooms, location, postcode
- **FR-184**: System MUST enable CORS for WordPress domain on public API endpoints
- **FR-185**: System MUST cache public API responses for 5 minutes
- **FR-186**: System MUST provide example embed code for agent directory widget
- **FR-187**: System MUST provide example embed code for property search widget

#### Email Notifications

- **FR-188**: System MUST send agent welcome email with credentials and setup instructions immediately after agent account creation
- **FR-189**: System MUST send content submission received confirmation email to agent
- **FR-190**: System MUST send content approved email to agent with link to live post
- **FR-191**: System MUST send content rejected email to agent with rejection feedback
- **FR-192**: System MUST send build failed email to admin team with error details
- **FR-193**: System MUST send weekly summary email to each agent with analytics
- **FR-194**: System MUST send password reset email via Supabase Auth
- **FR-195**: System MUST use HTML email templates with brand styling
- **FR-196**: System MUST personalize emails with agent name, content title, etc.
- **FR-197**: System MUST include unsubscribe links in marketing emails only (not transactional emails)

#### Security & Compliance

- **FR-198**: System MUST enforce JWT token expiry of 1 hour
- **FR-199**: System MUST implement refresh token rotation
- **FR-200**: System MUST enforce 2FA (TOTP) for all admin accounts
- **FR-201**: System MUST rate limit login attempts: 5 per 15 minutes per IP address
- **FR-202**: System MUST lock accounts after 10 consecutive failed login attempts
- **FR-203**: System MUST implement Row Level Security (RLS) policies on all database tables
- **FR-204**: System MUST allow admins to access all data via RLS policies
- **FR-205**: System MUST restrict agents to access only their own data via RLS policies
- **FR-206**: System MUST allow public access only to published content via RLS policies
- **FR-207**: System MUST use service role key only in API routes, never expose it client-side
- **FR-208**: System MUST require authentication on all API routes except public endpoints
- **FR-209**: System MUST implement role-based authorization checks on all protected routes
- **FR-210**: System MUST validate webhook signatures using HMAC-SHA256
- **FR-211**: System MUST configure CORS correctly for all API endpoints
- **FR-212**: System MUST rate limit API requests: 100 per minute per IP address
- **FR-213**: System MUST display cookie consent banner on all agent sites
- **FR-214**: System MUST provide privacy policy templates
- **FR-215**: System MUST allow agents to export all their data (GDPR right to data portability)
- **FR-216**: System MUST allow admins to delete agent accounts and all associated data (GDPR right to erasure)
- **FR-217**: System MUST maintain audit logs tracking who accessed/changed what data
- **FR-218**: System MUST use semantic HTML for accessibility
- **FR-219**: System MUST implement proper heading hierarchy (H1-H6) for accessibility
- **FR-220**: System MUST require alt text for all images
- **FR-221**: System MUST support full keyboard navigation
- **FR-222**: System MUST be screen reader compatible
- **FR-223**: System MUST maintain color contrast ratios of at least 4.5:1 (WCAG 2.1 AA)
- **FR-224**: System MUST display visible focus indicators for keyboard navigation
- **FR-225**: System MUST provide proper form labels and error messages for accessibility

#### Performance Requirements

- **FR-226**: System MUST achieve page load times under 1 second (p95) on 4G connection for agent microsites
- **FR-227**: System MUST achieve page load times under 2 seconds (p95) for admin/agent dashboards
- **FR-228**: System MUST achieve API response times under 200ms (p95)
- **FR-229**: System MUST complete per-agent site builds in under 30 seconds (p95)
- **FR-230**: System MUST support 20 concurrent builds without performance degradation
- **FR-231**: System MUST support 1,000+ agent sites simultaneously
- **FR-232**: System MUST handle 100+ concurrent dashboard users without performance degradation
- **FR-233**: System MUST process 10 Apex27 webhooks per second without queue buildup
- **FR-234**: System MUST achieve Lighthouse Performance score of 95+ for agent microsites
- **FR-235**: System MUST achieve Lighthouse Accessibility score of 95+ for agent microsites
- **FR-236**: System MUST achieve Lighthouse Best Practices score of 95+ for agent microsites
- **FR-237**: System MUST achieve Lighthouse SEO score of 95+ for agent microsites

#### Monitoring & Operations

- **FR-238**: System MUST integrate Vercel Analytics for real-time performance monitoring
- **FR-239**: System MUST integrate Sentry for error tracking (JavaScript and API errors)
- **FR-240**: System MUST provide custom metrics dashboard in admin panel displaying: API response times, build queue depth, database query times, webhook success rate
- **FR-241**: System MUST send critical alerts (SMS/phone) for: production site down >5 minutes, database connection lost, API error rate >10% for 5 minutes
- **FR-242**: System MUST send warning alerts (email within 1 hour) for: API response time >500ms (p95), build queue depth >50, webhook sync errors (3+ in 1 hour)
- **FR-243**: System MUST send info alerts (daily digest) for: daily metrics summary, content pending approval count, system performance report
- **FR-244**: System MUST perform automated daily database backups with 30-day retention via Supabase
- **FR-245**: System MUST implement real-time replication for media files via Supabase Storage
- **FR-246**: System MUST maintain code version control via Git
- **FR-247**: System MUST achieve Recovery Point Objective (RPO) of 1 hour max data loss
- **FR-248**: System MUST achieve Recovery Time Objective (RTO) of 4 hours max downtime

### Key Entities

- **User**: Represents a person who can log into the system, with attributes: id, email, role (super_admin/admin/agent), first_name, last_name, phone, avatar_url, auth_user_id (references Supabase Auth), created_at, updated_at
- **Agent**: Represents a real estate agent with their own microsite, with attributes: id, user_id, subdomain, apex27_branch_id, bio, qualifications (array), social_media_links (JSON), status (active/suspended/archived), created_at, updated_at. Relationships: belongs to User, has many Properties, has many Territories, has many ContentSubmissions, has many BuildJobs
- **Property**: Represents a real estate listing synced from Apex27, with attributes: id, agent_id, apex27_id, transaction_type (sale/let/commercial), title, description, price, bedrooms, bathrooms, property_type, address (JSON), postcode, location (PostGIS point), images (JSON array), features (array), floor_plan_url, virtual_tour_url, status (available/under_offer/sold/let), is_featured, is_hidden, raw_data (JSON), created_at, updated_at. Relationships: belongs to Agent
- **Territory**: Represents a geographic area assigned to an agent, with attributes: id, agent_id, name, boundary (PostGIS geography polygon), property_count, property_count_updated_at, created_at, updated_at. Relationships: belongs to Agent
- **ContentSubmission**: Represents user-generated content created by agents, with attributes: id, agent_id, content_type (blog_post/area_guide/review/fee_structure), title, slug, content_body (rich text), excerpt, featured_image_url, seo_meta_title, seo_meta_description, status (draft/pending_review/approved/rejected/published), rejection_reason, submitted_at, reviewed_at, reviewed_by_user_id, published_at, version, parent_version_id, created_at, updated_at. Relationships: belongs to Agent, belongs to Reviewer (User), has many child versions (ContentSubmission)
- **BuildJob**: Represents a queued or completed site build for an agent, with attributes: id, agent_id, priority (1-4), status (pending/processing/completed/failed), trigger_reason, build_logs, started_at, completed_at, error_message, retry_count, created_at, updated_at. Relationships: belongs to Agent
- **GlobalContent**: Represents platform-wide templates and legal pages, with attributes: id, content_type (header/footer/privacy_policy/terms_of_service/cookie_policy), content_body (HTML/JSON/Markdown), version, is_published, published_at, created_by_user_id, created_at, updated_at. Relationships: belongs to Creator (User)
- **AuditLog**: Represents a record of data changes for compliance, with attributes: id, user_id, entity_type, entity_id, action (create/update/delete), old_values (JSON), new_values (JSON), ip_address, user_agent, created_at. Relationships: belongs to User
- **ContactFormSubmission**: Represents a contact form submission from an agent microsite, with attributes: id, agent_id, property_id (optional), name, email, phone, message, source_page, referrer, created_at. Relationships: belongs to Agent, optionally belongs to Property

## Success Criteria

### Measurable Outcomes

- **SC-001**: Admins can create a new agent account, and the agent can receive credentials, log in, and update their profile in under 5 minutes
- **SC-002**: Properties from Apex27 appear on the correct agent's microsite within 5 minutes of webhook delivery
- **SC-003**: Agents can create and submit content for review in under 10 minutes, and admins can approve or reject content in under 2 minutes
- **SC-004**: Agent microsites load in under 1 second (p95) on 4G connections with Lighthouse Performance score of 95+
- **SC-005**: System handles 1,000+ agent microsites simultaneously without performance degradation
- **SC-006**: System processes up to 20 concurrent site builds without queue delays
- **SC-007**: Build jobs complete in under 30 seconds (p95) from queue entry to live deployment
- **SC-008**: API endpoints respond in under 200ms (p95) for all authenticated requests
- **SC-009**: System achieves 99.9% uptime measured over any 30-day period
- **SC-010**: Webhook processing handles 10 requests per second from Apex27 without errors
- **SC-011**: Territory creation with property count calculation completes in under 10 seconds
- **SC-012**: Global content changes deploy to all agent sites in under 30 minutes for 100+ agents
- **SC-013**: Agent analytics dashboard loads data in under 3 seconds
- **SC-014**: 95% of content submissions are approved or rejected within 24 hours
- **SC-015**: Zero critical security vulnerabilities in production (OWASP Top 10 compliance verified)
- **SC-016**: All agent microsites achieve WCAG 2.1 AA accessibility compliance
- **SC-017**: Agent satisfaction score averages 4/5 or higher based on quarterly surveys
- **SC-018**: Content approval workflow reduces admin review time by 60% compared to manual processes
- **SC-019**: Automated property synchronization eliminates manual property data entry, saving 10+ hours per week per agent
- **SC-020**: Platform scales to support 100+ agents within first 6 months of launch

## Assumptions

- **Assumption 1**: Apex27 CRM will provide webhook documentation including payload structure, signature algorithm, and available events before development begins
- **Assumption 2**: OS Data Hub API access is available with sufficient quota for residential property count queries (estimated 50-100 queries per month)
- **Assumption 3**: Mapbox GL JS will be used for territory mapping with appropriate API key and usage limits
- **Assumption 4**: Vercel hosting plan supports required concurrent builds, bandwidth, and serverless function executions
- **Assumption 5**: Supabase Pro plan provides sufficient database storage, API requests, and storage capacity for 1,000+ agents
- **Assumption 6**: Google Analytics 4 and Google Tag Manager setup will be provided by the client or configured during implementation
- **Assumption 7**: SendGrid or similar email service will be used for transactional emails with appropriate sending limits
- **Assumption 8**: DNS configuration for wildcard subdomain (*.agents.nestassociates.com) can be set up via Cloudflare
- **Assumption 9**: Agent microsites will use a provided design system or brand guidelines (Tailwind CSS with shadcn/ui)
- **Assumption 10**: Initial launch will support 16 agents with plans to scale to 1,000+ over time
- **Assumption 11**: Content moderation will be performed by human admins, not automated AI moderation
- **Assumption 12**: Property images from Apex27 will be in standard web formats (JPEG, PNG) and reasonable file sizes (<5MB each)
- **Assumption 13**: Agents will have basic computer literacy to use the dashboard and rich text editor
- **Assumption 14**: Legal pages (privacy policy, terms of service, cookie policy) content will be provided by the client or legal team
- **Assumption 15**: Session timeout of 1 hour is acceptable for agent and admin users with refresh token rotation
- **Assumption 16**: Build queue prioritization (P1-P4) is sufficient for handling various content update scenarios
- **Assumption 17**: 5-minute cache for public API endpoints is acceptable for WordPress integration
- **Assumption 18**: UK region for Supabase is acceptable for data residency and performance
- **Assumption 19**: Astro 4.x is the appropriate static site generator for the microsite requirements
- **Assumption 20**: Turborepo is the appropriate monorepo tool for managing multiple packages (dashboard, agent sites, shared libraries)
