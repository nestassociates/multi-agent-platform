# Feature Specification: Content Submission System Refactor

**Feature Branch**: `003-content-submission-refactor`
**Created**: 2025-11-24
**Status**: Draft
**Input**: User description: "Comprehensive review and refactor of the content submission and moderation system to improve UX, security, and functionality for both administrators and agents."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Content Rendering (Priority: P1)

As an administrator or agent, when I view submitted content, the system must sanitize all HTML to prevent malicious scripts from executing, protecting both reviewers and end users from XSS attacks.

**Why this priority**: Security vulnerability that could compromise the entire platform. Must be fixed before any other improvements to prevent potential exploitation.

**Independent Test**: Can be fully tested by submitting content with malicious script tags and verifying they are sanitized when rendered in the preview/review pages. Delivers immediate security hardening of the platform.

**Acceptance Scenarios**:

1. **Given** an agent submits content with `<script>alert('XSS')</script>` in the body, **When** an admin views the content in the moderation queue, **Then** the script tag is stripped or escaped and does not execute
2. **Given** an agent submits content with `<img src=x onerror="alert('XSS')">` in the body, **When** the content is rendered in preview or review, **Then** the malicious attributes are removed while preserving safe HTML
3. **Given** approved content contains user-submitted HTML, **When** published to the agent's public site, **Then** all content is sanitized before rendering
4. **Given** an agent views their own content preview, **When** the preview renders, **Then** HTML is sanitized to protect the agent from their own potentially malicious markup

---

### User Story 2 - Agent Content Editing (Priority: P2)

As an agent, when my content is in draft status or has been rejected, I want to edit and improve it without creating a new submission, maintaining the history and context of the original submission.

**Why this priority**: Blocking workflow issue preventing agents from iterating on rejected content. Without this, agents must create entirely new submissions, losing context and creating duplicate records.

**Independent Test**: Can be fully tested by creating a draft, editing it, then submitting and having it rejected, editing again, and resubmitting. Delivers complete editing workflow independently of other improvements.

**Acceptance Scenarios**:

1. **Given** an agent has a draft content submission, **When** they navigate to their content list and click "Edit", **Then** they are taken to an edit page with all fields pre-populated
2. **Given** an agent's content was rejected with feedback, **When** they view the rejection reason and click "Edit", **Then** they can modify the content and resubmit with status changing back to "pending_review"
3. **Given** an agent is editing existing content, **When** they save changes, **Then** the updated_at timestamp is updated and they see confirmation of save
4. **Given** an agent tries to edit approved or published content, **When** they attempt to access the edit page, **Then** they receive an error message explaining that approved content cannot be edited
5. **Given** an agent is editing a rejected submission, **When** they fix the issues noted in the rejection reason and resubmit, **Then** the rejection_reason field is cleared and reviewed_at is reset

---

### User Story 3 - Admin Content Filtering and Search (Priority: P3)

As an administrator, when reviewing the moderation queue, I want to filter content by type, agent, date range, and search by title so I can efficiently prioritize and process submissions without scrolling through an unmanageable list.

**Why this priority**: Scalability and efficiency issue that becomes critical as content volume grows. Currently loads all pending items at once, which will degrade performance with scale.

**Independent Test**: Can be fully tested by creating multiple content submissions of different types and dates, then using filters to narrow results and verifying pagination works correctly. Delivers immediate productivity improvement for admins.

**Acceptance Scenarios**:

1. **Given** the admin is on the moderation queue page with 50+ pending submissions, **When** they select "blog_post" from the content type filter, **Then** only blog post submissions are displayed
2. **Given** the admin wants to review a specific agent's submissions, **When** they search or select an agent from the filter dropdown, **Then** only that agent's pending content is shown
3. **Given** the admin wants to prioritize old submissions, **When** they select a date range filter for submissions older than 7 days, **Then** only submissions from that date range appear
4. **Given** the admin remembers part of a content title, **When** they type keywords into the search field, **Then** results are filtered in real-time to match titles containing those keywords
5. **Given** the queue has 100+ pending items, **When** the page loads, **Then** only the first 20 items are displayed with pagination controls to load more
6. **Given** filters are applied, **When** the admin approves or rejects an item, **Then** the item is removed from the filtered view without requiring a page refresh

---

### User Story 4 - Agent Image Upload (Priority: P4)

As an agent, when creating or editing content, I want to upload images directly from my computer using drag-and-drop or file picker, rather than needing to host images externally and paste URLs.

**Why this priority**: Major UX improvement that removes friction from the content creation process. Not blocking but significantly improves the agent experience and reduces errors from broken external image links.

**Independent Test**: Can be fully tested by creating content, dragging an image file onto the upload area, verifying it uploads to storage, and confirming the URL is saved to the content. Delivers standalone image management capability.

**Acceptance Scenarios**:

1. **Given** an agent is creating new content, **When** they drag an image file onto the featured image upload area, **Then** the image is uploaded to secure storage and a preview is displayed
2. **Given** an agent clicks the "Upload Image" button, **When** they select an image from their file system, **Then** the image is uploaded and the URL is automatically populated in the featured_image_url field
3. **Given** an agent uploads an image larger than 5MB, **When** the upload is attempted, **Then** they receive an error message explaining the size limit and suggesting compression
4. **Given** an agent uploads a non-image file, **When** the upload is attempted, **Then** they receive an error message explaining only image formats (JPEG, PNG, WebP, GIF) are accepted
5. **Given** an agent has uploaded an image, **When** they want to change it, **Then** they can upload a new image which replaces the previous one
6. **Given** an image upload fails due to network error, **When** the error occurs, **Then** the agent sees a clear error message with retry option

---

### User Story 5 - Agent Content Preview (Priority: P5)

As an agent, when creating or editing content, I want to preview how my content will appear on my public site before submitting it for review, ensuring formatting and images display correctly.

**Why this priority**: Confidence-building UX improvement that reduces submission-rejection cycles. Helps agents catch formatting issues before admin review, improving content quality.

**Independent Test**: Can be fully tested by creating content with various formatting, clicking preview, and verifying it matches the expected public site appearance. Delivers standalone preview capability without affecting other workflows.

**Acceptance Scenarios**:

1. **Given** an agent is creating content, **When** they click the "Preview" button, **Then** a modal opens showing the content rendered with site styling
2. **Given** the preview modal is open, **When** the agent views their content, **Then** HTML is properly sanitized and formatted as it will appear on the public site
3. **Given** the agent has added a featured image, **When** they preview the content, **Then** the image is displayed at the correct size and position
4. **Given** the agent is editing content, **When** they make changes and click preview again, **Then** the preview updates with the latest changes without requiring save
5. **Given** the preview modal is open, **When** the agent clicks "Close" or clicks outside the modal, **Then** the modal closes and they return to the editing view

---

### User Story 6 - Consistent Admin Approval Actions (Priority: P6)

As an administrator, when approving or rejecting content, I want both actions to use consistent modal dialogs that clearly explain the action and require confirmation, providing a professional and predictable user experience.

**Why this priority**: Polish and consistency improvement. The current mix of browser confirm() and Dialog components feels unprofessional but doesn't block functionality.

**Independent Test**: Can be fully tested by attempting to approve and reject content, verifying both use consistent Dialog components with appropriate messaging and loading states. Delivers improved admin UX independently.

**Acceptance Scenarios**:

1. **Given** an admin clicks "Approve" on a content submission, **When** the button is clicked, **Then** a Dialog opens asking for confirmation with a clear explanation of the approval action
2. **Given** the approval Dialog is open, **When** the admin confirms approval, **Then** the Dialog shows a loading state and then success feedback before closing
3. **Given** an admin clicks "Reject" on a content submission, **When** the button is clicked, **Then** a Dialog opens requiring a rejection reason (min 10 chars) with helpful placeholder text
4. **Given** the rejection Dialog is open, **When** the admin submits without meeting the minimum character requirement, **Then** validation feedback is shown inline
5. **Given** an admin is confirming an action, **When** they click outside the Dialog or press Escape, **Then** the Dialog closes without performing the action (safe default)
6. **Given** an approval or rejection is in progress, **When** the API call is pending, **Then** the Dialog buttons are disabled with loading indicators to prevent double-submission

---

### Edge Cases

- What happens when an agent tries to upload a 20MB image? System rejects with clear error message about 5MB size limit
- What happens when an admin's session expires during content review? System redirects to login and preserves the review URL for after authentication
- What happens when two admins try to approve the same content simultaneously? Last action wins, and both see success feedback (idempotent operation)
- What happens when an agent submits HTML content with deeply nested elements (1000+ levels)? Sanitizer handles gracefully with reasonable nesting limits (DOMPurify default: 256 levels)
- What happens when filtering returns zero results? Clear empty state message: "No content matches your filters" with button to reset filters
- What happens when pagination is on page 5 and a filter reduces results to only 2 pages? System redirects to last available page (page 2) automatically
- What happens when an image upload times out after 30 seconds? Clear error with retry button and suggestion to check image size/connection
- What happens when an agent edits content that was just approved by an admin? Edit is blocked with message: "This content has been approved and cannot be edited"
- What happens when content contains 100+ inline style attributes? Sanitizer strips unsafe styles while preserving safe text formatting
- What happens when preview is opened but content body is empty? Preview shows placeholder: "No content to preview" with styling demonstration

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST sanitize all user-submitted HTML content before rendering to prevent XSS attacks, using an industry-standard sanitization library
- **FR-002**: System MUST allow agents to edit content that is in "draft" or "rejected" status
- **FR-003**: System MUST prevent agents from editing content that is in "approved" or "published" status
- **FR-004**: Agents MUST be able to navigate from their content list to an edit page for editable submissions
- **FR-005**: Admin moderation queue MUST support filtering by content type (blog_post, area_guide, review, fee_structure)
- **FR-006**: Admin moderation queue MUST support filtering by agent (dropdown or search)
- **FR-007**: Admin moderation queue MUST support filtering by date range (submissions older than X days)
- **FR-008**: Admin moderation queue MUST support real-time search by content title
- **FR-009**: Admin moderation queue MUST implement pagination loading 20 items per page by default
- **FR-010**: System MUST support cursor-based pagination for efficient navigation of large content lists
- **FR-011**: System MUST allow agents to upload images via drag-and-drop interface
- **FR-012**: System MUST allow agents to upload images via file picker button
- **FR-013**: System MUST store uploaded images in secure, accessible cloud storage with unique URLs
- **FR-014**: System MUST validate uploaded files are images (JPEG, PNG, WebP, GIF formats only)
- **FR-015**: System MUST enforce maximum image upload size of 5MB
- **FR-016**: System MUST automatically populate the featured_image_url field when an image is successfully uploaded
- **FR-017**: Agents MUST be able to preview their content before submission
- **FR-018**: Content preview MUST render sanitized HTML with styling that matches the public site appearance
- **FR-019**: Content preview MUST display featured images at correct size and position
- **FR-020**: Admin approval action MUST use a modal dialog requiring explicit confirmation
- **FR-021**: Admin rejection action MUST use a modal dialog requiring rejection reason (min 10 chars, max 500 chars)
- **FR-022**: Both approval and rejection modals MUST show loading states during API calls
- **FR-023**: Both approval and rejection modals MUST prevent double-submission via button disabling
- **FR-024**: System MUST remove hardcoded statistics from the admin moderation page header
- **FR-025**: System MUST update content timestamps (updated_at) when edits are saved
- **FR-026**: System MUST clear rejection_reason and reviewed_at fields when rejected content is resubmitted
- **FR-027**: System MUST maintain version history when content is edited (using existing version and parent_version_id fields)
- **FR-028**: Filters applied in admin queue MUST persist in URL query parameters for bookmarking and sharing
- **FR-029**: System MUST provide clear error messages for failed image uploads with actionable guidance
- **FR-030**: System MUST handle image upload network failures with retry capability

### Key Entities

- **ContentSubmission**: Represents agent-created content awaiting review or published to their site. Key attributes include content_type, title, slug, content_body (sanitized HTML), status (draft, pending_review, approved, rejected, published), featured_image_url, SEO metadata, rejection_reason, and audit fields (submitted_at, reviewed_at, reviewed_by_user_id, published_at). Relationships: belongs to an Agent, reviewed by a User (admin/super_admin), may have parent_version_id linking to previous version.

- **ImageUpload**: Represents uploaded image files stored in cloud storage. Key attributes include file_name, file_size, mime_type, storage_url, uploaded_by (agent_id), uploaded_at. Relationships: belongs to an Agent, may be referenced by ContentSubmissions via featured_image_url.

- **ContentFilter**: Represents filter criteria applied to the admin moderation queue (not persisted, exists as UI state and URL params). Attributes include content_type, agent_id, date_range (start_date, end_date), search_query, page_number, items_per_page.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero XSS vulnerabilities in content rendering verified by automated security tests scanning for common attack vectors (script injection, event handlers, malicious attributes)
- **SC-002**: Agents can edit and resubmit rejected content in under 3 minutes from receiving rejection email to resubmission
- **SC-003**: Admins can filter the moderation queue by type, agent, or date and receive filtered results in under 2 seconds
- **SC-004**: Admins can review and approve/reject 10 content submissions in under 5 minutes using the improved interface
- **SC-005**: Image upload success rate exceeds 95% for images under 5MB on standard broadband connections
- **SC-006**: Agents can preview their content and make adjustments before submission, reducing rejection rate by at least 20%
- **SC-007**: 90% of agents successfully complete their first image upload without needing support documentation
- **SC-008**: Content moderation queue loads initial page (20 items) in under 1 second even with 1000+ total pending submissions
- **SC-009**: Filter application updates the displayed results within 500ms without full page reload
- **SC-010**: Zero content approval/rejection actions are accidentally double-submitted due to interface improvements
- **SC-011**: 100% of user-submitted HTML passes sanitization without breaking legitimate formatting (paragraphs, lists, headers, emphasis)
- **SC-012**: Agents report satisfaction score of 8+ out of 10 for the content creation and editing experience
