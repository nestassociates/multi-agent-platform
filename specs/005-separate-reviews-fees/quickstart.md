# Quickstart: Separate Reviews & Fees Implementation

**Feature**: 005-separate-reviews-fees
**Estimated Time**: 2-3 hours

## Prerequisites

- [ ] Git branch checked out: `005-separate-reviews-fees`
- [ ] Supabase project access
- [ ] Google Cloud Console access (for Maps Embed API key)
- [ ] Dev server running: `cd apps/dashboard && pnpm run dev`

## Implementation Checklist

### Phase 1: Database Migrations (15 min)

- [ ] Create migration file: `supabase/migrations/20251126000001_archive_old_content_types.sql`
- [ ] Create migration file: `supabase/migrations/20251126000002_create_agent_fees.sql`
- [ ] Create migration file: `supabase/migrations/20251126000003_add_google_place_id.sql`
- [ ] Run migrations: Use Supabase MCP tool `apply_migration` for each file
- [ ] Verify migrations: Check `list_tables` includes agent_fees, check agents has google_place_id column

### Phase 2: Update Validation & Types (15 min)

- [ ] Update `packages/validation/src/content.ts` line 8: Change enum to `['blog_post', 'area_guide']`
- [ ] Create `packages/validation/src/fees.ts` with feeStructureSchema
- [ ] Update `packages/validation/src/index.ts`: Export fees module
- [ ] Update `packages/shared-types/src/entities.ts` line 11: Update ContentType
- [ ] Add AgentFee interface to `packages/shared-types/src/entities.ts`
- [ ] Add google_place_id to Agent interface in `packages/shared-types/src/entities.ts`
- [ ] Run build: `pnpm run build --filter=@nest/validation --filter=@nest/shared-types`

### Phase 3: Update Content System (15 min)

- [ ] Update `apps/dashboard/components/agent/content-form.tsx` lines 21-26: Remove review/fee options
- [ ] Update `apps/dashboard/app/(agent)/content/page.tsx` lines 42-47: Remove from labels
- [ ] Update `apps/dashboard/app/(agent)/content/page.tsx` line 74: Add `.eq('is_archived', false)`
- [ ] Update `apps/dashboard/app/api/agent/content/route.ts` line 165: Add `.eq('is_archived', false)`
- [ ] Test: Create blog post, verify only 2 options in dropdown
- [ ] Test: View content list, verify old review/fee content not shown

### Phase 4: Fee Structure System (45 min)

- [ ] Create `apps/dashboard/app/api/agent/fees/route.ts` with GET and POST handlers
- [ ] Create `apps/dashboard/components/agent/fee-structure-form.tsx` with React Hook Form
- [ ] Create `apps/dashboard/app/(agent)/fees/page.tsx` with form and display
- [ ] Test: Save fee structure, verify data in database
- [ ] Test: Update fees, verify changes persist
- [ ] Test: Validation errors for invalid percentages

### Phase 5: GMB Reviews Integration (30 min)

- [ ] Get Google Maps Embed API key from Google Cloud Console
- [ ] Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env.local`
- [ ] Update `apps/dashboard/app/api/agent/profile/route.ts`: Add google_place_id to PATCH handler
- [ ] Create `apps/dashboard/components/agent/gmb-place-id-form.tsx`
- [ ] Create `apps/dashboard/components/agent/gmb-reviews-widget.tsx` (use API key from env)
- [ ] Create `apps/dashboard/app/(agent)/reviews/page.tsx`
- [ ] Test: Save Place ID, verify widget displays
- [ ] Test: Update Place ID, verify widget updates

### Phase 6: Navigation & Polish (15 min)

- [ ] Update `apps/dashboard/app/(agent)/layout.tsx`: Add Reviews and Fees nav links
- [ ] Test: Navigate to all new pages from menu
- [ ] Test: Full user flow for each user story (P1, P2, P3)
- [ ] Verify TypeScript compiles: `pnpm run build --filter=@nest/dashboard`

## Quick Commands

```bash
# Start dev server
cd apps/dashboard && pnpm run dev

# Run migrations (use Supabase MCP)
# (execute via Claude Code MCP tools)

# Build packages after type changes
pnpm run build --filter=@nest/validation --filter=@nest/shared-types

# Build dashboard
pnpm run build --filter=@nest/dashboard

# Test API endpoints
curl http://localhost:3001/api/agent/fees  # Should return 401 (not auth in curl)
```

## Testing Scenarios

### Scenario 1: Content Type Restriction
1. Log in as agent
2. Navigate to /content/new
3. Verify dropdown shows only "Blog Post" and "Area Guide"
4. Create a blog post successfully
5. Verify content list doesn't show old review/fee content

### Scenario 2: Fee Structure
1. Log in as agent
2. Navigate to /fees
3. Enter sales: 1.5%, lettings: 10%, min fee: £2000
4. Click Save
5. Verify fees display below form
6. Try invalid value (150%), verify validation error

### Scenario 3: GMB Reviews
1. Log in as agent
2. Navigate to /reviews
3. Find Google Place ID using provided link
4. Enter Place ID (format: ChIJ...)
5. Verify embedded map widget appears showing reviews

## Troubleshooting

**Issue**: Content validation errors after migration
**Fix**: Rebuild validation package: `pnpm run build --filter=@nest/validation`

**Issue**: TypeScript errors on ContentType
**Fix**: Rebuild shared-types: `pnpm run build --filter=@nest/shared-types`

**Issue**: Maps widget shows error
**Fix**: Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local, verify API key restrictions in Google Cloud Console

**Issue**: Fee structure not saving
**Fix**: Check database - verify agent_fees table exists and RLS policies are enabled
