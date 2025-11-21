# API Contract: Cleanup Non-Exportable Properties

**Endpoint**: `POST /api/admin/properties/cleanup-non-exportable`
**Authentication**: Required (Admin only)
**Purpose**: One-time cleanup operation to remove all non-exportable properties

## Request

### Headers
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

### Body
```json
{
  "dry_run": boolean  // Optional, default: false
}
```

**Parameters**:
- `dry_run`: If true, returns deletion plan without actually deleting

## Response

### Success (200 OK)

**Dry Run Response**:
```json
{
  "dry_run": true,
  "would_delete": 10680,
  "would_keep": 200,
  "sample_deletions": [
    {
      "id": "uuid",
      "apex27_id": "123",
      "title": "Valuation - 123 Main St",
      "agent_id": "uuid"
    }
  ]
}
```

**Actual Cleanup Response**:
```json
{
  "success": true,
  "deleted_count": 10680,
  "remaining_count": 200,
  "duration_ms": 45000,
  "timestamp": "2025-11-21T10:30:00Z"
}
```

### Error Responses

**401 Unauthorized**:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Admin authentication required"
  }
}
```

**500 Internal Server Error**:
```json
{
  "error": {
    "code": "CLEANUP_FAILED",
    "message": "Cleanup operation failed",
    "details": "Specific error message"
  }
}
```

## Behavior

1. Queries all properties from database
2. For each property, checks if it should be exportable (from Apex27 cached data)
3. Identifies non-exportable properties
4. If `dry_run: true`, returns deletion plan
5. If `dry_run: false`, permanently deletes identified properties
6. Cascade deletes related records (images, enquiries)
7. Logs all deletions to Sentry
8. Returns summary with counts and duration

## Notes

- This endpoint should be called ONCE during initial deployment
- Requires database backup before execution
- Supports dry-run for safety
- Operation is idempotent (safe to retry)
- Batch processing may be needed for large deletion counts
