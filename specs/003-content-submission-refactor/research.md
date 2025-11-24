# Content Submission System Refactor - Technical Research Findings

**Date**: 2025-11-24
**Phase**: 0 - Technical Research
**Status**: Complete

## Summary

All technical decisions have been made based on existing codebase patterns and industry best practices. Key findings: isomorphic-dompurify is already installed and configured, Supabase Storage is proven with avatar uploads, and cursor-based pagination will scale better than the current offset approach.

---

## 1. HTML Sanitization Library (isomorphic-dompurify)

### Decision
**Use `isomorphic-dompurify` v2.32.0** (already installed)

### Rationale
- ✅ Already implemented in `/apps/dashboard/lib/sanitize.ts`
- Works on both client and server (Next.js Server/Client Components)
- Industry standard with 35M+ weekly downloads
- Preserves Tiptap HTML structure with `data-*` attributes
- Removes all XSS vectors while preserving rich text formatting

### Implementation Notes

**Current Configuration** preserves:
- Text formatting: strong, em, u, s, code
- Headings: h1-h6
- Lists: ul, ol, li (including task lists via data-checked)
- Images: img with src, alt, title
- Links: a with href, target, rel
- Tables: Full support
- Block elements: blockquote, pre, hr

**Where to Sanitize**:
1. Client-side (preview modal) - UX feedback
2. Server-side (API routes) - Security enforcement
3. Double sanitization for defense-in-depth

### Alternatives Considered
- DOMPurify (browser-only): ❌ No SSR support
- sanitize-html: ❌ Less maintained, larger bundle
- js-xss: ❌ Poor TypeScript support

---

## 2. Supabase Storage for Image Uploads

### Decision
**Use Supabase Storage with dedicated `content-images` bucket** and RLS policies

### Rationale
- ✅ Already proven with avatar uploads (`/api/upload/image/route.ts`)
- RLS integration with database authentication
- Built-in CDN with edge caching
- Cost-effective: 1GB free, $0.021/GB/month after
- Sharp integration for server-side processing

### Implementation Notes

**Bucket Configuration**:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-images',
  'content-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);
```

**RLS Policies**: Agent can upload/read/delete own folder, public read access

**Folder Structure**:
```
content-images/{agent_user_id}/{content_type}/{uuid}.webp
```

**File Naming**: Use UUID-based (more secure than timestamp)

**Processing**: Sharp optimization to 1200px width, 85% quality, WebP format

### Alternatives Considered
- Cloudinary: ❌ Additional cost
- AWS S3: ❌ More complex, no RLS
- Uploadthing: ❌ Another dependency

---

## 3. Cursor-Based Pagination

### Decision
**Use ID-based cursor pagination** with `created_at + id` for stable ordering

### Rationale
- Better performance than OFFSET (no table scan)
- Handles real-time inserts/deletes without duplicates/skips
- Works with status filters and search
- Supabase supports cursor queries natively

### Implementation Notes

**Cursor Format**: Base64-encoded `{id, created_at}`

**Query Pattern**:
```typescript
let query = supabase
  .from('content_submissions')
  .select('*')
  .order('created_at', { ascending: false })
  .order('id', { ascending: false })
  .limit(limit + 1); // +1 to check hasNextPage

if (cursor) {
  query = query.or(
    `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
  );
}
```

**Index Required**:
```sql
CREATE INDEX idx_content_cursor
ON content_submissions(agent_id, created_at DESC, id DESC)
WHERE status != 'deleted';
```

**Recommendation**: Use cursor for agent lists (high volume), keep offset for admin views (acceptable for low volume)

### Alternatives Considered
- Offset-based: ✅ Simpler, already used, acceptable for admin
- Relay-style: ❌ Over-engineered

---

## 4. Next.js 14 Image Upload Patterns

### Decision
**Use API Routes** (not Server Actions) with native HTML5 drag-and-drop

### Rationale
- ✅ Already implemented in `/api/upload/image/route.ts`
- API Routes allow progress tracking via XMLHttpRequest
- Server Actions can't stream progress
- Native drag-and-drop sufficient, no library needed

### Implementation Notes

**API Route**: Validates size (5MB), processes with Sharp, uploads to Supabase Storage

**Client Upload with Progress**:
```typescript
const xhr = new XMLHttpRequest();
xhr.upload.addEventListener('progress', (e) => {
  const progress = (e.loaded / e.total) * 100;
  onProgress?.(progress);
});
xhr.open('POST', '/api/upload/image');
xhr.send(formData);
```

**Drag-and-Drop**: ✅ Complete implementation exists in `/components/tiptap-node/image-upload-node/`

**Existing Hook**: `useFileUpload` with progress, abort controller, error handling

### Alternatives Considered
- Server Actions: ❌ No progress tracking
- react-dropzone: ❌ Unnecessary 37KB bundle
- uppy/filepond: ❌ Over-engineered

---

## 5. shadcn/ui Component Usage

### Decision
**Use existing shadcn components** + add Pagination, Command, Popover

### Rationale
- ✅ 21 components already installed and used extensively
- Maintains design system consistency
- Fully customizable (copied into codebase)
- Built on Radix UI (ARIA-compliant)
- Zero additional runtime cost

### Implementation Notes

**Existing Components**: Dialog, Select, Input, Textarea, Button, Card, Badge, Table, Alert, Skeleton, Tooltip, Form

**To Add**:
1. **Pagination**: `npx shadcn@latest add pagination`
2. **Combobox** (for agent search): `npx shadcn@latest add command popover`

**Loading State Pattern**:
- Skeleton for initial load
- Spinner (Loader2) for actions
- Button disabled states during submission

**Form Integration**: Already using react-hook-form + zod with Form components

### Alternatives Considered
- Headless UI: ❌ shadcn more popular
- Radix direct: ❌ More setup needed
- Custom: ❌ Accessibility issues

---

## 6. Tiptap Editor Preview

### Decision
**Render HTML with `dangerouslySetInnerHTML`** after sanitization + site styles

### Rationale
- No need for editor bundle in preview (200KB+ saved)
- Already have sanitization function
- Apply `.prose` styles from `@tailwindcss/typography` (installed)
- Static HTML rendering is faster

### Implementation Notes

**Export HTML**: `editor.getHTML()` (already implemented)

**Preview Component**:
```tsx
<article
  className="prose prose-neutral max-w-none"
  dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
/>
```

**Site Styles**: Use `@tailwindcss/typography` with custom configuration

**Tiptap-specific Styles**: Extract from existing SCSS files in `/components/tiptap-node/`

**Security**: Always sanitize before rendering, validate image URLs

### Alternatives Considered
- Read-only Tiptap: ❌ Unnecessary bundle size
- markdown-to-html: ❌ Tiptap outputs HTML
- iframe: ❌ Over-engineered

---

## Technology Summary

| Technology | Status | Purpose |
|-----------|--------|---------|
| isomorphic-dompurify | ✅ Installed | XSS prevention |
| Supabase Storage | ✅ Extend existing | Image hosting |
| Cursor Pagination | 🆕 Implement | Scalable lists |
| API Routes + XHR | ✅ Existing | Upload progress |
| shadcn/ui | ✅ Add 3 components | Consistent UI |
| @tailwindcss/typography | ✅ Installed | Content preview |
| Sharp | ✅ Existing | Image optimization |
| react-hook-form + zod | ✅ Existing | Form validation |

**All decisions extend existing patterns - no breaking changes required.**
