# Feature Specification: Postcode-Based Territory Assignment

**Feature Branch**: `003-postcode-territories`
**Created**: 2025-11-21
**Status**: Draft
**Input**: Replace territory polygon drawing with postcode-based assignment. Import UK postcodes from OS Open Data (free). Allow admins to click map to select postcodes, display residential property count per postcode using OS Places API, assign multiple postcodes to each agent, and show total property count across all assigned postcodes.

## User Scenarios & Testing

### User Story 1 - Select Postcodes by Clicking Map (Priority: P1)

As an **admin**, I want to click postcodes on the map to assign them to agents, rather than drawing custom polygons, so territory assignment is faster and based on official postcode boundaries.

**Why this priority**: Core interaction model - without this, the system doesn't work. Postcodes are the standard unit for territory management in UK real estate.

**Independent Test**: Click on map in Taunton area. Verify postcode is highlighted and shows property count. Click multiple postcodes and verify they're all selected.

**Acceptance Scenarios**:

1. **Given** the map is displayed, **When** I click on a location, **Then** the postcode at that location is highlighted on the map
2. **Given** a postcode is highlighted, **When** I click it again, **Then** it becomes deselected
3. **Given** I have selected 5 postcodes, **When** I view the selection summary, **Then** I see all 5 postcodes listed with their individual property counts

---

### User Story 2 - View Property Counts Per Postcode (Priority: P1)

As an **admin**, I want to see how many residential properties are in each postcode before assigning it, so I can ensure fair territory distribution across agents.

**Why this priority**: Critical for decision-making - admins need to see property counts to balance territories fairly.

**Independent Test**: Click on postcode TA1. Verify property count displays (e.g., "1,450 residential properties"). Compare with OS Places API data to confirm accuracy.

**Acceptance Scenarios**:

1. **Given** I click a postcode on the map, **When** the property count loads, **Then** it displays the number of residential properties in that postcode
2. **Given** a postcode has no residential properties, **When** I click it, **Then** it shows "0 properties" rather than an error
3. **Given** I select multiple postcodes, **When** viewing the total, **Then** I see the sum of all selected postcode property counts

---

### User Story 3 - Assign Multiple Postcodes to Agent (Priority: P2)

As an **admin**, I want to assign multiple postcodes to a single agent (e.g., TA1, TA2, TA3) and see their total market size, so agents have well-defined territories.

**Why this priority**: Enables complete territory management - agents typically cover multiple postcodes, not just one.

**Independent Test**: Select 3 postcodes (TA1, TA2, TA3). Assign all to test agent. Verify agent's territory shows all 3 postcodes with combined property count.

**Acceptance Scenarios**:

1. **Given** I have selected 3 postcodes, **When** I assign them to an agent, **Then** all 3 postcodes are saved to that agent's territory
2. **Given** an agent has 5 postcodes assigned, **When** viewing their territory, **Then** I see the total property count across all 5 postcodes
3. **Given** two agents with overlapping postcodes, **When** assigning territories, **Then** the system warns about the overlap but allows assignment

---

### User Story 4 - Seed Database with UK Postcodes (Priority: P1 - Prerequisite)

As a **system administrator**, I need all UK postcodes imported into the database with their boundaries, so the map can display and query them efficiently.

**Why this priority**: Foundational requirement - nothing works without postcode data in the database.

**Independent Test**: Run import script. Verify database contains postcode districts with boundaries. Query sample postcodes and verify coordinates are correct.

**Acceptance Scenarios**:

1. **Given** the OS Open Data file is downloaded, **When** the import runs, **Then** postcode districts are inserted into the database
2. **Given** postcodes are imported, **When** querying a specific postcode (e.g., TA1), **Then** its boundary polygon and center coordinates are returned
3. **Given** the import completes, **When** checking the map, **Then** postcodes are queryable by clicking anywhere in the UK

---

### Edge Cases

- What happens when clicking between postcodes (on a boundary)?
  - System selects the nearest postcode based on distance to center point
- What happens if OS Places API fails for a postcode?
  - Display "Count unavailable - click to retry" message
- What happens when assigning a postcode already assigned to another agent?
  - Show warning "Overlaps with [Agent Name]" but allow assignment
- What happens with very large postcode districts (thousands of properties)?
  - Display normally - no artificial limits
- What happens when OS Open Data is updated (new postcodes added)?
  - Provide admin re-import function to refresh postcode data

## Requirements

### Functional Requirements

- **FR-001**: System MUST import UK postcode district data from OS Open Data into the database
- **FR-002**: System MUST store postcode boundaries as geographic polygons for map display
- **FR-003**: System MUST allow admins to click the map to select postcodes at that location
- **FR-004**: System MUST visually highlight selected postcodes on the map with distinct colors
- **FR-005**: System MUST toggle postcode selection (click to select, click again to deselect)
- **FR-006**: System MUST query OS Places API to get residential property count for each selected postcode
- **FR-007**: System MUST display property count for each individual postcode
- **FR-008**: System MUST calculate and display total property count across all selected postcodes
- **FR-009**: System MUST allow assigning multiple postcodes to a single agent in one operation
- **FR-010**: System MUST persist postcode assignments to the agent's territory record
- **FR-011**: System MUST display assigned postcodes when viewing an agent's territory
- **FR-012**: System MUST warn when postcodes overlap between agents but allow the assignment
- **FR-013**: System MUST support unassigning postcodes from agents
- **FR-014**: System MUST cache property counts to avoid repeated API calls for the same postcode

### Key Entities

- **Postcode**: UK postcode district from OS Open Data
  - Attributes: code (e.g., "TA1"), boundary (polygon), center_point (coordinates), property_count (cached)
  - Relationships: Can be assigned to multiple Agents (many-to-many)
  - Lifecycle: Imported once via migration, updated when OS data refreshes

- **Territory**: Agent's assigned postcodes (replaces current polygon system)
  - Attributes: agent_id, postcodes (array of postcode codes), total_property_count, last_updated
  - Relationships: Belongs to one Agent, references multiple Postcodes
  - Change: Replaces boundary polygon with postcode list

- **Property Count Cache**: Cached counts from OS Places API
  - Attributes: postcode_code, residential_count, commercial_count, mixed_count, cached_at
  - Purpose: Avoid repeated API calls, faster UI responses
  - Lifecycle: Created on first query, refreshed after 24 hours

## Success Criteria

### Measurable Outcomes

- **SC-001**: Database contains UK postcode districts with boundaries after import
- **SC-002**: Admin can select a postcode by clicking the map in under 2 seconds
- **SC-003**: Property counts display within 3 seconds of postcode selection
- **SC-004**: Admin can assign 10 postcodes to an agent in under 1 minute
- **SC-005**: 100% of selected postcodes show accurate property counts (verified against OS Places API)
- **SC-006**: Territory assignment is 80% faster than polygon drawing method
- **SC-007**: Postcode selection operates without errors for 7 consecutive days
- **SC-008**: Postcode property counts cached for 24 hours (95% cache hit rate after initial load)

## Assumptions

- OS Open Data Code-Point Open dataset is publicly available and free to download
- Postcode district boundaries are sufficient (don't need unit-level postcodes like TA1 1AA)
- OS Places API supports querying by postcode district or boundary polygon
- Postcode districts are manageable in PostgreSQL with proper indexing
- Most agents will be assigned 5-20 postcodes (not hundreds)
- Postcode boundaries don't change frequently (yearly updates acceptable)
- Property counts can be cached for 24-48 hours without significant accuracy loss
- MapBox can efficiently render postcode district polygons

## Dependencies

- **OS Open Data**: Download Code-Point Open or Boundary-Line dataset (free)
- **OS Places API**: Already configured Premium plan for property counting
- **Territory System**: Current polygon-based territories will be migrated to postcode-based
- **MapBox**: Already integrated for map display
- **PostGIS**: Already configured for spatial queries and polygon operations

## Out of Scope

- Automatic territory balancing (suggesting optimal postcode distribution)
- Historical territory tracking (changes over time)
- Territory performance metrics (properties sold per postcode)
- Custom postcode grouping (creating sub-territories within postcodes)
- Bulk property count pre-calculation for all UK postcodes
- Supporting non-UK postcodes or international territories
- Unit-level postcodes (TA1 1AA) - using districts only (TA1, TA2, etc.)

## Risks & Mitigations

**Risk**: Large postcode dataset might impact database performance
**Mitigation**: Add spatial indexes (GiST), only query visible postcodes on map

**Risk**: MapBox might struggle rendering many postcode boundaries
**Mitigation**: Only render postcodes in current viewport, use clustering at high zoom levels

**Risk**: OS Places API rate limits with frequent postcode queries
**Mitigation**: Aggressive caching (24-48 hours), batch similar queries

**Risk**: Existing polygon-based territories need migration
**Mitigation**: Keep old system during transition, provide migration tool

## Notes

- This replaces the current polygon-based territory system
- Postcode-based assignment is industry standard in UK real estate
- Much faster and more intuitive than drawing custom polygons
- Aligns with how agents naturally describe their territories
- Provides standardized, official boundaries (not custom drawn shapes)
- Free data source (OS Open Data) eliminates ongoing API costs for postcode data
- Only property counts require API (using existing OS Places subscription)
