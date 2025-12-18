# Feature Specification: Postcode Sector Territory Subdivision

**Feature Branch**: `008-postcode-sector-territories`
**Created**: 2025-12-18
**Status**: Draft
**Input**: User description: "Add postcode sector subdivision to territory management - Option A: Add sectors as a separate table linked to existing postcode districts, enabling agents to be assigned to finer-grained geographic areas (sectors like TA1 1, TA1 2) rather than just districts (TA1)"

## Overview

Currently, the territory management system allows administrators to assign agents to UK postcode districts (e.g., TA1, BS1, M15). Some agents only cover half of a postcode district, requiring finer-grained territory assignment at the **postcode sector** level (e.g., TA1 1, TA1 2, TA1 3).

This feature adds a hierarchical postcode sector system where:
- Existing postcode districts remain the primary view
- Sectors are a drill-down layer within each district
- Agents can be assigned to entire districts OR specific sectors within a district
- The system supports mixed assignments (some agents on districts, others on sectors)

### UK Postcode Hierarchy Reference

| Level | Example | Count (UK) | Current Support |
|-------|---------|------------|-----------------|
| Postcode Area | TA | 124 | No |
| Postcode District | TA1 | ~3,100 | Yes (2,727 loaded) |
| **Postcode Sector** | **TA1 1** | **~12,400** | **This feature** |
| Postcode Unit | TA1 1AA | ~1.7M | No |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Assigns Sectors to Agent (Priority: P1)

An administrator needs to assign specific postcode sectors to an agent who only covers part of a postcode district. For example, Agent Smith covers TA1 1, TA1 2, and TA1 3, but not TA1 4 or TA1 5.

**Why this priority**: This is the core use case that the client specifically requested. Without this, agents covering partial districts cannot be accurately represented.

**Independent Test**: Can be fully tested by loading a district, expanding to see its sectors, selecting specific sectors, and assigning them to an agent.

**Acceptance Scenarios**:

1. **Given** an admin is viewing the territory map with district TA1 visible, **When** they click on TA1, **Then** the map expands to show all sectors within TA1 (TA1 1, TA1 2, etc.) with their boundaries.

2. **Given** an admin has expanded district TA1 to show sectors, **When** they select sectors TA1 1, TA1 2, and TA1 3, **Then** those three sectors are highlighted and shown in the selection panel.

3. **Given** an admin has selected sectors TA1 1, TA1 2, TA1 3, **When** they assign these to Agent Smith, **Then** the system creates sector-level assignments and displays Agent Smith's color on those specific sectors.

4. **Given** Agent Smith is assigned to sectors TA1 1, TA1 2, TA1 3, **When** another admin views the territory map, **Then** they see TA1 partially colored (only sectors 1-3) with Agent Smith's assignment.

---

### User Story 2 - Admin Assigns Full District (Priority: P1)

An administrator needs to assign an entire postcode district to an agent who covers the whole area. The existing workflow should continue to work without requiring sector-level selection.

**Why this priority**: Many agents still cover full districts. The existing workflow must remain simple and not regress.

**Independent Test**: Can be tested by selecting a district and assigning it without drilling into sectors.

**Acceptance Scenarios**:

1. **Given** an admin is viewing the territory map, **When** they select district BS1 without expanding it, **Then** the entire district is selected (not individual sectors).

2. **Given** an admin has selected district BS1, **When** they assign it to Agent Jones, **Then** the system creates a district-level assignment covering all sectors within BS1.

3. **Given** Agent Jones is assigned to district BS1, **When** viewing the territory map, **Then** the entire BS1 area is colored with Agent Jones's assignment.

---

### User Story 3 - View Mixed Assignments (Priority: P2)

An administrator needs to see the territory map showing both district-level and sector-level assignments clearly, understanding which agents cover which areas.

**Why this priority**: Essential for managing territories when some agents have districts and others have sectors.

**Independent Test**: Can be tested by creating mixed assignments and verifying the visual representation.

**Acceptance Scenarios**:

1. **Given** Agent Smith has sectors TA1 1-3 and Agent Brown has district TA2, **When** viewing the territory map at the district level, **Then** TA1 shows as "partially assigned" (with a visual indicator) and TA2 shows as fully assigned to Agent Brown.

2. **Given** a district has some sectors assigned to different agents, **When** an admin expands that district, **Then** each sector displays the correct agent's color and name.

3. **Given** the territory list sidebar, **When** viewing assignments, **Then** it shows "TA1 (partial: 3/5 sectors)" for partially assigned districts and "TA2 (full district)" for complete assignments.

---

### User Story 4 - Import Sector Boundary Data (Priority: P2)

The system needs to be populated with UK postcode sector boundaries from open data sources before sector assignments can be made.

**Why this priority**: Required for the feature to function, but is a one-time data import operation.

**Independent Test**: Can be tested by running the import and verifying sector counts and boundaries render correctly.

**Acceptance Scenarios**:

1. **Given** the sector data has been imported, **When** an admin expands any loaded district, **Then** they see the correct number of sectors with accurate boundaries.

2. **Given** sector boundaries exist in the system, **When** viewing sectors on the map, **Then** the sector boundaries align with the parent district boundary (no gaps or overlaps).

---

### User Story 5 - Prevent Conflicting Assignments (Priority: P3)

The system must prevent invalid assignment scenarios, such as assigning a sector to one agent when the full district is already assigned to another.

**Why this priority**: Important for data integrity but less frequent than core assignment workflows.

**Independent Test**: Can be tested by attempting invalid assignments and verifying appropriate error messages.

**Acceptance Scenarios**:

1. **Given** Agent Jones is assigned to full district BS1, **When** an admin tries to assign sector BS1 1 to Agent Smith, **Then** the system shows a conflict warning and prevents the assignment.

2. **Given** Agent Smith is assigned to sectors TA1 1-3, **When** an admin tries to assign the full district TA1 to Agent Brown, **Then** the system shows a conflict warning listing the existing sector assignments.

3. **Given** a conflict is detected, **When** the admin views the warning, **Then** they see options to: (a) cancel, (b) reassign existing assignments, or (c) view conflicting agent details.

---

### Edge Cases

- What happens when a district has no sector data available? System displays the district as "sectors not available" and only allows district-level assignment.
- What happens when sector boundaries change (Royal Mail updates)? System supports re-importing updated boundaries; existing assignments remain linked by sector code.
- How does the system handle Northern Ireland postcodes (BT)? Northern Ireland uses BT postcodes; if sector data is unavailable, the system falls back to district-only mode for BT areas.
- What happens if an agent is assigned overlapping territories? The system prevents the same geographic area from being assigned to multiple agents (conflict detection).

## Requirements *(mandatory)*

### Functional Requirements

**Data Model**

- **FR-001**: System MUST store postcode sectors as a separate entity linked to their parent postcode district.
- **FR-002**: System MUST store sector boundaries as geographic polygons compatible with the existing district boundary format.
- **FR-003**: System MUST support approximately 12,000 UK postcode sectors based on available open data.
- **FR-004**: System MUST maintain the relationship between sectors and their parent districts (e.g., TA1 1 belongs to TA1).

**Assignment Logic**

- **FR-005**: System MUST allow administrators to assign agents to entire districts (existing behavior preserved).
- **FR-006**: System MUST allow administrators to assign agents to individual sectors within a district.
- **FR-007**: System MUST prevent assigning a sector when its parent district is already assigned to a different agent.
- **FR-008**: System MUST prevent assigning a full district when any of its sectors are already assigned to different agents.
- **FR-009**: System MUST allow reassigning from district-level to sector-level (and vice versa) with appropriate confirmation.

**User Interface**

- **FR-010**: System MUST display districts as the default map view (preserving current behavior).
- **FR-011**: System MUST provide a drill-down interaction to expand a district and view its sectors.
- **FR-012**: System MUST visually indicate when a district is "partially assigned" (some but not all sectors assigned).
- **FR-013**: System MUST display sector boundaries within the parent district boundary when expanded.
- **FR-014**: System MUST show sector codes as labels on the map when viewing sector level.
- **FR-015**: System MUST allow multi-select of sectors for batch assignment.

**Property Counts**

- **FR-016**: System MUST display property counts at the sector level when sectors are expanded.
- **FR-017**: System MUST aggregate sector property counts to show district totals.

### Key Entities

- **Postcode District**: Existing entity representing UK postcode districts (e.g., TA1, BS1). Contains boundary polygon, area size, and links to assigned agents. Parent of multiple sectors.

- **Postcode Sector**: New entity representing subdivisions within a district (e.g., TA1 1, TA1 2). Contains boundary polygon, area size, parent district reference, and optional agent assignment.

- **Territory Assignment**: Extended to support both district-level and sector-level assignments. Includes assignment type indicator (full district vs. specific sectors).

- **Agent**: Existing entity. Can now have assignments at either district or sector granularity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrators can assign agents to specific sectors within 30 seconds of expanding a district.

- **SC-002**: The territory map loads and displays district/sector boundaries within 3 seconds for any UK region.

- **SC-003**: 100% of existing district-level assignments continue to function without modification after feature deployment.

- **SC-004**: Administrators can visually distinguish between fully-assigned districts, partially-assigned districts, and unassigned districts at a glance.

- **SC-005**: The system accurately represents all ~12,000 UK postcode sectors with boundaries that align with their parent districts.

- **SC-006**: Conflict detection prevents 100% of invalid overlapping assignments (no geographic area assigned to multiple agents).

- **SC-007**: Property count aggregation is accurate: sum of sector counts equals district total (within 1% tolerance for boundary edge cases).

## Assumptions

1. **Data Source**: Sector boundary data will be sourced from Edinburgh DataShare (Geolytix 2012 open data) or equivalent open data source. This data is from 2012 but covers the required sector boundaries.

2. **Northern Ireland**: BT postcode sectors may not be available in open data. The system will gracefully degrade to district-only mode for unavailable areas.

3. **Sector Stability**: Postcode sectors rarely change. The 2012 data is acceptable for initial release; a future update mechanism can be added if needed.

4. **Performance**: Loading ~12,000 sector boundaries is acceptable; sectors will be loaded on-demand when a district is expanded (not all at once).

5. **Backward Compatibility**: All existing district-level assignments remain valid. No data migration required for existing territories.

## Out of Scope

- Postcode unit level assignments (too granular, ~1.7M records)
- Automated sync with Royal Mail postcode updates
- Sector-level property sync from Apex27 (properties remain linked to agents, not territories)
- Custom territory drawing (replaced by postcode-based system in previous feature)

## Dependencies

- **Existing Feature**: 001-multi-agent-platform (postcode district territories)
- **External Data**: Edinburgh DataShare or Geolytix open postcode sector boundaries
- **Map Provider**: Mapbox GL (already integrated)
