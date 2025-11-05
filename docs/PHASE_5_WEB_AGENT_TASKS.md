# Phase 5: Content Creation - Web Agent Implementation Guide

**Perfect for Web Agent**: All 28 tasks are pure code (React components, forms, API routes) - no external services needed!

**Estimated Time**: 6-8 hours of focused work

**Context**: Agents create blog posts/area guides with rich text editor. Admins approve/reject content. Approved content triggers site rebuild.

---

## What Web Agent Will Build

### Components (16 files)
- Rich text editor (Tiptap)
- Content creation forms
- Content list views
- Moderation queue
- Character counters
- Email templates

### API Routes (6 endpoints)
- Agent content CRUD
- Admin moderation endpoints
- Approval/rejection workflows

### Utilities (3 files)
- Slug generator
- Auto-save logic
- Build queue integration

**No external dependencies to test!** User can test everything after implementation is complete.

---

## Task Breakdown

### Phase 5A: Rich Text Editor (4 tasks - 2 hours)

**T124**: Add Tiptap dependencies to `packages/ui/package.json`
```json
{
  "dependencies": {
    "@tiptap/react": "^2.1.13",
    "@tiptap/starter-kit": "^2.1.13",
    "@tiptap/extension-image": "^2.1.13"
  }
}
```

**T125**: Create `packages/ui/components/rich-text-editor.tsx`
- Basic Tiptap editor with toolbar
- Bold, italic, lists, headings
- 200-300 lines of React code

**T126**: Create `packages/ui/components/rich-text-editor-image-extension.ts`
- Image upload handling
- Supabase Storage integration
- ~100 lines

**T127**: Add auto-save to editor
- 30-second interval
- Draft state management
- ~50 lines addition

### Phase 5B: Agent Content Creation (8 tasks - 3 hours)

**T128**: Create `apps/dashboard/components/agent/content-form.tsx`
- Form with title, slug, content type, body
- React Hook Form + Zod validation
- ~250 lines

**T129**: Create `apps/dashboard/lib/slug-generator.ts`
- Auto-generate URL-safe slugs from titles
- Utility function
- ~30 lines

**T130**: Create `packages/ui/components/character-counter.tsx`
- Reusable character counter for text fields
- ~50 lines

**T131-132**: Create agent content pages
- `apps/dashboard/app/(agent)/content/page.tsx` - List view
- `apps/dashboard/app/(agent)/content/new/page.tsx` - Create form
- ~300 lines total

**T133-135**: Create agent content API routes
- `POST /api/agent/content` - Create draft
- `PATCH /api/agent/content/[id]` - Update/submit
- `GET /api/agent/content` - List with filters
- ~400 lines total

### Phase 5C: Admin Moderation (6 tasks - 2 hours)

**T136-138**: Create admin moderation UI
- `apps/dashboard/components/admin/moderation-queue.tsx`
- `apps/dashboard/components/admin/content-preview.tsx`
- `apps/dashboard/app/(admin)/content-moderation/page.tsx`
- ~500 lines total

**T139-141**: Create admin moderation API routes
- `GET /api/admin/content/moderation` - Queue
- `POST /api/admin/content/[id]/approve` - Approve
- `POST /api/admin/content/[id]/reject` - Reject
- ~300 lines total

### Phase 5D: Email Templates (3 tasks - 1 hour)

**T142-143**: Create email templates
- `packages/email/templates/content-approved.tsx`
- `packages/email/templates/content-rejected.tsx`
- React Email components
- ~200 lines total

**T144**: Integrate emails in API routes
- Add sendEmail calls to approve/reject endpoints
- ~20 lines of additions

### Phase 5E: Build Queue (2 tasks - 30 mins)

**T145**: Create `packages/build-system/queue.ts`
- Functions to add builds to queue
- Check for duplicates
- ~100 lines

**T146**: Integrate in approval endpoint
- Call queue.addBuild() when content approved
- ~10 lines addition

---

## Advantages of Phase 5 for Web Agent

✅ **Zero external dependencies** - No API keys, no database access, no testing required
✅ **Pure code work** - React components, TypeScript utilities, forms
✅ **Self-contained** - Database schema already exists, just needs code
✅ **Parallelizable** - Many tasks marked [P] can be done in any order
✅ **Testable later** - User can test everything after code is complete
✅ **28 tasks** - Substantial progress (brings total to 146/360 = 41%)

## Web Agent Instructions

**For each task**:
1. Read existing similar files for patterns (e.g., `create-agent-form.tsx` for form examples)
2. Create new file via GitHub web interface
3. Use TypeScript/React patterns from existing codebase
4. Commit each file individually with descriptive message
5. Reference task number in commit (e.g., "feat(T125): create rich text editor component")

**Dependencies already installed**:
- React 18 ✅
- React Hook Form ✅
- Zod validation ✅
- Tailwind CSS ✅
- Supabase client ✅

**Tiptap needs installing** (T124) - update package.json then user runs `pnpm install`

---

## After Web Agent Completes Phase 5

**User testing checklist**:
1. Run `pnpm install` (for Tiptap dependencies)
2. Visit `/content/new` as agent
3. Create test blog post
4. Submit for review
5. Visit `/content-moderation` as admin
6. Approve content
7. Verify email sent
8. Verify build queued

**Expected result**: Full content creation workflow functional, ready for Phase 7 (Build System) integration.

---

## Estimated Timeline

- **Phase 5A** (Rich text editor): 2 hours → 4 files
- **Phase 5B** (Agent content): 3 hours → 8 files
- **Phase 5C** (Admin moderation): 2 hours → 6 files
- **Phase 5D** (Email templates): 1 hour → 3 files
- **Phase 5E** (Build queue): 30 mins → 2 files

**Total**: 8.5 hours → 28 tasks → 23 files created

**Progress impact**: 118 → 146 tasks (33% → 41% complete)
