# Feature Specification: Redis Rate Limiting & OpenAPI Documentation

**Feature Branch**: `007-redis-ratelimit-openapi`
**Created**: 2025-11-29
**Status**: Draft
**Input**: User description: "Redis rate limiting with Upstash and OpenAPI/Swagger documentation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Distributed Rate Limiting (Priority: P1)

As a platform operator, I need rate limiting that works reliably across multiple server instances so that the system remains protected from abuse regardless of which server handles a request.

**Why this priority**: The current in-memory rate limiting resets on each deployment and doesn't work across distributed server instances. This is a production security requirement that must be addressed before scaling.

**Independent Test**: Can be fully tested by deploying to multiple server instances and verifying rate limits persist across requests routed to different servers. Delivers protection against brute-force attacks on login and contact forms.

**Acceptance Scenarios**:

1. **Given** a user has exceeded the rate limit on server instance A, **When** their next request is routed to server instance B, **Then** the rate limit is still enforced
2. **Given** the application is redeployed, **When** a user who was rate-limited before deployment makes another request, **Then** their rate limit state is preserved
3. **Given** a user has 4 remaining login attempts, **When** they make a failed login request, **Then** they see 3 remaining attempts displayed
4. **Given** rate limit storage is temporarily unavailable, **When** a user makes a request, **Then** the system falls back to allowing the request (fail-open) and logs the issue

---

### User Story 2 - API Documentation Portal (Priority: P2)

As a developer integrating with the Nest platform, I need comprehensive API documentation with interactive examples so that I can understand available endpoints and test them without reading source code.

**Why this priority**: API documentation improves developer experience and reduces support burden. While not a security requirement, it's essential for maintainability and potential third-party integrations.

**Independent Test**: Can be fully tested by accessing the documentation portal and successfully executing test calls against documented endpoints. Delivers self-service API exploration for developers.

**Acceptance Scenarios**:

1. **Given** a developer navigates to the API documentation URL, **When** the page loads, **Then** they see a categorized list of all API endpoints with descriptions
2. **Given** a developer is viewing an endpoint's documentation, **When** they click "Try it out", **Then** they can enter parameters and execute a test request
3. **Given** a developer views a POST endpoint, **When** they examine the documentation, **Then** they see the expected request body schema with field descriptions and validation rules
4. **Given** an API endpoint is updated, **When** the documentation is regenerated, **Then** the changes are automatically reflected without manual updates

---

### User Story 3 - Rate Limit Feedback (Priority: P3)

As a user who has been rate-limited, I need clear feedback about when I can retry so that I'm not frustrated by unexplained failures.

**Why this priority**: Good user experience during rate limiting reduces confusion and support requests. Important but not critical for launch.

**Independent Test**: Can be fully tested by triggering rate limits on login/contact forms and verifying user-friendly error messages with retry timing.

**Acceptance Scenarios**:

1. **Given** a user has been rate-limited on the login form, **When** they attempt another login, **Then** they see a message indicating when they can try again
2. **Given** a user submits the contact form too many times, **When** they are rate-limited, **Then** they see how long they must wait before submitting again

---

### Edge Cases

- What happens when the rate limit storage service is temporarily unavailable?
- How does the system handle clock skew between distributed servers?
- What happens if a user's IP address changes mid-session (VPN, mobile networks)?
- How are rate limits handled for authenticated vs unauthenticated requests?
- What happens if an API endpoint is removed but still documented?

## Requirements *(mandatory)*

### Functional Requirements

**Rate Limiting**:
- **FR-001**: System MUST use distributed storage for rate limiting state that persists across server instances and deployments
- **FR-002**: System MUST rate-limit login attempts to 5 attempts per email address per 15 minutes
- **FR-003**: System MUST rate-limit contact form submissions to 5 requests per IP address per hour
- **FR-004**: System MUST gracefully degrade to allowing requests if rate limit storage is unavailable (fail-open with logging)
- **FR-005**: System MUST provide the existing rate limiter interface (`isRateLimited()`, `getRemainingAttempts()`, `resetRateLimit()`) for backwards compatibility
- **FR-006**: System MUST return remaining attempt count and reset time in rate limit responses

**API Documentation**:
- **FR-007**: System MUST provide interactive API documentation accessible via a web interface
- **FR-008**: System MUST automatically generate request/response schemas from existing validation definitions
- **FR-009**: System MUST categorize endpoints by domain (Auth, Admin, Agent, Public, Webhooks)
- **FR-010**: System MUST document all public and authenticated API endpoints with descriptions
- **FR-011**: System MUST include example request/response payloads for each endpoint
- **FR-012**: System MUST protect the API documentation page with appropriate access controls (admin-only or development-only)

### Key Entities

- **Rate Limit Record**: Identifier (email or IP), request count, window start time, window duration
- **API Endpoint**: Path, HTTP method, description, request schema, response schema, authentication requirements, category/tag
- **API Category**: Name (Auth, Admin, Agent, Public, Webhooks), description, list of related endpoints

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Rate limits persist correctly across application deployments (100% consistency)
- **SC-002**: Rate limits are enforced correctly when requests are distributed across multiple server instances (100% consistency)
- **SC-003**: Developers can find and understand any API endpoint within 2 minutes using the documentation
- **SC-004**: All 40+ API endpoints are documented with request/response schemas
- **SC-005**: Documentation auto-generation achieves 90%+ accuracy with existing validation schemas
- **SC-006**: Rate limit storage failure results in logged warnings rather than user-facing errors (zero user impact from storage outages)

## Assumptions

- Upstash Redis will be used for rate limit storage (REST-based, serverless-friendly)
- OpenAPI 3.0 specification format will be used for API documentation
- Swagger UI will be used for the interactive documentation interface
- Existing Zod validation schemas can be converted to OpenAPI schemas programmatically
- The documentation portal will be accessible at `/api-docs` route
- Environment variables for Redis connection will follow Upstash's standard naming (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)

## Out of Scope

- Rate limiting for all API endpoints (only login and contact form for now)
- API versioning system
- SDK generation from OpenAPI spec
- Rate limit dashboard/analytics
- Webhook signature validation (separate feature)
