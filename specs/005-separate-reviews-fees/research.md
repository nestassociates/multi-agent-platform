# Research: Separate Reviews & Fees from Content System

**Feature**: 005-separate-reviews-fees
**Date**: 2025-11-26

## Research Questions

### Q1: How to handle archiving deprecated content types?

**Decision**: Use soft delete with `is_archived` boolean column

**Rationale**:
- Preserves data for potential future recovery or analysis
- Simple to implement (single column + UPDATE query)
- Minimal performance impact with partial index on archived records
- Allows CHECK constraint to permit old types only when is_archived=TRUE

**Alternatives considered**:
- Hard delete: Too risky, data loss is irreversible
- Separate archive table: More complex, requires data migration and duplicate schema
- Status enum: Less clear semantics than dedicated is_archived flag

### Q2: Should fees use dedicated table or JSONB column?

**Decision**: Dedicated `agent_fees` table with typed columns

**Rationale**:
- Same implementation effort as JSONB (similar complexity)
- Better queryability for reporting (can filter/aggregate on specific fee fields)
- Enforces validation at database level with CHECK constraints
- Easier to add indexes on specific columns later
- Clearer schema documentation

**Alternatives considered**:
- JSONB column in agents table: Faster initially but harder to query/report, no database-level validation
- Separate fees microservice: Over-engineered for simple fee storage

### Q3: Google My Business integration approach?

**Decision**: Embedded Google Maps widget with Place ID (V1)

**Rationale**:
- Zero backend complexity (no OAuth flow, token management, or scheduled sync)
- Works immediately with single API key from Nest Associates
- Google maintains the widget (styling, updates, functionality)
- Free tier: 25,000 loads/month sufficient for 100+ agents
- Can upgrade to full API integration later if needed

**Alternatives considered**:
- Full GMB API with OAuth: 10-day implementation, complex token encryption, requires per-agent OAuth consent
- Third-party review aggregator: Additional cost, vendor lock-in
- Manual review entry: High maintenance burden, prone to outdated data

### Q4: How to restrict content type validation?

**Decision**: Update Zod enum schema in validation package

**Rationale**:
- Centralized validation (packages/validation) already used project-wide
- Type-safe propagation to TypeScript via `z.infer`
- Validation works in both UI forms and API endpoints automatically
- Clear error messages when deprecated types attempted

**Alternatives considered**:
- Database-only constraint: Less helpful error messages, allows invalid API requests to reach database
- UI-only restriction: Can be bypassed via API calls
- Multiple validation layers: Redundant, harder to maintain

### Q5: Fee update workflow and permissions?

**Decision**: Agent self-service with immediate updates (no approval workflow)

**Rationale**:
- User requirement: "Agents can edit their own fees anytime"
- Reduces admin burden
- Faster for agents to respond to market changes
- RLS policies ensure agents can only edit their own fees

**Alternatives considered**:
- Admin approval workflow: Creates bottleneck, slower updates, admin overhead
- Read-only (admin-managed): Removes agent autonomy, not per requirements

## Technology Stack Decisions

### Frontend Framework
**Choice**: Next.js 14 App Router with React Server Components

**Rationale**: Already in use, provides SSR for fee/review pages, client components for forms

### Form Handling
**Choice**: React Hook Form with Zod resolver

**Rationale**: Already used in content-form.tsx, proven pattern in codebase

### API Pattern
**Choice**: Next.js Route Handlers (app/api/*)

**Rationale**: Existing pattern for agent/admin APIs, integrated with Supabase auth

### Database Migrations
**Choice**: Supabase SQL migrations

**Rationale**: Existing migration system in place, version controlled

### Styling
**Choice**: shadcn/ui components with Tailwind CSS

**Rationale**: Already implemented, consistent UI across dashboard

## Implementation Risks & Mitigations

### Risk 1: Breaking existing content workflow
**Mitigation**: Add `.eq('is_archived', false)` filter to all content queries, test with existing blog_post/area_guide content

### Risk 2: Google Maps API key exposure
**Mitigation**: Use `NEXT_PUBLIC_` prefix but restrict key in Google Cloud Console to specific HTTP referrers

### Risk 3: Concurrent fee updates
**Mitigation**: Upsert operation with `ON CONFLICT (agent_id) DO UPDATE`, display last_updated timestamp

### Risk 4: Invalid Place IDs
**Mitigation**: Basic format validation (starts with ChIJ), Google widget handles invalid IDs gracefully

## Performance Considerations

- **Fee API**: Simple CRUD, expected <100ms response time (single table lookup/update)
- **Reviews widget**: Client-side iframe, no server load, Google CDN handles performance
- **Content queries**: Partial index on `is_archived=false` ensures no performance degradation

## Security Considerations

- **Fee structure**: RLS policy restricts agents to own fees, public read access for displaying on agent sites
- **Google Place ID**: Non-sensitive public identifier, safe to store as plain text
- **API key**: Client-side exposure acceptable with HTTP referrer restrictions in Google Cloud Console
- **Archived content**: No sensitive data, soft delete prevents accidental exposure via UI
