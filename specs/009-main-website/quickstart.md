# Developer Quickstart: Nest Associates Main Website

**Feature Branch**: `009-main-website`
**Created**: 2025-12-18

## Prerequisites

- Node.js 18.17+
- pnpm 9.0.0+
- Access to Supabase project
- Apex27 API key (contact administrator)

## Quick Setup

### 1. Clone and Install

```bash
cd /path/to/nest
git checkout 009-main-website
pnpm install
```

### 2. Environment Variables

Create `apps/main-site/.env.local`:

```bash
# Database (Supabase - shared with dashboard)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres

# Payload CMS
PAYLOAD_SECRET=your-random-secret-min-32-chars

# Dashboard API
DASHBOARD_API_URL=http://localhost:3000
# Production: https://dashboard.nestassociates.co.uk

# Apex27 CRM
APEX27_API_KEY=your-apex27-api-key
APEX27_DEFAULT_BRANCH_ID=1

# Google Analytics (optional for dev)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Development
NODE_ENV=development
```

### 3. Start Development

```bash
# Start dashboard (required for property/agent APIs)
pnpm dev:dashboard  # runs on port 3000

# In another terminal, start main site
pnpm --filter @nest/main-site dev  # runs on port 3001
```

### 4. Access Points

| URL | Description |
|-----|-------------|
| http://localhost:3001 | Main website |
| http://localhost:3001/admin | Payload CMS admin |
| http://localhost:3000 | Dashboard (for API) |

---

## First Run: Payload Setup

On first run, Payload will:
1. Create `payload` schema in PostgreSQL
2. Run initial migrations
3. Prompt to create first admin user

```bash
# Create first admin via CLI (or use /admin UI)
pnpm --filter @nest/main-site payload create-user

# Enter email, password when prompted
```

---

## Project Structure

```
apps/main-site/
├── src/
│   ├── app/
│   │   ├── (frontend)/           # Public routes
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── buy/              # Buy listings
│   │   │   ├── rent/             # Rent listings
│   │   │   ├── property/[slug]/  # Property detail
│   │   │   ├── sell/             # Sellers page
│   │   │   ├── landlords/        # Landlords page
│   │   │   ├── agents/           # Agent directory
│   │   │   ├── agent/[id]/       # Agent profile
│   │   │   ├── join/             # Recruitment
│   │   │   ├── journal/          # Blog list
│   │   │   ├── journal/[slug]/   # Blog article
│   │   │   ├── about/            # About page
│   │   │   ├── reviews/          # Reviews page
│   │   │   ├── contact/          # Contact page
│   │   │   ├── register/         # Buyer registration
│   │   │   └── policies/         # Legal pages
│   │   ├── (payload)/            # CMS admin
│   │   │   ├── admin/[[...segments]]/
│   │   │   └── api/
│   │   └── api/
│   │       └── forms/            # Form submission handlers
│   ├── components/
│   ├── collections/              # Payload CMS collections
│   │   ├── Posts.ts
│   │   ├── Reviews.ts
│   │   ├── Users.ts
│   │   └── Media.ts
│   ├── lib/
│   │   ├── api/                  # Dashboard API client
│   │   ├── apex27/               # Apex27 CRM client
│   │   └── utils/
│   └── payload.config.ts
├── public/
│   └── media/                    # CMS uploads
├── tailwind.config.ts
└── next.config.mjs
```

---

## Common Tasks

### Add a Blog Post

1. Go to http://localhost:3001/admin
2. Login with admin credentials
3. Navigate to "Posts" collection
4. Click "Create New"
5. Fill in title, content, category
6. Upload featured image
7. Set status to "Published"
8. Save

### Add a Review

1. Go to http://localhost:3001/admin
2. Navigate to "Reviews" collection
3. Click "Create New"
4. Fill in reviewer name, rating, text
5. Select source (Google, Agent, etc.)
6. Set published date
7. Save

### Test Form Submission

```bash
# Test contact form
curl -X POST http://localhost:3001/api/forms/contact \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "message": "This is a test message."
  }'
```

### Generate Payload Types

```bash
pnpm --filter @nest/main-site generate:types
```

This creates `src/payload-types.ts` with TypeScript types for all collections.

---

## Development Patterns

### Fetching Properties from Dashboard API

```typescript
// lib/api/dashboard.ts
const DASHBOARD_API = process.env.DASHBOARD_API_URL || 'http://localhost:3000';

export async function getProperties(params?: {
  transaction_type?: 'sale' | 'rental';
  page?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.transaction_type) {
    searchParams.set('transaction_type', params.transaction_type);
  }
  if (params?.page) {
    searchParams.set('page', String(params.page));
  }

  const response = await fetch(
    `${DASHBOARD_API}/api/public/properties?${searchParams}`,
    { next: { revalidate: 300 } }  // 5-minute cache
  );

  if (!response.ok) {
    throw new Error('Failed to fetch properties');
  }

  return response.json();
}
```

### Using Payload Collections

```typescript
// In a Server Component
import { getPayloadHMR } from '@payloadcms/next/utilities';
import config from '@payload-config';

export default async function JournalPage() {
  const payload = await getPayloadHMR({ config });

  const posts = await payload.find({
    collection: 'posts',
    where: {
      status: { equals: 'published' },
    },
    sort: '-publishedAt',
    limit: 10,
  });

  return (
    <div>
      {posts.docs.map(post => (
        <ArticleCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

### Form with React Hook Form

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  message: z.string().min(10, 'Minimum 10 characters'),
});

type FormData = z.infer<typeof schema>;

export function ContactForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const response = await fetch('/api/forms/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (result.success) {
      alert('Thank you for your enquiry!');
    } else {
      alert('Error: ' + result.error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('firstName')} placeholder="First name" />
      {errors.firstName && <span>{errors.firstName.message}</span>}
      {/* ... more fields */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
```

---

## Testing

### Run Unit Tests

```bash
pnpm --filter @nest/main-site test
```

### Run E2E Tests

```bash
# Ensure dev servers are running
pnpm --filter @nest/main-site test:e2e
```

### Test without Apex27

Set `APEX27_MOCK=true` in `.env.local` to use mock client for development.

---

## Deployment

### Build

```bash
pnpm --filter @nest/main-site build
```

### Environment Variables for Production

```bash
# Vercel environment variables
DATABASE_URL=postgresql://...
PAYLOAD_SECRET=production-secret-32chars-min
DASHBOARD_API_URL=https://dashboard.nestassociates.co.uk
APEX27_API_KEY=production-api-key
APEX27_DEFAULT_BRANCH_ID=1
NEXT_PUBLIC_GA_ID=G-PRODUCTION
```

### Vercel Configuration

```json
// vercel.json (if needed)
{
  "functions": {
    "app/api/**/*": {
      "maxDuration": 30
    }
  }
}
```

---

## Troubleshooting

### "Cannot connect to database"

1. Check `DATABASE_URL` is correct
2. Ensure Supabase project is running
3. Check network access (IP allowlist)

### "Payload migration failed"

```bash
# Reset and re-run migrations
pnpm --filter @nest/main-site payload migrate:reset
pnpm --filter @nest/main-site payload migrate
```

### "Dashboard API returning 404"

1. Ensure dashboard is running on port 3000
2. Check `DASHBOARD_API_URL` env var
3. Verify `/api/public/properties` exists in dashboard

### "Apex27 API error"

1. Check `APEX27_API_KEY` is valid
2. Test API key with curl:
   ```bash
   curl -H "X-Api-Key: YOUR_KEY" https://api.apex27.co.uk/contacts
   ```
3. Use mock mode for development: `APEX27_MOCK=true`

---

## Resources

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Payload CMS 3.0 Docs](https://payloadcms.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- Internal: `specs/009-main-website/` for full specification
