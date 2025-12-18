# Data Model: Postcode Sector Territory Subdivision

**Feature**: 008-postcode-sector-territories
**Date**: 2025-12-18

## Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────┐
│     postcodes       │       │   postcode_sectors  │
│   (existing)        │       │      (NEW)          │
├─────────────────────┤       ├─────────────────────┤
│ code (PK)           │──────<│ code (PK)           │
│ boundary            │       │ district_code (FK)  │
│ center_point        │       │ boundary            │
│ area_km2            │       │ center_point        │
│ created_at          │       │ area_km2            │
│ updated_at          │       │ created_at          │
└─────────────────────┘       │ updated_at          │
         │                    └─────────────────────┘
         │                              │
         │                              │
         ▼                              ▼
┌─────────────────────────────────────────────────────┐
│                  agent_postcodes                     │
│                   (MODIFIED)                         │
├─────────────────────────────────────────────────────┤
│ agent_id (PK, FK)                                   │
│ postcode_code (PK, FK)  → postcodes.code            │
│ sector_code (PK, FK)    → postcode_sectors.code     │ ← NEW (nullable)
│ assigned_at                                          │
└─────────────────────────────────────────────────────┘
         │
         │
         ▼
┌─────────────────────┐
│      agents         │
│    (existing)       │
├─────────────────────┤
│ id (PK)             │
│ subdomain           │
│ status              │
│ ...                 │
└─────────────────────┘
```

## New Table: `postcode_sectors`

Stores UK postcode sector boundaries (~12,000 records).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `code` | TEXT | PRIMARY KEY | Sector code (e.g., "TA1 1", "BS10 5") |
| `district_code` | TEXT | NOT NULL, FK → postcodes.code | Parent district |
| `boundary` | GEOGRAPHY(POLYGON, 4326) | NULL | PostGIS polygon boundary |
| `center_point` | GEOGRAPHY(POINT, 4326) | NULL | Centroid for labels |
| `area_km2` | NUMERIC | NULL | Area in square kilometers |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last modification time |

**Indexes**:
- `idx_postcode_sectors_district` ON `district_code` (for drill-down queries)
- `idx_postcode_sectors_boundary` USING GIST ON `boundary` (for spatial queries)

**RLS Policy**: Public read access (same as postcodes)

---

## Modified Table: `agent_postcodes`

Extended to support sector-level assignments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `agent_id` | UUID | NOT NULL, FK → agents.id | Agent being assigned |
| `postcode_code` | TEXT | NOT NULL, FK → postcodes.code | District code |
| `sector_code` | TEXT | NULL, FK → postcode_sectors.code | **NEW**: Sector code (NULL = full district) |
| `assigned_at` | TIMESTAMPTZ | DEFAULT now() | Assignment timestamp |

**Primary Key**: `(agent_id, postcode_code, COALESCE(sector_code, ''))`

**Constraints**:
- `sector_code` must belong to `postcode_code` district (validated by FK)
- Unique constraint prevents duplicate assignments

---

## New Table: `sector_property_counts` (Optional Cache)

Caches property counts for sectors (same pattern as `postcode_property_counts`).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `sector_code` | TEXT | PRIMARY KEY, FK → postcode_sectors.code | Sector code |
| `residential_count` | INTEGER | DEFAULT 0 | Residential properties |
| `commercial_count` | INTEGER | DEFAULT 0 | Commercial properties |
| `mixed_count` | INTEGER | DEFAULT 0 | Mixed-use properties |
| `total_count` | INTEGER | DEFAULT 0 | Total properties |
| `cached_at` | TIMESTAMPTZ | DEFAULT now() | Cache timestamp |

**Cache TTL**: 1 year (same as district counts)

---

## Migration SQL

```sql
-- Migration: 20251218000001_add_postcode_sectors.sql

-- 1. Create postcode_sectors table
CREATE TABLE IF NOT EXISTS postcode_sectors (
  code TEXT PRIMARY KEY,
  district_code TEXT NOT NULL REFERENCES postcodes(code) ON DELETE CASCADE,
  boundary GEOGRAPHY(POLYGON, 4326),
  center_point GEOGRAPHY(POINT, 4326),
  area_km2 NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE postcode_sectors IS 'UK postcode sectors (subdivisions of districts) with geographic boundaries';
COMMENT ON COLUMN postcode_sectors.code IS 'Postcode sector code (e.g., TA1 1, BS10 5)';
COMMENT ON COLUMN postcode_sectors.district_code IS 'Parent postcode district code';

-- 2. Create indexes
CREATE INDEX idx_postcode_sectors_district ON postcode_sectors(district_code);
CREATE INDEX idx_postcode_sectors_boundary ON postcode_sectors USING GIST(boundary);

-- 3. Add sector_code to agent_postcodes
ALTER TABLE agent_postcodes
ADD COLUMN IF NOT EXISTS sector_code TEXT;

-- 4. Add foreign key constraint
ALTER TABLE agent_postcodes
ADD CONSTRAINT fk_sector
FOREIGN KEY (sector_code) REFERENCES postcode_sectors(code);

-- 5. Update primary key to include sector_code
-- Note: Requires dropping and recreating the constraint
ALTER TABLE agent_postcodes DROP CONSTRAINT IF EXISTS agent_postcodes_pkey;
ALTER TABLE agent_postcodes
ADD PRIMARY KEY (agent_id, postcode_code, COALESCE(sector_code, ''));

-- 6. Create sector property counts cache table
CREATE TABLE IF NOT EXISTS sector_property_counts (
  sector_code TEXT PRIMARY KEY REFERENCES postcode_sectors(code) ON DELETE CASCADE,
  residential_count INTEGER DEFAULT 0,
  commercial_count INTEGER DEFAULT 0,
  mixed_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  cached_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE sector_property_counts IS 'Cached property counts from OS Places API (1-year TTL)';

-- 7. RLS Policies (match existing postcodes pattern)
ALTER TABLE postcode_sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to postcode_sectors"
ON postcode_sectors FOR SELECT
USING (true);

ALTER TABLE sector_property_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to sector_property_counts"
ON sector_property_counts FOR SELECT
USING (true);

-- 8. Helper function to get sector GeoJSON
CREATE OR REPLACE FUNCTION get_sector_geojson(sector_code_param TEXT)
RETURNS JSON AS $$
SELECT json_build_object(
  'code', code,
  'district_code', district_code,
  'boundary', ST_AsGeoJSON(boundary)::json,
  'center_point', ST_AsGeoJSON(center_point)::json,
  'area_km2', area_km2
)
FROM postcode_sectors
WHERE code = sector_code_param;
$$ LANGUAGE SQL STABLE;
```

---

## Validation Rules

### Sector Code Format
- Pattern: `^[A-Z]{1,2}\d{1,2}\s\d$`
- Examples: "TA1 1", "BS10 5", "M1 7"
- Space is required between district and sector digit

### Assignment Validation
1. **District already assigned**: If `agent_postcodes` has row with `sector_code IS NULL` for this district and different agent → CONFLICT
2. **Sector already assigned**: If `agent_postcodes` has row with matching `sector_code` and different agent → CONFLICT
3. **Sector parent check**: `sector_code` must have `district_code` matching `postcode_code`

### Boundary Validation
- SRID must be 4326 (WGS84)
- Polygon must be valid (no self-intersections)
- Sector boundary should be contained within parent district boundary (warning only)

---

## State Transitions

### Assignment States

```
UNASSIGNED ──────────────────────────────────────────────────┐
     │                                                       │
     │ Assign full district                                  │
     ▼                                                       │
DISTRICT_ASSIGNED ────────────────────────────────────────┐  │
     │                                                    │  │
     │ Split to sectors (same agent)                      │  │
     ▼                                                    │  │
SECTOR_ASSIGNED ─────────────────────────────────────────▶│◀─┘
     │                                                    │
     │ Unassign all sectors                               │
     ▼                                                    │
UNASSIGNED ◀──────────────────────────────────────────────┘
```

### Conflict Resolution
- CONFLICT detected → User chooses: Cancel | Reassign | View details
- Reassign removes conflicting assignments before creating new one
