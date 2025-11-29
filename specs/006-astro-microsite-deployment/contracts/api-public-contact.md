# API Contract: Contact Form Submission Endpoint

**Feature**: 006-astro-microsite-deployment
**Endpoint**: `POST /api/public/contact`
**Authentication**: None (public)

## Overview

Handles contact form submissions from agent microsites. Stores the submission, notifies the agent via email, and returns success confirmation.

## Request

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | Must be `application/json` |
| `Origin` | Yes | Validated against allowed domains |

### Body

```json
{
  "agentId": "123e4567-e89b-12d3-a456-426614174000",
  "propertyId": "456e7890-e89b-12d3-a456-426614174000",
  "name": "John Smith",
  "email": "john.smith@example.com",
  "phone": "+44 7700 900000",
  "message": "I'm interested in viewing this property. Please contact me at your earliest convenience.",
  "honeypot": ""
}
```

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | UUID | Yes | Agent receiving the inquiry |
| `propertyId` | UUID | No | Related property (if applicable) |
| `name` | string | Yes | Sender's name (2-100 chars) |
| `email` | string | Yes | Sender's email address |
| `phone` | string | No | Sender's phone (max 20 chars) |
| `message` | string | Yes | Message content (10-2000 chars) |
| `honeypot` | string | No | Bot detection field (must be empty) |

## Response

### Success (200 OK)

```json
{
  "success": true,
  "message": "Thank you for your message. The agent will respond shortly."
}
```

### Error Responses

#### Validation Error (400)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email address",
    "details": {
      "field": "email",
      "reason": "Must be a valid email address"
    }
  }
}
```

#### Agent Not Found (404)

```json
{
  "success": false,
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "Agent not found or inactive"
  }
}
```

#### Bot Detected (400)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_SUBMISSION",
    "message": "Invalid form submission"
  }
}
```

#### Rate Limited (429)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many submissions. Please try again in 1 hour."
  }
}
```

## Implementation Notes

### Validation

```typescript
import { z } from 'zod';

const contactFormSchema = z.object({
  agentId: z.string().uuid(),
  propertyId: z.string().uuid().optional(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  message: z.string().min(10).max(2000),
  honeypot: z.string().max(0).optional(), // Must be empty
});
```

### Security Measures

1. **Honeypot Field**: Hidden field that bots typically fill. Non-empty = bot.
2. **Origin Validation**: Only accept requests from allowed domains.
3. **Rate Limiting**: 5 submissions per IP per hour.
4. **HTML Sanitization**: Strip all HTML from message content.
5. **CORS**: Configured for agent site subdomains only.

### Database Insert

```sql
INSERT INTO contact_form_submissions (
  agent_id,
  property_id,
  name,
  email,
  phone,
  message
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id;
```

### Email Notification

After successful storage, send notification to agent:

```typescript
await resend.emails.send({
  from: 'Nest Associates <noreply@nestassociates.co.uk>',
  to: agent.email,
  subject: `New inquiry from ${name}`,
  react: ContactNotificationEmail({
    agentName: agent.full_name,
    senderName: name,
    senderEmail: email,
    senderPhone: phone,
    message: message,
    propertyAddress: property?.address,
  }),
});
```

### CORS Configuration

```typescript
const allowedOrigins = [
  /^https:\/\/[a-z0-9-]+\.nestassociates\.co\.uk$/,
  process.env.NODE_ENV === 'development' && 'http://localhost:4321',
].filter(Boolean);

// Validate origin
const origin = request.headers.get('Origin');
if (!allowedOrigins.some(o =>
  typeof o === 'string' ? o === origin : o.test(origin)
)) {
  return new Response('Forbidden', { status: 403 });
}
```

## TypeScript Types

```typescript
// Request
interface ContactFormRequest {
  agentId: string;
  propertyId?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  honeypot?: string;
}

// Response (success)
interface ContactFormSuccessResponse {
  success: true;
  message: string;
}

// Response (error)
interface ContactFormErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      field: string;
      reason: string;
    };
  };
}
```

## Rate Limiting

- 5 submissions per IP per hour
- 20 submissions per agent per hour (prevents spam to single agent)
- Returns 429 with `Retry-After` header when exceeded
- Uses IP + agent_id composite key for rate tracking

## Testing Scenarios

1. **Happy path**: Valid submission stores and sends email
2. **Missing required fields**: Returns 400 with field errors
3. **Invalid email**: Returns validation error
4. **Honeypot filled**: Returns 400 (bot detection)
5. **Invalid agent ID**: Returns 404
6. **Inactive agent**: Returns 404
7. **Rate limited**: Returns 429 after threshold
8. **Invalid origin**: Returns 403
9. **Property reference**: Links submission to property correctly
10. **Long message**: Truncates at 2000 characters
