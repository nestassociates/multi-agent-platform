# API Contract: Agent Profile Update (google_place_id)

**Endpoint**: `/api/agent/profile`
**Authentication**: Required (Supabase session)
**Authorization**: Agent role

## PATCH /api/agent/profile

Update the authenticated agent's profile, including new google_place_id field.

### Request

**Method**: PATCH
**Headers**:
- `Content-Type`: application/json
- `Cookie`: Supabase session cookie (automatic)

**Body** (partial update):
```json
{
  "google_place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4"
}
```

**New Field**:
- `google_place_id`: string, optional, format: starts with "ChIJ"

**Existing Fields** (unchanged):
- `company_name`, `bio`, `phone`, `office_address`, `coverage_areas`, `social_media_links`, `profile_image_url`

### Response

**Success (200)**:
```json
{
  "success": true,
  "agent": {
    "id": "uuid",
    "user_id": "uuid",
    "subdomain": "leanne",
    "company_name": "Leanne Taylor Estate Agents",
    "google_place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
    // ... other fields
    "updated_at": "2025-11-26T14:00:00Z"
  }
}
```

**Errors**:
- `400 Bad Request`: Validation failed (existing behavior)
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Agent profile not found
- `500 Internal Server Error`: Database error

---

## Validation

**Client-side** (UI form):
- google_place_id must start with "ChIJ" if provided
- Provide link to Google Place ID Finder for user guidance

**Server-side**:
- Basic string validation (Zod schema update)
- No strict format enforcement (Google widget validates existence)

## Notes

- Removing google_place_id: Send `null` or empty string
- Widget handles invalid Place IDs gracefully (shows error in iframe)
- No rate limiting needed (simple profile update, not external API call)
