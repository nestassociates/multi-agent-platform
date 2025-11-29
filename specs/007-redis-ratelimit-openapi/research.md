# Research: Redis Rate Limiting & OpenAPI Documentation

**Feature**: 007-redis-ratelimit-openapi
**Date**: 2025-11-29

## 1. Upstash Redis Rate Limiting

### Decision: Use @upstash/ratelimit with sliding window algorithm

**Rationale**:
- Upstash is serverless-native (HTTP-based, no persistent connections)
- Perfect for Vercel deployment (no cold start issues with connections)
- @upstash/ratelimit provides pre-built algorithms (sliding window, fixed window, token bucket)
- REST API means no connection pooling needed

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| Redis with ioredis | Requires persistent connections, complex in serverless |
| Vercel KV | Also Upstash under the hood, but @upstash/ratelimit has better rate limit primitives |
| DynamoDB | Over-engineered for simple rate limiting |
| Supabase (existing) | Not designed for high-frequency rate limit checks |

### Implementation Pattern

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Login: 5 attempts per 15 minutes per email
const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  prefix: 'ratelimit:login',
});

// Contact: 5 requests per hour per IP
const contactLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'ratelimit:contact',
});
```

### Graceful Degradation Pattern

```typescript
async function isRateLimited(key: string, limiter: Ratelimit): Promise<{
  limited: boolean;
  remaining: number;
  reset: number;
}> {
  try {
    const result = await limiter.limit(key);
    return {
      limited: !result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    // Fail open - allow request if Redis unavailable
    console.error('Rate limit check failed, allowing request:', error);
    return { limited: false, remaining: -1, reset: 0 };
  }
}
```

---

## 2. OpenAPI Documentation with Zod Integration

### Decision: Use @asteasolutions/zod-to-openapi + swagger-ui-react

**Rationale**:
- Leverages existing 10 Zod schema modules in packages/validation
- zod-to-openapi is the most mature Zod-to-OpenAPI converter
- swagger-ui-react provides interactive documentation UI
- No duplicate schema definitions needed

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| Hand-written OpenAPI YAML | Maintenance burden, goes out of sync |
| next-swagger-doc | Less control over schema generation |
| tRPC | Would require major API refactor |
| Redoc | Less interactive than Swagger UI |

### Implementation Pattern

```typescript
// registry.ts - Register Zod schemas
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { loginSchema, contactFormSchema } from '@nest/validation';

export const registry = new OpenAPIRegistry();

registry.register('LoginRequest', loginSchema);
registry.register('ContactForm', contactFormSchema);
// ... register all schemas

// routes.ts - Define endpoints
registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  request: { body: { content: { 'application/json': { schema: loginSchema } } } },
  responses: { 200: { description: 'Login successful' } },
});

// spec.ts - Generate OpenAPI document
import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

export function generateOpenAPISpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Nest Platform API', version: '1.0.0' },
  });
}
```

### Swagger UI in Next.js App Router

```typescript
// app/api-docs/page.tsx
'use client';
import dynamic from 'next/dynamic';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return <SwaggerUI url="/api/openapi.json" />;
}

// app/api/openapi.json/route.ts
export async function GET() {
  const spec = generateOpenAPISpec();
  return Response.json(spec);
}
```

---

## 3. API Endpoint Categories

Based on analysis of 39 existing routes:

| Category | Count | Description | Auth Required |
|----------|-------|-------------|---------------|
| Admin | 20 | Agent/content management, global content | Admin role |
| Agent | 5 | Profile, content, fees, properties | Agent role |
| Auth | 4 | Login, logout, password reset | Mixed |
| Cron | 2 | Build processing, property sync | Service key |
| Public | 5 | Properties, agents, contact form | None |
| Upload | 1 | Image uploads | Authenticated |
| Webhooks | 1 | Apex27 property sync | Webhook auth |

---

## 4. Environment Variables

```env
# Upstash Redis (from Upstash Console)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

---

## 5. Dependencies to Install

```bash
pnpm add @upstash/ratelimit @upstash/redis --filter=@nest/dashboard
pnpm add @asteasolutions/zod-to-openapi swagger-ui-react --filter=@nest/dashboard
pnpm add -D @types/swagger-ui-react --filter=@nest/dashboard
```

---

## 6. Key Decisions Summary

| Decision | Choice | Notes |
|----------|--------|-------|
| Rate limit storage | Upstash Redis | Serverless-native, HTTP-based |
| Rate limit algorithm | Sliding window | Smoother than fixed window |
| Fail behavior | Fail-open | Allow requests if Redis down |
| OpenAPI generator | zod-to-openapi | Leverages existing Zod schemas |
| API docs UI | Swagger UI React | Interactive, industry standard |
| Docs access | Admin-only or dev-only | TBD based on deployment |
