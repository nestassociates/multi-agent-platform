# Vercel Environment Variables Setup

**For**: Territory Management (Phase 8) to work on production

The territories page is failing with a 500 error because required environment
variables are missing in Vercel.

---

## Required Environment Variables for Territories

Add these to Vercel Dashboard → Settings → Environment Variables:

### 1. Mapbox Token (For Territory Mapping)

**Variable Name**: `NEXT_PUBLIC_MAPBOX_TOKEN`
**Value**: Your Mapbox access token (you already have this from MCP setup)
**From MCP Setup**: `pk.eyJ1IjoibmVzdGFzc29jaWF0ZXMi...`

**Where to find it:**
- Check your local `.env.local` or MCP configuration
- Or get it from: https://account.mapbox.com/access-tokens/

**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 2. OS Data Hub API Key (For Property Counting)

**Variable Name**: `OS_DATAHUB_API_KEY`
**Value**: Your OS Data Hub API key
**From Project Status**: `2IQxYrJUYbB...`

**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 3. OS Data Hub API Secret (Optional)

**Variable Name**: `OS_DATAHUB_API_SECRET`
**Value**: Your OS Data Hub API secret (if required)
**From Project Status**: `kZpbVf6a...`

**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## Environment Variables Summary

Here's what you need in Vercel (add any missing ones):

| Variable Name | Value Source | Required For | Status |
|---------------|--------------|--------------|--------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry dashboard | Error tracking | ✅ Added |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox account | Territory mapping | ❓ Check |
| `OS_DATAHUB_API_KEY` | OS Data Hub | Property counts | ❓ Check |
| `OS_DATAHUB_API_SECRET` | OS Data Hub | Property counts | ❓ Check |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project | Database | ✅ Should exist |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project | Database | ✅ Should exist |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project | Admin operations | ✅ Should exist |

---

## How to Add Environment Variables to Vercel

1. **Go to Vercel Dashboard**:
   https://vercel.com/nest-associates-projects/multi-agent-platform

2. **Navigate to Settings**:
   Settings → Environment Variables

3. **Add each variable**:
   - Click "Add New"
   - Enter **Key** (exact name from table above)
   - Enter **Value** (from your credentials)
   - Select **Environments**: Check all 3 boxes
   - Click "Save"

4. **Redeploy** (or wait for next auto-deploy):
   - New commits will trigger deployment
   - Or manually redeploy latest deployment

---

## Database Setup (Already Complete)

**Yes, territories are stored in the database!**

✅ **`territories` table exists** (created in Phase 2)
✅ **Columns**:
- `id` (UUID)
- `agent_id` (UUID, references agents)
- `name` (TEXT)
- `boundary` (GEOGRAPHY - PostGIS type for coordinates)
- `description` (TEXT, optional)
- `property_count` (INTEGER, auto-calculated)
- `created_at`, `updated_at` (TIMESTAMPTZ)

✅ **PostGIS functions created** (today's migration):
- Overlap detection
- Property counting
- Territory statistics
- Auto-update triggers

✅ **RLS policies exist** (from Phase 2):
- Admins can create/read/update/delete territories
- Agents can view own territories (read-only)

---

## What Happens When You Create a Territory

1. Admin draws polygon on Mapbox map
2. Frontend captures GeoJSON geometry
3. Form submits to `POST /api/admin/territories`
4. Backend:
   - Converts GeoJSON to WKT format
   - Checks for overlaps with existing territories (PostGIS)
   - Queries OS Data Hub for residential property count
   - Stores in `territories` table
   - PostGIS trigger auto-counts properties in boundary
5. Territory appears on map with agent's color
6. Territory listed in sidebar

**All coordinates and boundaries are stored in PostgreSQL with PostGIS.**

---

## Territory Data Storage

**Example territory record in database:**

```json
{
  "id": "uuid-here",
  "agent_id": "agent-uuid",
  "name": "Manchester City Centre",
  "description": "Covers Northern Quarter and Spinningfields",
  "boundary": "POLYGON((-2.24 53.48, -2.23 53.48, ...))", // WKT format
  "property_count": 247, // Auto-calculated
  "created_at": "2025-11-20T15:00:00Z",
  "updated_at": "2025-11-20T15:00:00Z"
}
```

The `boundary` field uses PostGIS `GEOGRAPHY` type:
- Stores polygon coordinates
- Enables spatial queries (overlaps, contains, intersects)
- Accurate earth-surface calculations
- Indexed with GiST for performance

---

## Testing Territories (Once Env Vars Added)

1. **Add Mapbox token to Vercel**
2. **Wait for redeployment** (2-3 minutes)
3. **Navigate to**: https://multi-agent-platform-eight.vercel.app/territories
4. **You should see**:
   - Interactive Mapbox map
   - Polygon drawing tool
   - Territory list sidebar
   - No errors!

---

## Current Issue Resolution

**Problem**: 500 error on /territories page
**Cause**: Missing environment variables + internal API fetch issue
**Fix**:
1. Added environment variables to Vercel (you need to do this)
2. Changed page to fetch directly from database (I just fixed this)

**After next deployment, territories will work!**

---

## Optional: Local Development Setup

For testing locally, add to `apps/dashboard/.env.local`:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibmVzdGFzc29jaWF0ZXMi... (your token)
OS_DATAHUB_API_KEY=2IQxYrJUYbB... (your key)
OS_DATAHUB_API_SECRET=kZpbVf6a... (your secret)
```

---

## What You Need to Do Right Now

**Step 1**: Add to Vercel (5 minutes):
- `NEXT_PUBLIC_MAPBOX_TOKEN` = (your Mapbox token from MCP)
- `OS_DATAHUB_API_KEY` = `2IQxYrJUYbB...` (from PROJECT_STATUS.md)
- `OS_DATAHUB_API_SECRET` = `kZpbVf6a...` (from PROJECT_STATUS.md)

**Step 2**: Wait for deployment (3 minutes)

**Step 3**: Test /territories page - should work!

---

**Once these are added, the territory management system will be fully functional!** 🗺️
