# Feature Specification: Exportable Properties Filter

**Feature Branch**: `002-exportable-properties-filter`
**Created**: 2025-11-21
**Status**: Draft
**Input**: Filter property synchronization to only sync properties marked as exportable:true from Apex27 CRM. When properties become non-exportable, hard delete them from the database immediately. Implement filtering in both webhook handler and cron sync job. Include one-time cleanup to remove ~10,680 existing non-exportable properties.

## User Scenarios & Testing

### User Story 1 - Clean Property Listings (Priority: P1)

As an **agent**, when I view my property portfolio, I only want to see properties that are actively marketed and exportable, not internal valuations or pending listings that shouldn't be public.

**Why this priority**: Core filtering logic - without this, agents see 10,880 properties instead of their actual ~200 marketed listings, making the system unusable.

**Independent Test**: Create a test agent with 100 properties in Apex27 (50 exportable, 50 non-exportable). Verify only the 50 exportable properties appear in the agent's dashboard.

**Acceptance Scenarios**:

1. **Given** an agent has 20 exportable properties and 30 non-exportable properties in Apex27, **When** the agent views their property list, **Then** only the 20 exportable properties are displayed
2. **Given** a property is marked as exportable in Apex27, **When** the sync runs, **Then** the property appears in the agent's portfolio
3. **Given** a property is marked as non-exportable in Apex27, **When** the sync runs, **Then** the property does not appear in the agent's portfolio

---

### User Story 2 - Real-Time Property Removal (Priority: P2)

As an **agent**, when I mark a property as non-exportable in Apex27 (e.g., a valuation that won't be listed), the property should immediately disappear from my public listings and WordPress website.

**Why this priority**: Ensures data accuracy and prevents showing properties that shouldn't be public. Critical for compliance and agent control.

**Independent Test**: Mark an existing exportable property as non-exportable in Apex27. Verify it's removed from the database and WordPress within seconds (via webhook).

**Acceptance Scenarios**:

1. **Given** a property is currently displayed on the agent's website, **When** the agent marks it as non-exportable in Apex27, **Then** the property is removed from the website within 30 seconds
2. **Given** a property's exportable status changes from true to false, **When** the webhook is received, **Then** the property is permanently deleted from the database
3. **Given** a non-exportable property exists in the database, **When** the cron sync runs, **Then** the property is identified and removed

---

### User Story 3 - One-Time Data Cleanup (Priority: P1)

As an **administrator**, I need to clean up the ~10,680 existing non-exportable properties that were synced before filtering was implemented, so the system only contains valid, exportable listings.

**Why this priority**: Database currently has 98% junk data (10,680 out of 10,880 are non-exportable). Must be cleaned before the system is usable.

**Independent Test**: Run the cleanup script and verify the property count drops from ~10,880 to ~200. Verify no exportable properties were deleted.

**Acceptance Scenarios**:

1. **Given** the database contains 10,880 properties (10,680 non-exportable, 200 exportable), **When** the cleanup runs, **Then** exactly 10,680 properties are deleted
2. **Given** the cleanup has completed, **When** querying all properties, **Then** all remaining properties have exportable:true in their source data
3. **Given** the cleanup process, **When** an error occurs, **Then** the operation is logged and can be retried without data corruption

---

### Edge Cases

- What happens when Apex27 webhook fails to deliver a non-exportable status change?
  - **Mitigation**: Cron job (every 6 hours) catches missed webhooks and removes non-exportable properties
- What happens if a property's exportable status flip-flops (true → false → true)?
  - **Behavior**: Property is deleted when false, re-synced when true again (new record with new ID)
- What happens during the one-time cleanup if Apex27 API is unavailable?
  - **Mitigation**: Cleanup reads from cached sync data or can be retried manually
- What happens if we delete a property that has related data (enquiries, viewings)?
  - **Behavior**: Cascade delete (ON DELETE CASCADE) removes related records automatically

## Requirements

### Functional Requirements

- **FR-001**: System MUST filter incoming properties from Apex27 based on the `exportable` boolean field
- **FR-002**: System MUST skip syncing properties where `exportable: false` in both webhook and cron synchronization
- **FR-003**: System MUST permanently delete (hard delete) properties when their `exportable` status changes from true to false
- **FR-004**: System MUST perform a one-time cleanup operation to remove all existing non-exportable properties from the database
- **FR-005**: System MUST log all filtering and deletion operations for monitoring and auditing
- **FR-006**: System MUST track metrics for properties synced vs skipped (exportable vs non-exportable counts)
- **FR-007**: Webhook handler MUST check `exportable` field on create, update, and delete events
- **FR-008**: Cron sync job MUST filter properties before database operations to avoid unnecessary processing
- **FR-009**: Public API endpoints MUST only return properties that were synced (exportable ones)
- **FR-010**: Deletion of non-exportable properties MUST cascade to remove related records (images, enquiries, etc.)

### Key Entities

- **Property**: Represents a real estate listing from Apex27 CRM
  - Attributes: id, apex27_id, agent_id, title, price, status, address, **exportable** (boolean)
  - Relationships: Belongs to Agent, has many Images
  - Lifecycle: Created when exportable:true, deleted when exportable:false

- **Sync Metrics**: Tracking data for monitoring synchronization health
  - Attributes: sync_timestamp, properties_synced_count, properties_skipped_count, properties_deleted_count
  - Purpose: Monitor filtering effectiveness and data quality

## Success Criteria

### Measurable Outcomes

- **SC-001**: Property count in database reduces from ~10,880 to ~200 after cleanup (98% reduction)
- **SC-002**: Agents see only their actively marketed properties (no valuations or pending listings)
- **SC-003**: Non-exportable properties are removed from public listings within 30 seconds of status change
- **SC-004**: Sync process logs show clear metrics: X properties synced, Y properties skipped (non-exportable)
- **SC-005**: Zero non-exportable properties exist in database after initial cleanup
- **SC-006**: 100% of properties displayed on WordPress are confirmed exportable in Apex27
- **SC-007**: Webhook filtering operates without errors for 7 consecutive days

## Assumptions

- Apex27 API reliably provides the `exportable` boolean field for all properties
- The `exportable` field in Apex27 type definitions (`lib/apex27/types.ts:251`) accurately reflects the API response
- Current property count split: ~200 exportable, ~10,680 non-exportable (as per TODO.md)
- Webhooks are properly registered and delivering events (per Phase 10 completion)
- Hard delete is acceptable (no soft delete/archiving needed for non-exportable properties)
- Cascade deletion is configured in database schema for related records
- Cleanup operation can be run during low-traffic period (off-hours)

## Dependencies

- **Apex27 Integration (Phase 10)**: Webhook handler and cron sync infrastructure must be operational
- **Property Service**: `lib/services/property-service.ts` must support deletion operations
- **Database**: Properties table and related tables must have cascade delete configured
- **Monitoring**: Sentry configured for logging deletion operations

## Out of Scope

- Modifying Apex27 CRM's exportable field logic (using existing field as-is)
- Soft delete or archiving non-exportable properties (using hard delete only)
- UI for viewing filtered/deleted properties (not needed - they should not exist)
- Bulk export/import operations (orthogonal to filtering)
- Property type-based filtering beyond exportable flag (e.g., sale vs rent filtering happens elsewhere)
- Historical data retention for deleted properties (permanent deletion)

## Risks & Mitigations

**Risk**: Accidentally deleting exportable properties during cleanup
**Mitigation**: Add dry-run mode to cleanup script, log all deletions, backup database before cleanup

**Risk**: Webhook delivery failures causing non-exportable properties to persist
**Mitigation**: Cron job (every 6 hours) provides fallback cleanup mechanism

**Risk**: Performance impact from checking exportable status on every property
**Mitigation**: Filtering happens in-memory before database operations (minimal overhead)

**Risk**: Database storage for 10,680 deleted records consuming space
**Mitigation**: Hard delete with VACUUM operation after cleanup

## Notes

- This is a data quality fix, not a new feature - cleaning up existing technical debt
- Expected immediate benefit: Agents see accurate property counts and WordPress shows only valid listings
- One-time operation (cleanup) followed by ongoing filtering (webhook + cron)
- Property count reduction will be visible in agent dashboards immediately after cleanup
