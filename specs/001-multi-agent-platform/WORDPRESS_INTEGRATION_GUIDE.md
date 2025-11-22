# WordPress Integration Guide

**Last Updated**: 2025-11-22
**API Version**: 1.0

## Overview

This guide explains how to integrate the Nest Associates agent network with your WordPress main website using the public APIs. The APIs allow you to display agent directories and property search functionality on your WordPress site.

---

## API Endpoints

### Base URL

```
https://your-dashboard-domain.com/api/public
```

Replace `your-dashboard-domain.com` with your actual dashboard deployment URL (e.g., `dashboard.nestassociates.com`).

---

## 1. Agents API

### GET /api/public/agents

Fetch all active agents in the network.

#### Request

```http
GET /api/public/agents HTTP/1.1
Host: dashboard.nestassociates.com
```

#### Response

```json
{
  "agents": [
    {
      "id": "uuid",
      "name": "George Bailey",
      "first_name": "George",
      "last_name": "Bailey",
      "email": "george@example.com",
      "phone": "+44 1234 567890",
      "bio": "Professional estate agent with 10 years experience...",
      "avatar_url": "https://...",
      "subdomain": "georgebailey",
      "site_url": "https://georgebailey.agents.nestassociates.com",
      "qualifications": ["NAEA", "ARLA"],
      "social_links": {
        "facebook": "https://facebook.com/...",
        "linkedin": "https://linkedin.com/in/..."
      },
      "territory": {
        "name": "TA2 Territory - George Bailey",
        "property_count": 48561
      }
    }
  ],
  "count": 16
}
```

#### Caching

- **Cache-Control**: `public, max-age=300` (5 minutes)
- Safe to cache on WordPress side

---

## 2. Properties API

### GET /api/public/properties

Search properties across all agents with filters.

#### Request

```http
GET /api/public/properties?transaction_type=sale&bedrooms=3&min_price=200000&max_price=500000 HTTP/1.1
Host: dashboard.nestassociates.com
```

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `transaction_type` | string | `sale` or `let` | `sale` |
| `min_price` | number | Minimum price | `200000` |
| `max_price` | number | Maximum price | `500000` |
| `bedrooms` | number | Number of bedrooms | `3` |
| `postcode` | string | Postcode area | `TA1` |
| `location` | string | Town/city name | `Taunton` |
| `limit` | number | Max results (1-100) | `20` |

#### Response

```json
{
  "properties": [
    {
      "id": "uuid",
      "apex27_id": "12345",
      "title": "Beautiful 3 Bed House in Taunton",
      "slug": "beautiful-3-bed-house-taunton",
      "description": "A stunning property...",
      "transaction_type": "sale",
      "price": 350000,
      "bedrooms": 3,
      "bathrooms": 2,
      "status": "available",
      "is_featured": true,
      "featured_image_url": "https://...",
      "address": "123 High Street",
      "town": "Taunton",
      "county": "Somerset",
      "postcode": "TA1 2AA",
      "latitude": 51.0151,
      "longitude": -3.1006,
      "agent": {
        "id": "uuid",
        "name": "George Bailey",
        "subdomain": "georgebailey",
        "site_url": "https://georgebailey.agents.nestassociates.com",
        "email": "george@example.com",
        "phone": "+44 1234 567890"
      },
      "property_url": "https://georgebailey.agents.nestassociates.com/properties/beautiful-3-bed-house-taunton"
    }
  ],
  "count": 42
}
```

#### Caching

- **Cache-Control**: `public, max-age=300` (5 minutes)
- Safe to cache search results

---

## CORS Configuration

Both APIs support Cross-Origin Resource Sharing (CORS):

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

This allows WordPress to call the APIs directly from the browser without CORS errors.

---

## Rate Limiting

- **No authentication required** - public endpoints
- **Rate limit**: Standard Vercel limits (typically 100 requests/second)
- **Recommended**: Implement client-side caching (5 minutes minimum)

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

Common error codes:
- `QUERY_ERROR`: Database query failed
- `VALIDATION_ERROR`: Invalid query parameters
- `INTERNAL_SERVER_ERROR`: Server error

---

## WordPress Integration Examples

See the following files for complete widget implementations:

1. **Agent Directory Widget**: `/specs/001-multi-agent-platform/examples/agent-directory-widget.php`
2. **Property Search Widget**: `/specs/001-multi-agent-platform/examples/property-search-widget.php`

---

## Security Notes

1. **Public Data Only**: APIs only expose data marked for public display
2. **No Sensitive Info**: Email addresses and phone numbers are included (agents want leads)
3. **XSS Protection**: Always sanitize output when rendering in WordPress
4. **SQL Injection**: APIs use parameterized queries, safe from injection

---

## Support

For API issues or questions:
- **Documentation**: This guide
- **Issues**: GitHub repository
- **Contact**: dev@nestassociates.com

---

## Changelog

### Version 1.0 (2025-11-22)
- Initial release
- `/api/public/agents` endpoint
- `/api/public/properties` endpoint with search filters
- CORS support
- 5-minute caching
