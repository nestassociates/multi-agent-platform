# Nest Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-29

## Active Technologies
- TypeScript 5.3+ (Next.js 14 App Router) + @supabase/supabase-js, Next.js API Routes (002-exportable-properties-filter)
- PostgreSQL (Supabase) with existing properties table (002-exportable-properties-filter)

- TypeScript 5.3+ / JavaScript ES2023 (001-multi-agent-platform)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.3+ / JavaScript ES2023: Follow standard conventions

## Recent Changes
- 003-content-submission-refactor: Added TypeScript 5.3+ (Next.js 14 App Router)
- 002-exportable-properties-filter: Added TypeScript 5.3+ (Next.js 14 App Router) + @supabase/supabase-js, Next.js API Routes

- 001-multi-agent-platform: Added TypeScript 5.3+ / JavaScript ES2023

<!-- MANUAL ADDITIONS START -->

## Feature: 003-content-submission-refactor

### Security Best Practices
- **HTML Sanitization**: Always use `sanitizeHtml()` from `@/lib/sanitize` before rendering user-submitted HTML with `dangerouslySetInnerHTML`
- **XSS Prevention**: Apply sanitization on both client (UX) and server (security) for defense-in-depth
- **Image URLs**: Validate image URLs come from Supabase Storage buckets (content-images or avatars)

### Cursor-Based Pagination Pattern
- **Location**: `apps/dashboard/lib/cursor-pagination.ts`
- **Usage**: For scalable pagination of large datasets (content lists, queues)
- **Functions**: `encodeCursor()`, `decodeCursor()`, `buildPaginationResponse()`
- **Cursor Format**: Base64-encoded `{id, created_at}` for stable ordering
- **Query Pattern**: Order by `created_at DESC, id DESC` with `.or()` filter for cursor

### Supabase Storage for Images
- **Bucket**: `content-images` for agent-uploaded featured images
- **Folder Structure**: `{user_id}/{content_type}/{uuid}.webp`
- **Processing**: Sharp optimization (1200px max width, 85% quality, WebP conversion)
- **RLS Policies**: Agents can upload/read/delete own images, public read access
- **API**: `/api/upload/image` with progress tracking via XMLHttpRequest

### shadcn/ui Components
- **New**: Pagination, Command (Combobox), Popover for filtering
- **Pattern**: Use Command + Popover for searchable dropdowns (agent selection)
- **Modals**: Consistent Dialog usage for all confirmation actions (approve/reject)
- **Loading States**: Loader2 icon with button disabling during API calls

### Content Preview
- **Component**: `ContentPreview` in `components/agent/content-preview.tsx`
- **Styling**: Tailwind Typography `.prose` with extensive customization
- **Security**: Always sanitize before preview rendering
- **Usage**: Shows agent how content will appear on their public site

### API Patterns
- **Filtering**: Support query params for type, agent, date range, search
- **Pagination**: Return `{ data, pagination: { nextCursor, hasNextPage, total } }`
- **Error Handling**: Structured errors with `{ error: { code, message, details } }`
- **Authorization**: Check status before allowing edits (draft/rejected only)

<!-- MANUAL ADDITIONS END -->
