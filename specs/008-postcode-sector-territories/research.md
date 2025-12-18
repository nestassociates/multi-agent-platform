# Research: Postcode Sector Territory Subdivision

**Feature**: 008-postcode-sector-territories
**Date**: 2025-12-18
**Status**: Complete

## Research Questions

### 1. Data Source for UK Postcode Sector Boundaries

**Decision**: Edinburgh DataShare (Geolytix 2012 Open Data)

**Rationale**:
- Free to use under Open Government License (OGL)
- Contains ~11,000+ postcode sectors with polygon boundaries
- Includes all three levels: Areas, Districts, and Sectors
- File format: Shapefile (can be converted to GeoJSON/PostGIS)
- Attribution required: "Postal Boundaries © GeoLytix copyright and database right 2012"

**Alternatives Considered**:
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Edinburgh DataShare (Geolytix 2012) | Free, complete coverage, OGL license | Data from 2012 | ✅ Selected |
| Geolytix Commercial | Current data, quarterly updates | Requires licensing fee | ❌ Not needed for MVP |
| Mark Longair's GeoJSON | Pre-converted to GeoJSON | Derived from same 2012 data | ❌ Same source, extra step |
| Code-Point with Polygons (OS) | Official, most accurate | Expensive commercial license | ❌ Cost prohibitive |

**Download URL**: https://datashare.ed.ac.uk/handle/10283/2597
**File**: GB_Postcodes.zip (180.8 MB)

---

### 2. Data Format Conversion Strategy

**Decision**: Convert Shapefile → GeoJSON → PostGIS SQL batches

**Rationale**:
- Matches existing postcode district import pattern (batch SQL files)
- GeoJSON intermediate format allows validation
- PostGIS `ST_GeogFromText()` accepts WKT from GeoJSON coordinates
- Batch import prevents memory issues with 12,000 polygons

**Conversion Pipeline**:
```
1. Download GB_Postcodes.zip from Edinburgh DataShare
2. Extract Sectors shapefile (Distribution/Sectors.*)
3. Convert to GeoJSON using ogr2ogr or mapshaper
4. Parse GeoJSON, generate SQL INSERT batches
5. Import batches to Supabase (like existing postcode_batches/)
```

**Tools**:
- `ogr2ogr` (GDAL) - Shapefile to GeoJSON conversion
- Node.js script - GeoJSON to SQL batch generation
- Supabase CLI - SQL migration execution

---

### 3. Sector Code Format Validation

**Decision**: Sector codes follow pattern `{DISTRICT} {DIGIT}` (e.g., "TA1 1", "BS10 5")

**Rationale**:
- UK postcode sectors add a single digit after the district code
- Space is canonical separator (not hyphen or concatenation)
- Regex validation: `/^[A-Z]{1,2}\d{1,2}\s\d$/`

**Examples**:
| District | Sectors |
|----------|---------|
| TA1 | TA1 1, TA1 2, TA1 3, TA1 4, TA1 5 |
| BS10 | BS10 1, BS10 2, BS10 3, BS10 4, BS10 5, BS10 6, BS10 7 |
| M1 | M1 1, M1 2, M1 3, M1 4, M1 5, M1 6, M1 7 |

---

### 4. Assignment Model Design

**Decision**: Extend `agent_postcodes` with optional `sector_code` column

**Rationale**:
- Backward compatible: existing rows have NULL sector_code (= full district)
- Single junction table for both granularities
- Simpler queries than separate `agent_sectors` table
- Unique constraint prevents duplicate assignments

**Schema Change**:
```sql
-- Existing
agent_postcodes (agent_id, postcode_code, assigned_at)

-- Extended
agent_postcodes (
  agent_id UUID,
  postcode_code TEXT,         -- District code (required)
  sector_code TEXT,           -- Sector code (NULL = full district)
  assigned_at TIMESTAMPTZ,
  PRIMARY KEY (agent_id, postcode_code, COALESCE(sector_code, ''))
)
```

**Assignment Logic**:
| Row State | Meaning |
|-----------|---------|
| `sector_code IS NULL` | Agent assigned to entire district |
| `sector_code IS NOT NULL` | Agent assigned to specific sector |

---

### 5. Conflict Detection Rules

**Decision**: Prevent overlapping assignments at any level

**Rules**:
1. Cannot assign sector if district already assigned to different agent
2. Cannot assign district if any sector already assigned to different agent
3. Same agent can have both district and sector assignments (promotion/demotion)

**Implementation**:
- Check before INSERT
- Database constraint or API-level validation
- Return conflict details for UI display

---

### 6. Property Count Source for Sectors

**Decision**: Use OS Data Hub Places API with sector postcode filter

**Rationale**:
- Existing pattern for district counts works at sector level
- API supports postcode prefix filtering
- Cache results in new `sector_property_counts` table (or extend existing)

**API Pattern**:
```
GET https://api.os.uk/search/places/v1/postcode
  ?postcode=TA1%201
  &dataset=DPA
  &fq=CLASSIFICATION_CODE:R*
  &maxresults=1
→ Returns header.totalresults = residential property count
```

---

### 7. Northern Ireland (BT Postcodes)

**Decision**: Graceful degradation to district-only mode

**Rationale**:
- Edinburgh DataShare contains GB only (not Northern Ireland)
- BT postcode sectors require separate license from Land & Property Services
- Not blocking for MVP - NI agents can use district-level assignments

**Implementation**:
- Check if sectors exist for district before showing drill-down
- UI shows "Sector data not available" for BT districts
- Assignment still works at district level

---

## Summary

| Topic | Decision |
|-------|----------|
| Data Source | Edinburgh DataShare (Geolytix 2012) |
| Format | Shapefile → GeoJSON → SQL batches |
| Sector Codes | `{DISTRICT} {DIGIT}` with space separator |
| Assignment Model | Extend `agent_postcodes` with nullable `sector_code` |
| Conflicts | Prevent cross-level overlaps, allow same-agent promotion |
| Property Counts | OS Data Hub API at sector level |
| Northern Ireland | Graceful degradation (district-only) |

**All research questions resolved. Ready for Phase 1: Design & Contracts.**
