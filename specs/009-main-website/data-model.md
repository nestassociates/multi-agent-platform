# Data Model: Nest Associates Main Website

**Feature Branch**: `009-main-website`
**Created**: 2025-12-18
**Status**: Draft

## Overview

The main website uses two data sources:
1. **Payload CMS** - Blog posts, reviews, media (PostgreSQL `payload` schema)
2. **Dashboard API** - Properties, agents (external API calls)

This document focuses on the Payload CMS data model.

---

## Database Strategy

### Schema Isolation

```
Supabase PostgreSQL
├── public schema (Dashboard)
│   ├── profiles
│   ├── agents
│   ├── properties
│   ├── territories
│   └── ...
└── payload schema (Main Site CMS)
    ├── users
    ├── posts
    ├── reviews
    ├── media
    └── payload_migrations
```

### Connection Configuration

```typescript
// payload.config.ts
db: postgresAdapter({
  pool: { connectionString: process.env.DATABASE_URL },
  schemaName: 'payload',
  migrationTableName: 'payload_migrations',
}),
```

---

## Payload CMS Collections

### 1. Users (CMS Administrators)

Built-in Payload auth collection with custom role field.

```typescript
// collections/Users.ts
import { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      defaultValue: 'editor',
      required: true,
    },
  ],
};
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | email | Yes | Login email (built-in) |
| password | password | Yes | Auth password (built-in) |
| name | text | Yes | Display name |
| role | select | Yes | admin or editor |

### 2. Posts (Blog/Journal)

```typescript
// collections/Posts.ts
import { CollectionConfig } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'publishedAt'],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.title) {
              return data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            }
            return value;
          },
        ],
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 300,
      admin: {
        description: 'Brief summary shown in listings (max 300 chars)',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          // Add custom features as needed
        ],
      }),
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Market Insights', value: 'market-insights' },
        { label: 'Buying Tips', value: 'buying-tips' },
        { label: 'Selling Tips', value: 'selling-tips' },
        { label: 'Letting Advice', value: 'letting-advice' },
        { label: 'Local Area', value: 'local-area' },
        { label: 'Company News', value: 'company-news' },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          maxLength: 60,
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          maxLength: 160,
        },
      ],
    },
  ],
};
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | text | Yes | Article headline |
| slug | text | Yes | URL-friendly identifier (auto-generated) |
| featuredImage | upload | Yes | Hero image for article |
| excerpt | textarea | Yes | Summary for listings (max 300 chars) |
| content | richText | Yes | Full article content (Lexical editor) |
| category | select | Yes | Article category |
| tags | array | No | Optional tags for filtering |
| author | relationship | Yes | Link to Users collection |
| publishedAt | date | No | Publication date/time |
| status | select | Yes | draft or published |
| seo.metaTitle | text | No | Custom meta title |
| seo.metaDescription | textarea | No | Custom meta description |

### 3. Reviews (Testimonials)

```typescript
// collections/Reviews.ts
import { CollectionConfig } from 'payload';

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'reviewerName',
    defaultColumns: ['reviewerName', 'rating', 'source', 'publishedAt'],
  },
  fields: [
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      admin: {
        description: 'Rating out of 5 stars',
      },
    },
    {
      name: 'text',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Review content',
      },
    },
    {
      name: 'reviewerName',
      type: 'text',
      required: true,
      admin: {
        description: 'Name to display (can be anonymized)',
      },
    },
    {
      name: 'reviewerLocation',
      type: 'text',
      admin: {
        description: 'Optional location (e.g., "Manchester")',
      },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      options: [
        { label: 'Google', value: 'google' },
        { label: 'Agent Submitted', value: 'agent' },
        { label: 'Trustpilot', value: 'trustpilot' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'googleReviewId',
      type: 'text',
      admin: {
        condition: (data) => data.source === 'google',
        description: 'Google review ID for reference',
      },
    },
    {
      name: 'agentId',
      type: 'text',
      admin: {
        description: 'Dashboard agent ID if review is agent-specific',
      },
    },
    {
      name: 'propertyType',
      type: 'select',
      options: [
        { label: 'Sale', value: 'sale' },
        { label: 'Rental', value: 'rental' },
        { label: 'Valuation', value: 'valuation' },
        { label: 'General', value: 'general' },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show on homepage carousel',
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Verified review (from Google or verified customer)',
        position: 'sidebar',
      },
    },
  ],
};
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| rating | number | Yes | 1-5 star rating |
| text | textarea | Yes | Review content |
| reviewerName | text | Yes | Display name |
| reviewerLocation | text | No | Optional location |
| source | select | Yes | google, agent, trustpilot, other |
| googleReviewId | text | No | Google review reference (if source=google) |
| agentId | text | No | Dashboard agent ID (if agent-specific) |
| propertyType | select | No | Type of service reviewed |
| featured | checkbox | No | Show on homepage |
| publishedAt | date | Yes | When review was posted |
| verified | checkbox | No | Verified customer flag |

### 4. Media (Images)

```typescript
// collections/Media.ts
import { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: '../public/media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 512,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1920,
        height: 1080,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Alt text for accessibility',
      },
    },
    {
      name: 'caption',
      type: 'text',
    },
  ],
};
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| filename | text | Yes | Auto-generated from upload |
| alt | text | Yes | Accessibility alt text |
| caption | text | No | Optional image caption |
| url | text | Yes | Auto-generated URL |
| sizes | object | Yes | Auto-generated responsive sizes |

---

## External Data (Dashboard API)

### Properties (Read-Only from API)

Fetched from `GET /api/public/properties`. Not stored in Payload.

| Field | Type | Source |
|-------|------|--------|
| id | uuid | Dashboard |
| price | number | Dashboard |
| transaction_type | enum | Dashboard |
| bedrooms | number | Dashboard |
| bathrooms | number | Dashboard |
| property_type | string | Dashboard |
| address | object | Dashboard |
| images | array | Dashboard |
| agent | object | Dashboard |
| status | enum | Dashboard |
| features | array | Dashboard |

### Agents (Read-Only from API)

Fetched from `GET /api/public/agents`. Not stored in Payload.

| Field | Type | Source |
|-------|------|--------|
| id | uuid | Dashboard |
| name | string | Dashboard |
| email | string | Dashboard |
| phone | string | Dashboard |
| bio | text | Dashboard |
| avatar_url | string | Dashboard |
| microsite_url | string | Dashboard |
| territories | array | Dashboard |

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PAYLOAD CMS (payload schema)              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐               │
│  │  Users  │────▶│  Posts  │────▶│  Media  │               │
│  └─────────┘     └─────────┘     └─────────┘               │
│       │              │                │                     │
│       │              │                │                     │
│       └──────────────┴────────────────┘                     │
│              ▲                                              │
│              │                                              │
│  ┌─────────────────┐                                        │
│  │    Reviews      │                                        │
│  │  (agentId refs  │◀ ─ ─ ─ ─ ─ ─ ─ ┐                      │
│  │   Dashboard)    │                 │                      │
│  └─────────────────┘                 │                      │
│                                      │                      │
└──────────────────────────────────────│──────────────────────┘
                                       │
                                       │ (External API)
                                       │
┌──────────────────────────────────────│──────────────────────┐
│                    DASHBOARD API (public schema)             │
├──────────────────────────────────────│──────────────────────┤
│                                      ▼                      │
│  ┌─────────────┐     ┌─────────────────────┐               │
│  │   Agents    │────▶│     Properties      │               │
│  └─────────────┘     └─────────────────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Access Control

### Payload Collections Access

```typescript
// Example access control for Posts
access: {
  read: () => true,  // Public read
  create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
  update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
  delete: ({ req }) => req.user?.role === 'admin',
}
```

| Collection | Public Read | Create | Update | Delete |
|------------|-------------|--------|--------|--------|
| Users | No | Admin | Admin | Admin |
| Posts | Yes (published) | Admin, Editor | Admin, Editor | Admin |
| Reviews | Yes | Admin, Editor | Admin, Editor | Admin |
| Media | Yes | Admin, Editor | Admin, Editor | Admin |

---

## Indexes

### Posts

```sql
CREATE INDEX idx_posts_slug ON payload.posts(slug);
CREATE INDEX idx_posts_status ON payload.posts(status);
CREATE INDEX idx_posts_category ON payload.posts(category);
CREATE INDEX idx_posts_published_at ON payload.posts(published_at);
```

### Reviews

```sql
CREATE INDEX idx_reviews_source ON payload.reviews(source);
CREATE INDEX idx_reviews_featured ON payload.reviews(featured);
CREATE INDEX idx_reviews_agent_id ON payload.reviews(agent_id);
CREATE INDEX idx_reviews_published_at ON payload.reviews(published_at);
```

---

## Migration Notes

1. Run `npx payload migrate:create` after collection changes
2. Payload auto-manages migrations in `payload` schema
3. No impact on dashboard tables in `public` schema
4. Supabase pgAdmin can view both schemas
