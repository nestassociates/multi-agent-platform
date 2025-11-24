# Quickstart Guide: Content Submission System Refactor

**Feature**: 003-content-submission-refactor
**Date**: 2025-11-24
**Audience**: Developers implementing this feature

---

## Overview

This feature refactors the existing content submission and moderation system to improve security, UX, and scalability. It addresses XSS vulnerabilities, adds filtering/pagination, implements image uploads, creates an edit workflow, and polishes the UI.

**Estimated Effort**: 3-5 days (40-60 hours)
**Prerequisites**: Familiarity with Next.js 14, Supabase, shadcn/ui, Tiptap

---

## Quick Start

### 1. Checkout Feature Branch

```bash
git checkout 003-content-submission-refactor
```

### 2. Install New Dependencies (if needed)

```bash
cd apps/dashboard
npx shadcn@latest add pagination command popover
cd ../..
pnpm install
```

### 3. Run Database Migrations

```bash
# Create content-images bucket
supabase migration new create_content_images_bucket

# Add cursor pagination index
supabase migration new add_content_cursor_index

# Apply migrations
supabase db push
```

### 4. Start Development Server

```bash
pnpm run dev
```

Dashboard: http://localhost:3001
Agent Site: http://localhost:4321

---

## Implementation Phases

### Phase 0: Foundation (Priority P1)

**Goal**: Fix XSS vulnerability and set up infrastructure

**Tasks**:
1. ✅ Research completed (see `research.md`)
2. Run database migrations (content-images bucket, cursor index)
3. Verify `isomorphic-dompurify` is working in `lib/sanitize.ts`
4. Apply sanitization to admin review page
5. Apply sanitization to agent preview (when created)

**Testing**: Submit content with `<script>alert('XSS')</script>` and verify it's stripped

---

### Phase 1: Agent Content Editing (Priority P2)

**Goal**: Enable agents to edit drafts and rejected content

**Tasks**:
1. Create `/app/(agent)/content/[id]/edit/page.tsx`
2. Reuse `ContentForm` component with prefilled data
3. Add PUT endpoint handler to `/api/agent/content/[id]/route.ts`
4. Update content list to show "Edit" link for draft/rejected
5. Clear rejection_reason when resubmitting after rejection
6. Test: Create draft → Edit → Submit → Reject → Edit → Resubmit

**Files to Modify**:
- `apps/dashboard/app/(agent)/content/[id]/edit/page.tsx` (NEW)
- `apps/dashboard/app/api/agent/content/[id]/route.ts` (UPDATE)
- `apps/dashboard/app/(agent)/content/page.tsx` (UPDATE - add Edit link)

---

### Phase 2: Admin Filtering & Pagination (Priority P3)

**Goal**: Add filtering, search, and pagination to moderation queue

**Tasks**:
1. Remove hardcoded stats cards from moderation page
2. Create `FilterBar` component with:
   - Content type Select
   - Agent Combobox (search)
   - Date range inputs
   - Title search Input
3. Add cursor pagination to `/api/admin/content/moderation/route.ts`
4. Add Pagination component to moderation page
5. Store filters in URL params for bookmarking
6. Update UI to remove items after approve/reject without refresh

**Files to Modify**:
- `apps/dashboard/app/(admin)/content-moderation/page.tsx` (MAJOR REFACTOR)
- `apps/dashboard/components/admin/content-filter-bar.tsx` (NEW)
- `apps/dashboard/app/api/admin/content/moderation/route.ts` (UPDATE)

---

### Phase 3: Image Upload (Priority P4)

**Goal**: Add drag-and-drop image upload for featured images

**Tasks**:
1. Create `ImageUpload` component (can reuse patterns from Tiptap image upload)
2. Update `/api/upload/image/route.ts` to support content-images bucket
3. Replace URL input in `ContentForm` with `ImageUpload`
4. Add image preview in form
5. Test: Drag image → Upload → See preview → Submit content → View in admin

**Files to Modify**:
- `apps/dashboard/components/agent/image-upload.tsx` (NEW)
- `apps/dashboard/components/agent/content-form.tsx` (UPDATE)
- `apps/dashboard/app/api/upload/image/route.ts` (UPDATE - add content_type folder)

---

### Phase 4: Content Preview (Priority P5)

**Goal**: Add preview modal before submission

**Tasks**:
1. Create `ContentPreview` component with Dialog
2. Add "Preview" button to `ContentForm`
3. Apply sanitization and `.prose` styles
4. Extract Tiptap styles for preview rendering
5. Test: Write content → Click Preview → See formatted content → Close

**Files to Create**:
- `apps/dashboard/components/agent/content-preview.tsx` (NEW)

**Files to Modify**:
- `apps/dashboard/components/agent/content-form.tsx` (UPDATE - add Preview button)

---

### Phase 5: Consistent Modals (Priority P6)

**Goal**: Use Dialog for both approve and reject actions

**Tasks**:
1. Replace `window.confirm()` with Dialog in content review page
2. Create `ApprovalDialog` component
3. Update `RejectDialog` to match style
4. Add loading states to both dialogs
5. Test: Click Approve → See dialog → Confirm → Loading → Success

**Files to Modify**:
- `apps/dashboard/app/(admin)/content-moderation/[id]/page.tsx` (UPDATE)
- `apps/dashboard/components/admin/approval-dialog.tsx` (NEW)
- `apps/dashboard/components/admin/reject-dialog.tsx` (UPDATE existing)

---

## Key Files Reference

### Database & Types
- `supabase/migrations/` - Database schema and migrations
- `packages/shared-types/src/entities.ts` - TypeScript types
- `packages/validation/src/content.ts` - Zod validation schemas

### API Routes
- `apps/dashboard/app/api/agent/content/route.ts` - Agent endpoints
- `apps/dashboard/app/api/agent/content/[id]/route.ts` - Single content operations
- `apps/dashboard/app/api/admin/content/moderation/route.ts` - Admin moderation queue
- `apps/dashboard/app/api/admin/content/[id]/{approve,reject}/route.ts` - Moderation actions
- `apps/dashboard/app/api/upload/image/route.ts` - Image upload

### Agent UI
- `apps/dashboard/app/(agent)/content/page.tsx` - Content list
- `apps/dashboard/app/(agent)/content/new/page.tsx` - Create content
- `apps/dashboard/app/(agent)/content/[id]/edit/page.tsx` - Edit content (NEW)
- `apps/dashboard/components/agent/content-form.tsx` - Form component

### Admin UI
- `apps/dashboard/app/(admin)/content-moderation/page.tsx` - Moderation queue
- `apps/dashboard/app/(admin)/content-moderation/[id]/page.tsx` - Review page
- `apps/dashboard/components/admin/content-filter-bar.tsx` - Filters (NEW)

### Utilities
- `apps/dashboard/lib/sanitize.ts` - HTML sanitization (isomorphic-dompurify)
- `apps/dashboard/lib/image-processor.ts` - Sharp image optimization
- `packages/database/src/client.ts` - Supabase client factories

---

## Testing Strategy

### Unit Tests
- Sanitization function with various XSS vectors
- Cursor encoding/decoding functions
- Image validation and optimization

### Integration Tests
- Content creation → edit → submission flow
- Admin approval → build queue triggered
- Image upload → storage → URL returned

### E2E Tests (Playwright)
1. **Agent Creates Content**: Write post → Upload image → Preview → Submit
2. **Admin Reviews Content**: Filter queue → Review → Approve → Email sent
3. **Agent Edits Rejected**: View rejection → Edit → Resubmit
4. **Search and Filter**: Apply filters → Paginate results → Navigate

### Security Tests
- XSS injection attempts (script tags, event handlers, etc.)
- Image upload malicious files (HTML disguised as images)
- Authorization: Agent can't edit others' content
- Authorization: Non-admin can't access moderation endpoints

---

## Environment Variables

**No new environment variables needed** - Uses existing Supabase configuration

Verify these exist in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Common Issues & Solutions

### Issue: "Bucket not found" error
**Solution**: Run migrations to create `content-images` bucket

### Issue: XSS content still renders
**Solution**: Verify `sanitizeHtml()` is called before `dangerouslySetInnerHTML`

### Issue: Pagination cursor invalid
**Solution**: Check cursor is properly Base64-encoded with `{id, created_at}`

### Issue: Image upload fails with 413 Payload Too Large
**Solution**: Verify client-side validation for 5MB limit

### Issue: Can't filter by agent
**Solution**: Ensure admin has permission to list agents via `/api/admin/agents`

---

## Performance Considerations

### Cursor Pagination
- Much faster than OFFSET for large datasets
- Requires index on `(agent_id, created_at DESC, id DESC)`
- Handles real-time updates gracefully

### Image Optimization
- Sharp processing happens server-side
- WebP format reduces file size by 25-35%
- 1200px max width prevents oversized images

### Sanitization
- DOMPurify is fast (~1ms for typical content)
- Cache sanitized output if content doesn't change often
- Double sanitization (client + server) is acceptable overhead

---

## Next Steps After Implementation

1. **Monitor XSS attempts**: Add logging for sanitization events
2. **Analyze filter usage**: Track which filters admins use most
3. **Optimize images**: Consider auto-generating thumbnails
4. **Add analytics**: Track approval rates, review times, rejection reasons
5. **Implement webhooks**: Notify agents of status changes via webhook

---

## Documentation Links

- [Feature Specification](./spec.md)
- [Technical Research](./research.md)
- [Data Model](./data-model.md)
- [API Contracts](./contracts/api-contracts.md)
- [Implementation Plan](./plan.md)
- [Task List](./tasks.md) - Generated after `/speckit.plan` completes

---

## Getting Help

- **Supabase Docs**: https://supabase.com/docs
- **Next.js 14 Docs**: https://nextjs.org/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Tiptap**: https://tiptap.dev
- **DOMPurify**: https://github.com/cure53/DOMPurify

**Questions?** Check existing implementations:
- Avatar upload: `/apps/dashboard/app/api/upload/image/route.ts`
- Tiptap editor: `/apps/dashboard/components/tiptap-templates/simple/simple-editor.tsx`
- Admin filtering: `/apps/dashboard/app/api/admin/agents/route.ts`
