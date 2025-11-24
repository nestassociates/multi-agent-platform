# Implementation Plan: Content Submission System Refactor

**Branch**: `003-content-submission-refactor` | **Date**: 2025-11-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-content-submission-refactor/spec.md`

---

## Summary

This feature refactors the existing content submission and moderation system to address security vulnerabilities (XSS), improve user experience for both administrators and agents, and add missing functionality. Key improvements include HTML sanitization, content editing workflow, advanced filtering/pagination, image upload, content preview, and consistent UI patterns.

**Primary Requirement**: Fix XSS vulnerability by sanitizing all user-submitted HTML
**Technical Approach**: Use existing `isomorphic-dompurify` library (already installed and configured), extend Supabase Storage for images, implement cursor-based pagination for scalability, and enhance UI with additional shadcn components.

---

## Technical Context

**Language/Version**: TypeScript 5.3+ (Next.js 14 App Router)
**Primary Dependencies**:
- Next.js 14.0.3
- React 18.2.0
- @supabase/supabase-js 2.38.4 (Database + Storage)
- isomorphic-dompurify 2.32.0 (HTML sanitization)
- @tiptap/react 3.10+ (Rich text editor)
- shadcn/ui + Radix UI (Component library)
- zod 3.25+ (Validation)
- react-hook-form 7.66+ (Forms)
- Sharp 0.34+ (Image processing)

**Storage**:
- PostgreSQL via Supabase (existing `content_submissions` table, no schema changes)
- Supabase Storage (new `content-images` bucket for uploaded images)

**Testing**:
- Jest (unit tests)
- Playwright (E2E tests)
- Manual security testing (XSS injection attempts)

**Target Platform**: Web (Browser + Server-side rendering)

**Project Type**: Web application (Next.js 14 App Router monorepo)

**Performance Goals**:
- Content moderation queue loads in <1s for 1000+ items (first page)
- Filter application updates results in <500ms
- Image uploads complete in <5s for 5MB files
- HTML sanitization processes typical content in <1ms

**Constraints**:
- 5MB max image upload size
- 20 items per page (pagination)
- RLS policies must prevent unauthorized access
- All HTML must be sanitized before rendering

**Scale/Scope**:
- 50+ agents creating content
- 1000+ content submissions over time
- 2-3 admins moderating content
- 6 user stories (P1-P6 prioritized)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASSED (No constitution file exists - template only)

The project does not have an established constitution file (`.specify/memory/constitution.md` is a template). Therefore, no constitution violations are possible. This implementation follows standard Next.js/Supabase best practices:

- Uses existing patterns from codebase (avatar uploads, content forms, admin filtering)
- No new architectural patterns introduced
- Extends existing database schema (additive only - new index, new bucket)
- Maintains existing RLS security model
- Uses battle-tested libraries (DOMPurify, Sharp, Radix UI)
- Follows monorepo structure (apps/dashboard, packages/*)

**Post-Design Re-check**: ✅ PASSED (Phase 1 complete)

All design decisions documented in `research.md`, `data-model.md`, and `api-contracts.md` align with existing codebase patterns. No complexity introduced that requires constitution justification.

---

## Project Structure

### Documentation (this feature)

```text
specs/003-content-submission-refactor/
├── spec.md                    # Feature specification (/speckit.specify output)
├── plan.md                    # This file (/speckit.plan output)
├── research.md                # Phase 0 output - Technical decisions
├── data-model.md              # Phase 1 output - Database schema & entities
├── quickstart.md              # Phase 1 output - Developer guide
├── contracts/                 # Phase 1 output - API specifications
│   └── api-contracts.md       # REST API endpoint definitions
├── checklists/                # Validation checklists
│   └── requirements.md        # Spec quality checklist (passed)
└── tasks.md                   # Phase 2 output (/speckit.tasks - NOT YET CREATED)
```

### Source Code (repository root)

This is a **web application** with Next.js dashboard app and supporting packages:

```text
apps/
├── dashboard/                          # Next.js 14 App Router application
│   ├── app/
│   │   ├── (agent)/
│   │   │   └── content/
│   │   │       ├── page.tsx            # Content list (MODIFY: add Edit link)
│   │   │       ├── new/
│   │   │       │   └── page.tsx        # Create content (EXISTING)
│   │   │       └── [id]/
│   │   │           └── edit/
│   │   │               └── page.tsx    # NEW: Edit content page
│   │   ├── (admin)/
│   │   │   └── content-moderation/
│   │   │       ├── page.tsx            # REFACTOR: Remove stats, add filters/pagination
│   │   │       └── [id]/
│   │   │           └── page.tsx        # MODIFY: Apply sanitization, use Dialog for approve
│   │   └── api/
│   │       ├── agent/
│   │       │   └── content/
│   │       │       ├── route.ts        # EXISTING: Create content
│   │       │       └── [id]/
│   │       │           └── route.ts    # NEW: GET, PUT, DELETE for single content
│   │       ├── admin/
│   │       │   ├── content/
│   │       │   │   ├── moderation/
│   │       │   │   │   └── route.ts    # MODIFY: Add filtering, cursor pagination
│   │       │   │   └── [id]/
│   │       │   │       ├── route.ts    # EXISTING: GET single content
│   │       │   │       ├── approve/
│   │       │   │       │   └── route.ts # EXISTING: Approve endpoint
│   │       │   │       └── reject/
│   │       │   │           └── route.ts # EXISTING: Reject endpoint
│   │       │   └── agents/
│   │       │       └── route.ts        # EXISTING: List agents (used for filter)
│   │       └── upload/
│   │           └── image/
│   │               └── route.ts        # MODIFY: Add content-images bucket support
│   ├── components/
│   │   ├── agent/
│   │   │   ├── content-form.tsx        # MODIFY: Add ImageUpload, Preview button
│   │   │   ├── content-preview.tsx     # NEW: Preview modal with sanitization
│   │   │   └── image-upload.tsx        # NEW: Drag-drop image upload component
│   │   ├── admin/
│   │   │   ├── content-filter-bar.tsx  # NEW: Filters for moderation queue
│   │   │   ├── approval-dialog.tsx     # NEW: Consistent approval modal
│   │   │   └── reject-dialog.tsx       # MODIFY: Match approval dialog style
│   │   ├── ui/                         # shadcn/ui components
│   │   │   ├── pagination.tsx          # NEW: Add via `npx shadcn add pagination`
│   │   │   ├── command.tsx             # NEW: Add via `npx shadcn add command`
│   │   │   ├── popover.tsx             # NEW: Add via `npx shadcn add popover`
│   │   │   └── ...                     # 21 existing components (Dialog, Button, etc.)
│   │   └── tiptap-templates/
│   │       └── simple/
│   │           └── simple-editor.tsx   # EXISTING: Tiptap editor (no changes)
│   ├── lib/
│   │   ├── sanitize.ts                 # EXISTING: DOMPurify configuration
│   │   ├── image-processor.ts          # EXISTING: Sharp utilities
│   │   └── cursor-pagination.ts        # NEW: Cursor encode/decode utilities
│   └── package.json                    # Add new shadcn components

packages/
├── validation/
│   └── src/
│       └── content.ts                  # MODIFY: Add imageUploadSchema, contentImageUrlSchema
├── shared-types/
│   └── src/
│       └── entities.ts                 # EXISTING: ContentSubmission type (no changes)
├── database/
│   └── src/
│       └── client.ts                   # EXISTING: Supabase client factories (no changes)
└── email/
    └── templates/
        ├── content-approved.tsx        # EXISTING: Approval email (no changes)
        └── content-rejected.tsx        # EXISTING: Rejection email (no changes)

supabase/
└── migrations/
    ├── YYYYMMDDHHMMSS_create_content_images_bucket.sql  # NEW: Storage bucket + RLS
    └── YYYYMMDDHHMMSS_add_content_cursor_index.sql      # NEW: Pagination index

tests/
├── e2e/
│   └── content-submission-refactor.spec.ts  # NEW: E2E tests for all user stories
├── integration/
│   ├── content-edit.test.ts            # NEW: Agent edit workflow
│   ├── content-moderation.test.ts      # NEW: Admin filtering/pagination
│   └── image-upload.test.ts            # NEW: Image upload flow
└── unit/
    ├── sanitize.test.ts                # MODIFY: Add more XSS test cases
    ├── cursor-pagination.test.ts       # NEW: Cursor encode/decode tests
    └── image-validation.test.ts        # EXISTING: Sharp validation (no changes)
```

**Structure Decision**: This is a **web application** (Next.js App Router monorepo). The feature touches multiple areas:
1. **Dashboard app** (`apps/dashboard/`) - Primary UI and API routes
2. **Validation package** (`packages/validation/`) - Shared schemas
3. **Database** (`supabase/migrations/`) - Schema extensions
4. **Tests** (`tests/`) - Comprehensive test coverage

All changes are additive or refactors - no breaking changes to existing modules.

---

## Complexity Tracking

**No Constitution Violations** - This table is not applicable since no constitution exists.

---

## Phase 0: Research & Technical Decisions ✅ COMPLETE

**Status**: ✅ All research completed
**Output**: `research.md` with 6 technical decisions

### Decisions Made

1. **HTML Sanitization**: Use `isomorphic-dompurify` (already installed)
2. **Image Storage**: Supabase Storage with new `content-images` bucket
3. **Pagination**: Cursor-based with `created_at + id` for scalability
4. **Image Upload**: API Routes + native HTML5 drag-drop (no library)
5. **UI Components**: shadcn/ui + add Pagination, Command, Popover
6. **Content Preview**: `dangerouslySetInnerHTML` with sanitization + prose styles

All decisions extend existing codebase patterns. See [research.md](./research.md) for full details.

---

## Phase 1: Design & Contracts ✅ COMPLETE

**Status**: ✅ All design artifacts created
**Outputs**:
- `data-model.md` - Database schema (existing + 2 new migrations)
- `contracts/api-contracts.md` - 11 REST API endpoints (8 existing, 3 new/modified)
- `quickstart.md` - Developer implementation guide

### Data Model Summary

**No Schema Changes**: Existing `content_submissions` table is well-designed and sufficient.

**New Infrastructure**:
1. Cursor pagination index: `CREATE INDEX idx_content_cursor ON content_submissions(agent_id, created_at DESC, id DESC)`
2. Content images bucket: New Supabase Storage bucket with RLS policies

**Validation Updates**: Add `imageUploadSchema` and `contentImageUrlSchema` to validation package

See [data-model.md](./data-model.md) for complete entity documentation.

### API Contracts Summary

**11 Total Endpoints**:
- **Agent** (5): Create, Update, Get, List, Delete content
- **Admin** (5): List queue (with filters), Get content, Approve, Reject, List agents
- **Shared** (1): Upload image

**Key Features**:
- Cursor-based pagination for lists
- URL param filters (type, agent, date range, search)
- Idempotent approve/reject actions
- Multi-stage image processing (validate, optimize, upload)

See [contracts/api-contracts.md](./contracts/api-contracts.md) for full API specification.

---

## Phase 2: Implementation Workflow

**Input**: All Phase 0-1 artifacts complete
**Output**: Working implementation of all 6 user stories (P1-P6)
**Next Step**: Run `/speckit.tasks` to generate dependency-ordered task list

### Implementation Priority

Based on spec priorities:

1. **P1: Secure Content Rendering** (Critical Security Fix)
   - Apply `sanitizeHtml()` to all content rendering
   - Test with common XSS vectors
   - Verify on both client (preview) and server (review/publish)

2. **P2: Agent Content Editing** (Blocking Workflow Issue)
   - Create edit page route
   - Add PUT endpoint
   - Link from content list
   - Test draft and rejected content editing

3. **P3: Admin Filtering & Pagination** (Scalability Issue)
   - Remove hardcoded stats
   - Build FilterBar component
   - Implement cursor pagination
   - Add Pagination UI component

4. **P4: Agent Image Upload** (Major UX Improvement)
   - Create ImageUpload component
   - Extend upload API route
   - Replace URL input in form
   - Test drag-drop and file picker

5. **P5: Agent Content Preview** (Confidence Builder)
   - Create ContentPreview modal
   - Add Preview button to form
   - Apply prose styles
   - Test formatting accuracy

6. **P6: Consistent Admin Modals** (UI Polish)
   - Replace browser confirm with Dialog
   - Create ApprovalDialog component
   - Update RejectDialog styling
   - Add loading states

### Testing Requirements

**Unit Tests**:
- `lib/sanitize.ts` - XSS injection test cases
- `lib/cursor-pagination.ts` - Encode/decode functions
- `lib/image-processor.ts` - Validation edge cases

**Integration Tests**:
- Content edit workflow (draft → edit → submit → reject → edit → resubmit)
- Admin filtering (type + agent + date + search combined)
- Image upload pipeline (upload → optimize → storage → URL)

**E2E Tests** (Playwright):
- Complete agent workflow (create → upload image → preview → submit)
- Complete admin workflow (filter → review → approve → verify email sent)
- Edit rejected content (view rejection → edit → resubmit → approve)

**Security Tests**:
- XSS injection attempts (script tags, event handlers, data URLs, etc.)
- Malicious file uploads (HTML disguised as image)
- Authorization (agent can't edit others' content, non-admin can't moderate)

### Success Metrics

From spec Success Criteria (SC-001 through SC-012):

- ✅ **SC-001**: Zero XSS vulnerabilities (automated security tests pass)
- ✅ **SC-002**: Agents edit+resubmit in <3 minutes
- ✅ **SC-003**: Admin filters return results in <2s
- ✅ **SC-004**: Admin reviews 10 submissions in <5 minutes
- ✅ **SC-005**: Image upload success rate >95% for <5MB files
- ✅ **SC-006**: Preview reduces rejection rate by 20%
- ✅ **SC-007**: 90% of agents complete first upload without help
- ✅ **SC-008**: Queue loads first page in <1s with 1000+ items
- ✅ **SC-009**: Filters update in <500ms
- ✅ **SC-010**: Zero double-submissions
- ✅ **SC-011**: 100% of HTML preserves legitimate formatting
- ✅ **SC-012**: Agent satisfaction 8+/10

---

## Phase 3: Agent Context Update

After Phase 1 design completion, update agent-specific context files:

```bash
.specify/scripts/bash/update-agent-context.sh claude
```

This updates `CLAUDE.md` with new technologies from this feature (cursor pagination, Supabase Storage bucket).

---

## Component Architecture

### New Components

**Agent Components**:
1. **ImageUpload** (`components/agent/image-upload.tsx`)
   - Props: `onUpload: (url: string) => void`, `initialUrl?: string`
   - Features: Drag-drop, file picker, progress bar, error handling
   - Reuses patterns from `/components/tiptap-node/image-upload-node/`

2. **ContentPreview** (`components/agent/content-preview.tsx`)
   - Props: `content: string`, `title: string`, `isOpen: boolean`, `onClose: () => void`
   - Features: Dialog wrapper, sanitized HTML rendering, prose styles
   - Uses existing `sanitizeHtml()` function

**Admin Components**:
3. **ContentFilterBar** (`components/admin/content-filter-bar.tsx`)
   - Props: `onFilterChange: (filters: ContentFilter) => void`
   - Features: Type Select, Agent Combobox, Date inputs, Search Input
   - Uses shadcn Select, Command, Popover, Input components

4. **ApprovalDialog** (`components/admin/approval-dialog.tsx`)
   - Props: `isOpen: boolean`, `onConfirm: () => void`, `onCancel: () => void`
   - Features: Dialog with confirmation, loading state, error handling
   - Matches style of existing RejectDialog

### Modified Components

**Existing Components to Update**:
1. **ContentForm** (`components/agent/content-form.tsx`)
   - Add: ImageUpload component (replace URL input)
   - Add: Preview button with ContentPreview modal
   - Keep: All existing fields and validation

2. **Content List** (`app/(agent)/content/page.tsx`)
   - Add: "Edit" link for draft/rejected content
   - Add: Routing to `/content/[id]/edit`

3. **Moderation Queue** (`app/(admin)/content-moderation/page.tsx`)
   - Remove: 3 hardcoded stats cards
   - Add: ContentFilterBar component
   - Add: Pagination component
   - Add: URL param state management

4. **Content Review** (`app/(admin)/content-moderation/[id]/page.tsx`)
   - Replace: `window.confirm()` with ApprovalDialog
   - Update: Sanitize HTML before rendering
   - Update: Loading states for both actions

---

## Database Operations

### New Migrations Required

1. **Content Images Bucket** (`YYYYMMDDHHMMSS_create_content_images_bucket.sql`)
   ```sql
   INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
   VALUES ('content-images', 'content-images', true, 5242880,
           ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

   -- RLS policies for agent upload/read/delete, public read
   ```

2. **Cursor Pagination Index** (`YYYYMMDDHHMMSS_add_content_cursor_index.sql`)
   ```sql
   CREATE INDEX idx_content_cursor
   ON content_submissions(agent_id, created_at DESC, id DESC)
   WHERE status != 'deleted';

   CREATE INDEX idx_content_admin_cursor
   ON content_submissions(status, created_at DESC, id DESC)
   WHERE status = 'pending_review';
   ```

### Query Patterns

**Cursor Pagination Query**:
```typescript
const query = supabase
  .from('content_submissions')
  .select('*')
  .eq('agent_id', agentId)
  .order('created_at', { ascending: false })
  .order('id', { ascending: false })
  .limit(limit + 1);

if (cursor) {
  query = query.or(
    `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
  );
}
```

**Admin Queue with Filters**:
```typescript
let query = supabase
  .from('content_submissions')
  .select('*, agents!inner(business_name, subdomain, email)')
  .eq('status', 'pending_review');

if (contentType) query = query.eq('content_type', contentType);
if (agentId) query = query.eq('agent_id', agentId);
if (dateFrom) query = query.gte('created_at', dateFrom);
if (dateTo) query = query.lte('created_at', dateTo);
if (search) query = query.ilike('title', `%${search}%`);
```

---

## Risk Mitigation

### High Risk: XSS Vulnerability

**Mitigation**:
- Apply sanitization on both client and server (defense-in-depth)
- Use automated security tests with OWASP XSS vectors
- Manual penetration testing before deployment
- Code review focusing on all `dangerouslySetInnerHTML` usage

### Medium Risk: Image Upload Abuse

**Mitigation**:
- Strict server-side validation (MIME type + Sharp parsing)
- 5MB size limit enforced at multiple layers
- RLS policies prevent agents accessing others' folders
- Consider rate limiting (future enhancement)

### Medium Risk: Performance Degradation

**Mitigation**:
- Cursor pagination scales to 100k+ items
- Database indexes on query-heavy columns
- Limit filters to essential fields only
- Monitor slow query log in production

### Low Risk: Double-Submission

**Mitigation**:
- Disable buttons during API calls
- Show loading states clearly
- Idempotent approve/reject endpoints

---

## Deployment Checklist

Before deploying to production:

- [ ] Run all migrations on staging database
- [ ] Verify RLS policies with test accounts
- [ ] Test image uploads with various file types/sizes
- [ ] Run full E2E test suite
- [ ] Load test pagination with 1000+ records
- [ ] Verify email templates render correctly
- [ ] Test build queue integration
- [ ] Review all `dangerouslySetInnerHTML` usage
- [ ] Scan dependencies for vulnerabilities (`pnpm audit`)
- [ ] Update CLAUDE.md with new patterns
- [ ] Document any manual migration steps

---

## Next Steps

1. ✅ **Phase 0 Complete**: All technical research finished
2. ✅ **Phase 1 Complete**: All design artifacts created
3. 🔄 **Phase 2 Next**: Run `/speckit.tasks` to generate task list
4. ⏳ **Implementation**: Execute tasks in priority order (P1→P6)
5. ⏳ **Testing**: Comprehensive test coverage for all user stories
6. ⏳ **Deployment**: Production rollout with monitoring

---

## Appendix: File Reference

**Key Files Created by Planning**:
- `specs/003-content-submission-refactor/spec.md` - ✅ Feature specification
- `specs/003-content-submission-refactor/research.md` - ✅ Technical decisions
- `specs/003-content-submission-refactor/data-model.md` - ✅ Database design
- `specs/003-content-submission-refactor/contracts/api-contracts.md` - ✅ API specification
- `specs/003-content-submission-refactor/quickstart.md` - ✅ Developer guide
- `specs/003-content-submission-refactor/plan.md` - ✅ This file

**Next File**:
- `specs/003-content-submission-refactor/tasks.md` - Generated by `/speckit.tasks` command

**Implementation will touch**:
- ~15 existing files (modifications)
- ~10 new files (components, pages, utilities)
- 2 database migrations
- ~8 test files

Total estimated effort: **40-60 hours** (3-5 days for experienced Next.js developer)
