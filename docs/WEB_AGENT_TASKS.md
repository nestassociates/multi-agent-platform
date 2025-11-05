# Tasks for Web Agent (GitHub Web Interface Only)

**Context**: These tasks can be completed using only GitHub web interface (no local environment, no MCP tools, no command line).

---

## Task 1: Add Status Filter to Main API Client ✏️

**File to Edit**: `apps/dashboard/lib/apex27/client.ts`

**Location 1** - Update interface (around line 19):

**Find this**:
```typescript
export interface GetListingsOptions {
  page?: number;
  pageSize?: number;
  minDtsUpdated?: string; // ISO 8601 datetime string for incremental sync
}
```

**Replace with**:
```typescript
export interface GetListingsOptions {
  page?: number;
  pageSize?: number;
  minDtsUpdated?: string; // ISO 8601 datetime string for incremental sync
  onlyMarketed?: boolean; // If true, only fetch marketed properties (not valuations/pending)
}
```

**Location 2** - Update getListings function (around line 40):

**Find this**:
```typescript
export async function getListings(
  options: GetListingsOptions = {}
): Promise<ListingsResponse> {
  const {
    page = 1,
    pageSize = 100, // Max 250, but 100 is reasonable
    minDtsUpdated,
  } = options;

  // Build query parameters
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (minDtsUpdated) {
    params.append('minDtsUpdated', minDtsUpdated);
  }
```

**Replace with**:
```typescript
export async function getListings(
  options: GetListingsOptions = {}
): Promise<ListingsResponse> {
  const {
    page = 1,
    pageSize = 100, // Max 250, but 100 is reasonable
    minDtsUpdated,
    onlyMarketed = true, // Default to only marketed properties
  } = options;

  // Build query parameters
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (minDtsUpdated) {
    params.append('minDtsUpdated', minDtsUpdated);
  }

  // Filter to only marketed properties (not valuations/pending)
  if (onlyMarketed) {
    params.append('websiteStatus', 'active');
  }
```

**Location 3** - Update getAllListings function (around line 115):

**Find this**:
```typescript
export async function getAllListings(
  minDtsUpdated?: string
): Promise<Apex27Listing[]> {
```

**Replace with**:
```typescript
export async function getAllListings(
  minDtsUpdated?: string,
  onlyMarketed: boolean = true
): Promise<Apex27Listing[]> {
```

**And find this** (around line 122):
```typescript
    const response = await getListings({ page, pageSize: 250, minDtsUpdated });
```

**Replace with**:
```typescript
    const response = await getListings({ page, pageSize: 250, minDtsUpdated, onlyMarketed });
```

**Commit Message**:
```
feat: add status filter to sync only marketed properties

- Add onlyMarketed parameter to getListings() (default: true)
- Filter using websiteStatus=active parameter
- Reduces sync from 10,880 total to ~200 marketed properties
- Prevents valuations and pending properties from syncing

This ensures agent microsites only show actively marketed properties,
not internal valuations or pending listings.
```

---

## Task 2: Document Branch-Agent Mapping 📄

**File to Create**: `docs/branch-agent-mapping.md`

**Content**:
```markdown
# Apex27 Branch to Agent Mapping

**Source**: Apex27 Main API
**Last Updated**: 2025-11-03

## Confirmed Branches (from API data)

### Active Nest Associates Branches

| Branch ID | Branch Name | Agent Name | Email | Properties (est) |
|-----------|-------------|------------|-------|------------------|
| 707 | Taunton Deane (A) | George Bailey | george.bailey@nestassociates.co.uk | ~1,500 |
| 709 | Taunton Deane (C) | James Warne | james.warne@nestassociates.co.uk | ~1,200 |
| 710 | South Somerset | Tom Lawrence | tom.lawrence@nestassociates.co.uk | ~1,800 |
| 713 | Unknown | Ellie Wills | ellie.wills@nestassociates.co.uk | ~800 |
| 715 | Unknown | Matt Hollow | matt.hollow@nestassociates.co.uk | ~900 |
| 716 | Unknown | Libby Last | libby.last@nestassociates.co.uk | ~400 |
| 717 | Unknown | Lyn Parent | lyn.parent@nestassociates.co.uk | ~600 |
| 1210 | Auckland (NZ) | Unknown | Unknown | ~200 |
| 1790 | Unknown | Unknown | Unknown | ~700 |
| 1954 | Unknown | Ross Walls | ross.walls@nestassociates.co.uk | ~500 |
| 1963 | Unknown | Unknown | Unknown | ~150 |
| 1983 | Cullompton | Georgina Davie | georgina.davie@nestassociates.co.uk | ~1,200 |
| 2342 | Unknown | Unknown | Unknown | ~300 |
| 2610 | Unknown | Unknown | Unknown | ~250 |
| 2741 | Unknown | Unknown | Unknown | ~400 |

**Total**: 15 unique branches

## Recommended Agent Creation

When creating agents in the dashboard, assign branch IDs as follows:

1. **Tom Lawrence** (South Somerset) - Branch 710
2. **George Bailey** (Taunton Deane A) - Branch 707
3. **James Warne** (Taunton Deane C) - Branch 709
4. **Georgina Davie** (Cullompton) - Branch 1983
5. **Lyn Parent** (Kent) - Branch 717
6. **Ellie Wills** - Branch 713
7. **Matt Hollow** - Branch 715
8. **Libby Last** - Branch 716
9. **Ross Walls** - Branch 1954

## Notes

- Branch IDs are stored as TEXT in `agents.apex27_branch_id` column
- Properties are matched by `listing.branch.id` from Apex27 API
- Properties without matching agent are skipped during sync
- Each agent's microsite will show only their branch's properties

## How to Update

To update test agent with branch ID:

1. Via Supabase SQL Editor (requires Supabase access):
```sql
UPDATE agents
SET apex27_branch_id = '710'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-agent@example.com');
```

2. Via Admin Dashboard (when profile editing is implemented):
- Navigate to Agents → Select Agent → Edit
- Set "Apex27 Branch ID" field
```

**Commit Message**:
```
docs: add Apex27 branch to agent mapping reference

Documents 15 branches found in Apex27 Main API with agent assignments.
Provides guidance for assigning branch IDs when creating agents.
```

---

## Task 3: Update README with Phase 4 Status 📖

**File to Edit**: `README.md`

**Find the Features/Progress section and add**:

```markdown
### Phase 4: Property Synchronization ✅ (Pending Status Filter)

**Implemented**:
- Apex27 Main API integration with webhook support
- Hybrid sync: Real-time webhooks + 6-hour full reconciliation
- Branch-based property assignment to agents
- PostGIS spatial data support
- Agent property view (`/my-properties`)
- Admin property management (`/properties`)

**Status**: Core implementation complete, pending status filter to sync only marketed properties (~200 vs 10,880 total in CRM).
```

**Commit Message**:
```
docs: update README with Phase 4 completion status
```

---

## What Web Agent CANNOT Do

These tasks require local environment or MCP tools that web agent doesn't have:

- ❌ Test API calls (needs curl/network access)
- ❌ Update database (needs Supabase MCP or SQL access)
- ❌ Run local sync (needs local dev environment)
- ❌ Add Vercel env vars (needs Vercel dashboard access)
- ❌ Deploy to Vercel (auto-deploys from GitHub, but needs env var first)
- ❌ Register webhooks (needs API access)

**These tasks need to be done by YOU or by Claude Code desktop version.**

---

## Summary

**Web Agent Can Do** (via GitHub):
1. ✅ Edit `apps/dashboard/lib/apex27/client.ts` to add status filter
2. ✅ Create `docs/branch-agent-mapping.md` documentation
3. ✅ Update `README.md` with progress

**You Need to Do** (requires access):
- Add `APEX27_API_KEY` to Vercel env vars
- Update test agent in database with branch ID
- Test the sync locally or in production
- Register webhook with Apex27

---

## Next Steps for You

After web agent completes their tasks:

1. **Add env var** in Vercel dashboard
2. **Wait for auto-deploy** from GitHub push
3. **Update test agent** via Supabase dashboard: `apex27_branch_id = '710'`
4. **Visit production**: https://multi-agent-platform-eight.vercel.app/properties
5. **Click "Trigger Manual Sync"** button
6. **Watch properties flow in!** 🎉
