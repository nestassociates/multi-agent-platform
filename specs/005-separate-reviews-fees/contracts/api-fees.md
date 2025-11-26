# API Contract: Agent Fees

**Endpoint**: `/api/agent/fees`
**Authentication**: Required (Supabase session)
**Authorization**: Agent role

## GET /api/agent/fees

Get the authenticated agent's current fee structure.

### Request

**Method**: GET
**Headers**:
- `Cookie`: Supabase session cookie (automatic)

**Query Parameters**: None

### Response

**Success (200)**:
```json
{
  "fees": {
    "id": "uuid",
    "agent_id": "uuid",
    "sales_percentage": 1.5,
    "lettings_percentage": 10.0,
    "minimum_fee": 2000.00,
    "notes": "Additional services priced separately",
    "created_at": "2025-11-26T10:00:00Z",
    "updated_at": "2025-11-26T12:30:00Z"
  }
}
```

**Not Configured (200)**:
```json
{
  "fees": null
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated
  ```json
  { "error": "Unauthorized" }
  ```

- `404 Not Found`: Agent profile not found
  ```json
  { "error": "Not found" }
  ```

---

## POST /api/agent/fees

Create or update the authenticated agent's fee structure.

### Request

**Method**: POST
**Headers**:
- `Content-Type`: application/json
- `Cookie`: Supabase session cookie (automatic)

**Body**:
```json
{
  "sales_percentage": 1.5,
  "lettings_percentage": 10.0,
  "minimum_fee": 2000.00,      // optional
  "notes": "Contact for bespoke services"  // optional
}
```

**Validation Rules**:
- `sales_percentage`: number, required, 0-100, max 2 decimals
- `lettings_percentage`: number, required, 0-100, max 2 decimals
- `minimum_fee`: number, optional, >= 0, max 2 decimals
- `notes`: string, optional, max 1000 characters

### Response

**Success (200)**:
```json
{
  "success": true,
  "fees": {
    "id": "uuid",
    "agent_id": "uuid",
    "sales_percentage": 1.5,
    "lettings_percentage": 10.0,
    "minimum_fee": 2000.00,
    "notes": "Contact for bespoke services",
    "created_at": "2025-11-26T10:00:00Z",
    "updated_at": "2025-11-26T13:00:00Z"
  }
}
```

**Errors**:
- `400 Bad Request`: Validation failed
  ```json
  {
    "error": [
      {
        "code": "too_big",
        "maximum": 100,
        "path": ["sales_percentage"],
        "message": "Number must be less than or equal to 100"
      }
    ]
  }
  ```

- `401 Unauthorized`: Not authenticated
  ```json
  { "error": "Unauthorized" }
  ```

- `404 Not Found`: Agent profile not found
  ```json
  { "error": "Not found" }
  ```

- `500 Internal Server Error`: Database error
  ```json
  { "error": "Failed to save" }
  ```

---

## Behavior Notes

- **Upsert semantics**: POST creates if doesn't exist, updates if exists (based on agent_id UNIQUE constraint)
- **No versioning**: Updates overwrite previous values
- **Immediate effect**: Changes apply instantly, no approval workflow
- **Concurrent updates**: Last write wins, no optimistic locking
