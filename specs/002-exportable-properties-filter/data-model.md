# Data Model: Exportable Properties Filter

**Feature**: 002-exportable-properties-filter
**Date**: 2025-11-21

## Overview

This feature doesn't introduce new data models - it filters existing property synchronization based on the `exportable` boolean field from Apex27 CRM.

## Existing Entities

### Property (No Schema Changes)

**Source**: Apex27 CRM Listing
**Storage**: `properties` table in PostgreSQL
**Filtering Field**: `exportable: boolean` (from Apex27 API)

**Relevant Fields**:
```typescript
{
  id: UUID                  // Primary key
  apex27_id: string         // Apex27 listing ID
  agent_id: UUID            // Foreign key to agents table
  title: string
  price: number
  status: enum              // 'available' | 'sold' | 'let'
  exportable: boolean       // ← Key field for filtering (not stored, used for sync decision)
  created_at: timestamp
  updated_at: timestamp
}
```

**Note**: The `exportable` field is NOT stored in our database - it's used during sync to decide whether to create/update/delete the property.

## Data Flow

### Scenario 1: New Exportable Property

```
Apex27: New listing created with exportable: true
    ↓
Webhook: POST /api/webhooks/apex27 (event: create)
    ↓
Check: listing.exportable === true ✓
    ↓
Call: upsertPropertyFromApex27(listing)
    ↓
Database: INSERT INTO properties (...)
    ↓
Result: Property visible to agent and on WordPress
```

### Scenario 2: New Non-Exportable Property

```
Apex27: New valuation created with exportable: false
    ↓
Webhook: POST /api/webhooks/apex27 (event: create)
    ↓
Check: listing.exportable === false ✗
    ↓
Skip: Do not call upsert
    ↓
Database: No record created
    ↓
Result: Property not visible anywhere
```

### Scenario 3: Property Becomes Non-Exportable

```
Apex27: Existing listing updated, exportable: true → false
    ↓
Webhook: POST /api/webhooks/apex27 (event: update)
    ↓
Check: listing.exportable === false ✗
    ↓
Call: deletePropertyByApex27Id(listing.id)
    ↓
Database: DELETE FROM properties WHERE apex27_id = ...
          CASCADE deletes related images, enquiries, etc.
    ↓
Result: Property removed from agent dashboard and WordPress
```

### Scenario 4: Cron Sync (Fallback)

```
Cron trigger (every 6 hours)
    ↓
API Call: GET /listings from Apex27 (returns all properties)
    ↓
Filter: listings.filter(l => l.exportable === true)
    ↓
For each exportable listing:
    Call: upsertPropertyFromApex27(listing)
    ↓
For properties in DB but not in exportable list:
    Call: deletePropertyByApex27Id(property.apex27_id)
    ↓
Database: Contains only exportable properties
```

## Filtering Logic

### Decision Tree

```
Receive property from Apex27
    │
    ├─→ exportable === true?
    │   ├─→ YES: Sync to database (upsert)
    │   └─→ NO:
    │       ├─→ Property exists in DB?
    │       │   ├─→ YES: Delete from DB
    │       │   └─→ NO: Skip (do nothing)
    │
    └─→ Result: Only exportable properties in database
```

## Metrics Tracking

### Sync Metrics (Logged for Monitoring)

```typescript
{
  sync_timestamp: Date,
  total_received: number,      // Total properties from Apex27
  exportable_count: number,    // Properties with exportable: true
  non_exportable_count: number, // Properties with exportable: false
  synced_count: number,        // Successfully upserted
  deleted_count: number,       // Deleted (became non-exportable)
  error_count: number          // Failed operations
}
```

## Database Impact

### Before Cleanup

- Total properties: ~10,880
- Exportable: ~200 (2%)
- Non-exportable: ~10,680 (98%)

### After Cleanup

- Total properties: ~200 (100% exportable)
- Disk space saved: ~98% reduction
- Query performance: Faster (fewer rows to scan)

## Cascade Deletes

When a property is deleted, related records are automatically removed:

```
DELETE FROM properties WHERE id = ...
    ↓ (CASCADE)
    ├─→ DELETE FROM property_images
    ├─→ DELETE FROM property_enquiries (if exists)
    └─→ DELETE FROM property_viewings (if exists)
```

This is handled by existing foreign key constraints with `ON DELETE CASCADE`.

## Edge Cases

1. **Property flip-flops (true → false → true)**:
   - First sync: Created
   - Update to false: Deleted
   - Update to true: Re-created (new ID, fresh record)

2. **Webhook missed, cron catches it**:
   - Webhook fails to deliver update to exportable: false
   - Cron runs 6 hours later
   - Property not in exportable list → deleted by cron

3. **Property deleted in Apex27**:
   - Webhook sends delete event
   - Property removed from database
   - Exportable status irrelevant (already deleted)

## No Schema Changes Required

✅ All existing columns sufficient
✅ No new tables needed
✅ No indexes needed (filtering happens in-memory before DB operations)
✅ Cascade deletes already configured
