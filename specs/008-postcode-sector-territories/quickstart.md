# Quickstart: Postcode Sector Territory Subdivision

**Feature**: 008-postcode-sector-territories
**Date**: 2025-12-18

## Prerequisites

- Node.js 18+
- pnpm installed
- Supabase CLI installed
- Access to Supabase project
- OS Data Hub API key (for property counts)

## Setup Steps

### 1. Switch to Feature Branch

```bash
git checkout 008-postcode-sector-territories
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Database Migration

```bash
# Apply the sectors migration
supabase db push

# Or run manually:
supabase migration up
```

### 4. Import Sector Boundary Data

#### Download Source Data

1. Download from [Edinburgh DataShare](https://datashare.ed.ac.uk/handle/10283/2597)
2. Extract `GB_Postcodes.zip`
3. Locate `Distribution/Sectors.*` shapefile

#### Convert and Import

```bash
# Convert shapefile to GeoJSON (requires GDAL)
# -t_srs EPSG:4326 ensures WGS84 coordinate system
ogr2ogr -f GeoJSON data/sectors.geojson Distribution/Sectors.shp -t_srs EPSG:4326

# Run import script (reads from data/sectors.geojson by default)
pnpm run import:sectors

# Or specify a custom path:
pnpm run import:sectors /path/to/sectors.geojson
```

The import script will:
- Parse ~12,000 sector polygons
- Generate SQL batch files in `sector_batches/`
- Import to `postcode_sectors` table

### 5. Start Development Server

```bash
pnpm run dev --filter=@nest/dashboard
```

Dashboard will be at http://localhost:3000

## Testing the Feature

### Manual Testing

1. Navigate to **Territories** page
2. Load a district area (e.g., "TA")
3. Click on a district to expand and see sectors
4. Select specific sectors
5. Assign to an agent
6. Verify partial assignment indicator on district

### API Testing

```bash
# List sectors for a district
curl http://localhost:3000/api/admin/sectors/list?district=TA1

# Get property count for a sector
curl http://localhost:3000/api/admin/sectors/TA1%201/count

# Check conflicts before assignment
curl -X POST http://localhost:3000/api/admin/territories/check-conflicts \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "...", "postcode_code": "TA1", "sector_codes": ["TA1 1", "TA1 2"]}'
```

## Key Files

| File | Purpose |
|------|---------|
| `supabase/migrations/2025XXXX_add_postcode_sectors.sql` | Database schema |
| `apps/dashboard/app/api/admin/sectors/list/route.ts` | List sectors API |
| `apps/dashboard/app/api/admin/sectors/[code]/count/route.ts` | Property count API |
| `apps/dashboard/components/admin/postcode-page-client.tsx` | Territory UI (modified) |
| `apps/dashboard/components/admin/postcode-map.tsx` | Map component (modified) |
| `scripts/import-sectors.ts` | Sector data import script |

## Environment Variables

Add to `apps/dashboard/.env.local`:

```bash
# Already configured:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=...
OS_DATA_HUB_API_KEY=...
```

No new environment variables required for this feature.

## Troubleshooting

### "No sectors found for district"

- Check if sector data has been imported
- Verify the district exists in `postcodes` table
- BT (Northern Ireland) postcodes don't have sector data

### "Conflict detected" when assigning

- Another agent may have the district or overlapping sectors
- Use `/api/admin/territories/check-conflicts` to see details
- Must reassign or remove existing assignment first

### Import script fails

- Ensure GDAL is installed for ogr2ogr
- Check GeoJSON file is valid
- Verify PostGIS extension is enabled in Supabase

## Data Attribution

Sector boundary data sourced from Edinburgh DataShare (Geolytix 2012).

Required attribution:
> "Postal Boundaries © GeoLytix copyright and database right 2012. Contains Ordnance Survey data © Crown copyright and database right 2012. Contains Royal Mail data © Royal Mail copyright and database right 2012. Contains National Statistics data © Crown copyright and database right 2012."
