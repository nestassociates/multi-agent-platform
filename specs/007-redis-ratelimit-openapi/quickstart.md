# Quickstart: Redis Rate Limiting & OpenAPI Documentation

**Feature**: 007-redis-ratelimit-openapi
**Date**: 2025-11-29

## Prerequisites

1. **Upstash Account**: Create a free account at [upstash.com](https://upstash.com)
2. **Redis Database**: Create a new Redis database in Upstash Console
3. **Environment Variables**: Get REST URL and token from Upstash

## Setup Steps

### 1. Install Dependencies

```bash
cd /Users/dan/Documents/Websites/Nest\ Associates/Project\ Nest/Nest
pnpm add @upstash/ratelimit @upstash/redis --filter=@nest/dashboard
pnpm add @asteasolutions/zod-to-openapi swagger-ui-react --filter=@nest/dashboard
pnpm add -D @types/swagger-ui-react --filter=@nest/dashboard
```

### 2. Environment Variables

Add to `.env.local`:
```env
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

Add to Vercel Environment Variables (Production + Preview):
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### 3. Verify Redis Connection

```typescript
// Test in Node.js REPL or a test file
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Test connection
await redis.ping(); // Should return "PONG"
```

### 4. Test Rate Limiting

```bash
# Test login rate limiting (should allow 5 attempts, then block)
for i in {1..7}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}'
  echo ""
done
```

Expected output:
- Attempts 1-5: `{"error":"Invalid credentials"}`
- Attempts 6-7: `{"error":"Too many login attempts. Try again in X minutes."}`

### 5. Access API Documentation

```
Development: http://localhost:3000/api-docs
Production:  https://dashboard.nestassociates.com/api-docs
```

## File Locations

| File | Purpose |
|------|---------|
| `apps/dashboard/lib/redis.ts` | Upstash Redis client |
| `apps/dashboard/lib/rate-limiter.ts` | Rate limiting functions |
| `apps/dashboard/lib/openapi/registry.ts` | Zod schema registry |
| `apps/dashboard/lib/openapi/routes.ts` | Endpoint definitions |
| `apps/dashboard/lib/openapi/spec.ts` | OpenAPI generator |
| `apps/dashboard/app/api-docs/page.tsx` | Swagger UI page |
| `apps/dashboard/app/api/openapi.json/route.ts` | OpenAPI JSON endpoint |

## Testing

### Rate Limiting Tests

```bash
# Run rate limiter unit tests
pnpm test --filter=@nest/dashboard -- --testPathPattern=rate-limiter
```

### API Documentation Tests

```bash
# Verify OpenAPI spec is valid
pnpm exec openapi-generator-cli validate -i specs/007-redis-ratelimit-openapi/contracts/openapi.yaml
```

## Troubleshooting

### Redis Connection Issues

1. Check environment variables are set correctly
2. Verify Upstash REST URL format: `https://xxx.upstash.io`
3. Check Upstash console for connection logs

### Rate Limit Not Working

1. Verify Redis connection (check for fail-open logs)
2. Check key format: `ratelimit:login:email@example.com`
3. Use Upstash Console to inspect Redis keys

### Swagger UI Not Loading

1. Check browser console for errors
2. Verify `/api/openapi.json` returns valid JSON
3. Check for CORS issues in development
