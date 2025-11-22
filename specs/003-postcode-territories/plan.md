# Implementation Plan: Postcode-Based Territory Assignment

**Branch**: `003-postcode-territories` | **Date**: 2025-11-21 | **Spec**: [spec.md](./spec.md)

## Summary

Replace polygon-based territory drawing with postcode-based assignment using free OS Open Data. Admins click postcodes on the map, view property counts from OS Places API, and assign multiple postcodes to agents. This provides faster, more intuitive territory management using official UK postcode boundaries.

## Technical Context

**Language/Version**: TypeScript 5.3+ (Next.js 14 App Router)
**Primary Dependencies**: @supabase/supabase-js, Mapbox GL JS, proj4 (coordinate conversion)
**Storage**: PostgreSQL (Supabase) with PostGIS for spatial data
**Data Source**: OS Open Data - Code-Point Open or Boundary-Line (FREE download)
**Testing**: Manual testing with sample postcodes
**Target Platform**: Vercel (Next.js serverless functions)
**Project Type**: Web application (existing monorepo)
**Performance Goals**: Postcode selection <2s, property count display <3s
**Constraints**: Must handle large dataset (postcode districts), efficient map rendering
**Scale/Scope**: ~2,900 postcode districts (TA, BS, etc.), 5-20 postcodes per agent

## Constitution Check

*No project constitution defined - using general best practices*

✅ **All Gates Pass**:
- Replaces existing system with better UX
- Uses free, official data source
- Standard approach for UK territory management

## Key Design Decisions

### Postcode Granularity

**Decision**: Use postcode **districts** (TA1, TA2) not **units** (TA1 1AA, TA1 1AB)

**Rationale**:
- Districts are the standard unit for territory management
- ~2,900 districts vs ~1.7M units (manageable dataset)
- Easier to visualize and select on map
- Still provides accurate market sizing

### Data Import Strategy

**Decision**: One-time import via SQL migration

**Approach**:
1. Download OS Open Data (Code-Point Open)
2. Extract postcode districts and boundaries
3. Convert to SQL INSERT statements
4. Create migration file with all postcodes
5. Run once during deployment

**Alternative Considered**: API-based lookup
- Rejected: Would require ongoing API costs or rate limits

### Property Count Strategy

**Decision**: On-demand querying with 24-hour caching

**Approach**:
- Query OS Places API when postcode first selected
- Cache result in database (24-48 hours)
- Display cached count on subsequent selections
- Refresh button to update stale counts

**Alternative Considered**: Pre-calculate all counts
- Rejected: Would require ~2,900 API calls upfront, hit rate limits

## Project Structure

### New Database Tables

```sql
-- Postcode districts with boundaries
CREATE TABLE postcodes (
  code TEXT PRIMARY KEY,              -- e.g., 'TA1', 'BS1'
  boundary GEOGRAPHY(POLYGON, 4326),  -- PostGIS polygon
  center_point GEOGRAPHY(POINT, 4326), -- Center coordinates
  area_km2 DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property count cache
CREATE TABLE postcode_property_counts (
  postcode_code TEXT PRIMARY KEY REFERENCES postcodes(code),
  residential_count INTEGER,
  commercial_count INTEGER,
  mixed_count INTEGER,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_postcode FOREIGN KEY (postcode_code) REFERENCES postcodes(code) ON DELETE CASCADE
);

-- Many-to-many relationship
CREATE TABLE agent_postcodes (
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  postcode_code TEXT REFERENCES postcodes(code) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (agent_id, postcode_code)
);
```

### Modified Tables

```sql
-- Territories table modification
ALTER TABLE territories
ADD COLUMN assigned_postcodes TEXT[]; -- Array of postcode codes

-- Keep old boundary column for migration period
-- Can be dropped after full migration
```

## Implementation Phases

### Phase 0: Data Acquisition & Research

**Tasks**:
1. Download OS Open Data Code-Point Open dataset
2. Analyze CSV/Shapefile format
3. Extract postcode district boundaries
4. Research optimal import strategy (SQL vs API)
5. Determine postcode district list (~2,900 expected)

**Output**: Downloaded dataset, import strategy documented

### Phase 1: Database & Import

**Tasks**:
1. Create postcodes table with PostGIS
2. Create postcode_property_counts cache table
3. Create agent_postcodes junction table
4. Write import script (CSV → SQL)
5. Create migration with postcode INSERT statements
6. Run migration to populate postcodes
7. Add spatial indexes (GiST on boundary and center_point)

**Output**: Database seeded with UK postcode districts

### Phase 2: Map Interaction

**Tasks**:
1. Update MapBox component to render postcode polygons
2. Add click handler to detect postcode at coordinates
3. Implement postcode highlighting (selection state)
4. Add toggle selection (click to select/deselect)
5. Display selected postcodes in sidebar
6. Show individual property counts per postcode

**Output**: Interactive postcode selection on map

### Phase 3: Property Counting

**Tasks**:
1. Create API endpoint to query property count by postcode
2. Implement OS Places API query for postcode boundary
3. Add caching logic (check cache, query if miss, store result)
4. Display loading states during API calls
5. Show aggregated totals across selected postcodes
6. Add refresh button for stale counts

**Output**: Property counts displayed for postcodes

### Phase 4: Territory Assignment

**Tasks**:
1. Update territory creation to save postcode list
2. Create overlap detection (same postcode, different agents)
3. Allow multi-postcode assignment to agent
4. Display assigned postcodes in agent territory view
5. Support unassigning postcodes
6. Update territory deletion to handle postcodes

**Output**: Complete postcode assignment workflow

## Data Import Details

### OS Open Data Source

**Dataset**: Code-Point Open
**URL**: https://osdatahub.os.uk/downloads/open/CodePointOpen
**Format**: CSV or GeoPackage
**License**: Open Government Licence (free to use)

**CSV Structure**:
```
Postcode, Positional_quality_indicator, Eastings, Northings, Country_code, ...
TA1 1AA, 10, 324123, 123456, E, ...
```

**Extraction Strategy**:
- Extract first part of postcode (before space) = district code
- Group by district code
- Calculate district boundary from all unit centroids (convex hull or manual boundaries)

**Alternative**: Boundary-Line dataset
- Provides pre-made postcode sector/district boundaries
- Easier to import (already has polygons)
- Recommended approach

## Testing Strategy

### Import Verification

```sql
-- Check import completed
SELECT COUNT(*) FROM postcodes;
-- Expected: ~2,900 postcode districts

-- Sample queries
SELECT * FROM postcodes WHERE code = 'TA1';
SELECT * FROM postcodes WHERE ST_Contains(boundary, ST_Point(-3.1006, 51.0151));
```

### Postcode Selection Testing

1. Click on Taunton (should select TA1)
2. Click on Bristol (should select BS1, BS2, etc.)
3. Select multiple postcodes, verify list updates
4. Deselect postcode, verify removed from list

### Property Count Testing

1. Select TA1, verify count loads from API
2. Select TA1 again (different session), verify cached count loads instantly
3. Click refresh, verify count updates from API

## Migration Strategy

### Transition Plan

**Phase 1**: Add postcode system alongside polygons
- Both systems coexist
- Admins can choose which to use
- No data loss

**Phase 2**: Migrate existing polygon territories
- For each polygon territory, find overlapping postcodes
- Suggest postcode assignment based on polygon coverage
- Admin reviews and confirms

**Phase 3**: Deprecate polygon system
- After all territories migrated
- Remove polygon drawing UI
- Keep polygon data for historical reference

## Performance Considerations

### Database Optimization

- GiST indexes on postcode boundaries
- GiST index on center_point for nearest-neighbor queries
- Cache property counts table with TTL
- Materialized view for frequently accessed postcode stats

### MapBox Rendering

- Only render postcodes in current viewport
- Use tile-based rendering for large numbers
- Simplify polygons for distant zoom levels
- Cluster postcodes at country/region zoom

## Notes

- Postcode-based system is much simpler than polygon drawing
- Aligns with industry standard practice
- Free data source (no ongoing costs)
- Easier for admins to understand and use
- More accurate territory definitions
- Better performance (query by code vs spatial intersection)
