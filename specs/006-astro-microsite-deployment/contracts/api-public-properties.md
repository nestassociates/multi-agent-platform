# API Contract: Public Properties Endpoint

**Feature**: 006-astro-microsite-deployment
**Endpoint**: `GET /api/public/agents/[id]/properties`
**Authentication**: None (public)

## Overview

Returns all available properties for a specific agent. Used by agent microsites to fetch property listings client-side, ensuring data is always fresh without requiring site rebuilds.

## Request

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Agent ID |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `marketing_type` | string | No | all | Filter: `sale`, `rent`, or `all` |
| `cursor` | string | No | - | Pagination cursor (base64 encoded) |
| `limit` | number | No | 12 | Results per page (max 50) |

### Example Request

```
GET /api/public/agents/123e4567-e89b-12d3-a456-426614174000/properties?marketing_type=sale&limit=12
```

## Response

### Success (200 OK)

```json
{
  "data": [
    {
      "id": "prop-uuid-1",
      "apex27Id": "APX-12345",
      "marketingType": "sale",
      "price": 450000,
      "priceQualifier": "Offers Over",
      "address": {
        "line1": "123 High Street",
        "line2": "Flat 2",
        "city": "London",
        "postcode": "SW1A 1AA"
      },
      "bedrooms": 3,
      "bathrooms": 2,
      "propertyType": "Flat",
      "summary": "Stunning 3-bedroom apartment in the heart of Westminster...",
      "images": [
        {
          "url": "https://storage.supabase.co/...",
          "caption": "Living room"
        }
      ],
      "features": ["Garden", "Parking", "Central Heating"],
      "status": "available",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "nextCursor": "eyJpZCI6InByb3AtdXVpZC0xMiIsImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTE1VDEwOjMwOjAwWiJ9",
    "hasNextPage": true,
    "total": 47
  }
}
```

### Error Responses

#### Agent Not Found (404)

```json
{
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "Agent not found or inactive"
  }
}
```

#### Invalid Parameters (400)

```json
{
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Invalid marketing_type. Must be 'sale', 'rent', or 'all'"
  }
}
```

#### Rate Limited (429)

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later."
  }
}
```

## Implementation Notes

### Caching

- Response includes `Cache-Control: public, max-age=300` (5 minutes)
- ETag header for conditional requests
- Client should implement cache-busting for real-time updates

### Filtering

```sql
SELECT * FROM properties
WHERE agent_id = $1
  AND status = 'available'
  AND ($2 IS NULL OR marketing_type = $2)
ORDER BY created_at DESC, id DESC
LIMIT $3
```

### Pagination

Uses cursor-based pagination for consistent results:

```typescript
// Encode cursor
const cursor = Buffer.from(JSON.stringify({
  id: lastProperty.id,
  created_at: lastProperty.created_at
})).toString('base64');

// Decode and apply
const { id, created_at } = JSON.parse(Buffer.from(cursor, 'base64').toString());
query.or(`created_at.lt.${created_at},and(created_at.eq.${created_at},id.lt.${id})`);
```

### Security

- No authentication required (public data)
- Only returns properties with `status = 'available'`
- Only returns properties for `active` agents
- Sensitive fields excluded (internal notes, vendor contact)

## TypeScript Types

```typescript
// Request
interface PublicPropertiesRequest {
  agentId: string;
  marketingType?: 'sale' | 'rent' | 'all';
  cursor?: string;
  limit?: number;
}

// Response
interface PublicPropertiesResponse {
  data: PublicProperty[];
  pagination: {
    nextCursor: string | null;
    hasNextPage: boolean;
    total: number;
  };
}

interface PublicProperty {
  id: string;
  apex27Id: string;
  marketingType: 'sale' | 'rent';
  price: number;
  priceQualifier: string | null;
  address: {
    line1: string;
    line2: string | null;
    city: string;
    postcode: string;
  };
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  summary: string;
  images: {
    url: string;
    caption: string | null;
  }[];
  features: string[];
  status: string;
  createdAt: string;
}
```

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per IP
- Responds with 429 and `Retry-After` header when exceeded

## Testing Scenarios

1. **Happy path**: Valid agent ID returns properties
2. **Empty results**: Agent with no properties returns empty array
3. **Marketing type filter**: Only matching properties returned
4. **Pagination**: Cursor correctly fetches next page
5. **Inactive agent**: Returns 404
6. **Invalid UUID**: Returns 400
7. **Rate limiting**: Returns 429 after threshold
