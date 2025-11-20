# Design Requirements for Phase 9: Global Content Management

**Date**: 2025-11-20
**For**: Designer / Business Owner
**From**: Development Team
**Purpose**: Define requirements for global template system before technical implementation

---

## Executive Summary

Before we can build the global content management system (Phase 9), we need clear specifications for what content will be managed globally across all 1,000+ agent microsites.

**What we're building**: A system that lets admins edit header, footer, and shared content in one place, then deploy those changes to all agent websites simultaneously.

**What we need from you**: Detailed specifications for what those global templates contain, how they should look, and what should be editable.

---

## Background: What is Global Content?

Global content is website elements that appear on EVERY agent's microsite:

- **Header**: Top navigation bar (logo, menu, contact info)
- **Footer**: Bottom section (company info, links, legal, social media)
- **Shared Blocks**: Reusable content sections (company description, service areas, disclaimers)

**Why it matters**: With 1,000 agents, we can't manually update each site. Global content lets us update all sites with one publish action.

---

## What We Need: 3 Core Documents

### 1. Agent Microsite Design Mockups (Required)

**What we need:**
- Visual mockups/wireframes of agent microsite pages
- At minimum: Homepage, About, Properties, Blog, Contact
- Desktop AND mobile views

**Formats accepted:**
- Figma file (preferred)
- Adobe XD
- Sketch
- PNG/PDF mockups
- Reference website URL ("make it look like this")

**What to show:**
- Header section (top of every page)
- Footer section (bottom of every page)
- Navigation menu structure
- Color scheme / branding
- Typography (fonts, sizes)
- Button styles
- Card layouts for properties/blog posts

**Questions to answer:**
- Is the header sticky/fixed or scrolls away?
- Does the navigation have dropdown menus?
- Is there a mobile hamburger menu?
- Are there multiple header variations (logged in vs logged out)?

---

### 2. Global Content Structure Specification (Required)

**For each global template (Header, Footer), specify:**

#### Header Template

**Fixed Elements** (not editable by admin):
- [ ] Logo (company logo, always the same)
- [ ] Navigation structure (same menu on all sites)
- [ ] Layout/styling (consistent design)

**Editable Elements** (admin can change via dashboard):
- [ ] Company phone number
- [ ] Company email
- [ ] Office address
- [ ] Social media links (Facebook, Twitter, LinkedIn, Instagram)
- [ ] CTA button text and link
- [ ] Navigation menu items (add/remove/reorder)
- [ ] Emergency notice banner (e.g., "Office closed for holiday")

**Example Specification:**
```
Header Contains:
├─ Logo (Fixed: Nest Associates brand logo)
├─ Main Navigation (Editable: up to 6 menu items)
│  ├─ Home
│  ├─ Properties
│  ├─ About
│  ├─ Blog
│  ├─ Areas
│  └─ Contact
├─ Contact Info (Editable)
│  ├─ Phone: +44 20 XXXX XXXX
│  └─ Email: info@nestassociates.co.uk
└─ CTA Button (Editable: text + link)
   └─ "Book Valuation" → /contact
```

#### Footer Template

**What content goes in the footer?**

Options to specify:
- [ ] Company information (name, registration number, address)
- [ ] Contact details (phone, email, office hours)
- [ ] Quick links (About, Services, Privacy Policy, Terms)
- [ ] Social media icons with links
- [ ] Copyright text
- [ ] Regulatory information (ICO registration, redress scheme)
- [ ] Newsletter signup form
- [ ] Awards/accreditations logos

**Example Specification:**
```
Footer Contains:
├─ Column 1: About Nest Associates
│  ├─ Company description (editable)
│  └─ Logo
├─ Column 2: Quick Links (editable links)
│  ├─ About Us
│  ├─ Our Services
│  ├─ Contact
│  ├─ Privacy Policy
│  └─ Terms & Conditions
├─ Column 3: Contact (editable)
│  ├─ Office address
│  ├─ Phone number
│  ├─ Email address
│  └─ Office hours
├─ Column 4: Social Media (editable links)
│  ├─ Facebook
│  ├─ Twitter
│  ├─ LinkedIn
│  └─ Instagram
└─ Bottom Bar:
   ├─ Copyright text (editable)
   ├─ Regulatory info (editable)
   └─ Awards logos (uploadable images)
```

---

### 3. Content Field Definitions (Required)

For each editable field, specify:

**Field Name** | **Type** | **Max Length** | **Required?** | **Default Value** | **Validation Rules**
---|---|---|---|---|---
Company Phone | Text | 20 chars | Yes | "+44 20 XXXX XXXX" | UK phone format
Company Email | Email | 100 chars | Yes | "info@nest.co.uk" | Valid email
Office Address | Textarea | 500 chars | Yes | "123 High St..." | -
Facebook URL | URL | 200 chars | No | - | Valid URL
Twitter URL | URL | 200 chars | No | - | Valid URL
LinkedIn URL | URL | 200 chars | No | - | Valid URL
Instagram URL | URL | 200 chars | No | - | Valid URL
CTA Button Text | Text | 30 chars | Yes | "Book Valuation" | -
CTA Button Link | URL | 200 chars | Yes | "/contact" | Relative or absolute URL
Footer Description | Textarea | 1000 chars | No | - | Plain text or HTML?
Copyright Text | Text | 200 chars | Yes | "© 2025 Nest..." | -

---

## Additional Questions to Answer

### Content Format

**Q1: Should content be rich text (HTML) or plain text?**
- Plain text: Simpler, safer, consistent formatting
- Rich text: More flexibility, can add bold/italic/links
- Structured: Specific fields only (phone, email, etc.)

**Q2: Should we use a rich text editor (like TipTap) for bio/description fields?**
- Yes: Agents can add formatting, lists, links
- No: Keep it simple plain text

### Template System

**Q3: How are templates applied to agent sites?**
- Option A: Global content is injected into Astro layout files
- Option B: Global content overrides Astro components
- Option C: Global content is fetched at build time

**Q4: Can agents override global content?**
- Yes: Agents can customize header/footer (advanced)
- No: All agents have identical header/footer (recommended for brand consistency)

### Preview Functionality

**Q5: What should preview show?**
- Option A: Just the header/footer in isolation
- Option B: Full sample page with header + footer + dummy content
- Option C: Overlay on actual agent site (iframe)

**Q6: Should preview be:**
- Static screenshot
- Interactive live preview
- Side-by-side before/after comparison

### Batch Rebuild

**Q7: When should batch rebuilds happen?**
- Immediately when published
- Scheduled (overnight to avoid peak hours)
- Manual trigger only

**Q8: What if a build fails during batch rebuild?**
- Stop all rebuilds
- Continue but log failures
- Retry failed ones later

---

## Visual Examples Needed

Please provide examples for:

### 1. Header Design
- [ ] Screenshot of desired header
- [ ] Annotated mockup showing editable vs fixed elements
- [ ] Mobile header design
- [ ] Sticky/fixed header behavior

### 2. Footer Design
- [ ] Screenshot of desired footer
- [ ] Column layout specification
- [ ] Mobile footer (stacked? accordion?)
- [ ] Links structure

### 3. Brand Assets
- [ ] Company logo (SVG preferred, PNG acceptable)
- [ ] Favicon
- [ ] Social media icons (if custom)
- [ ] Awards/accreditation logos

### 4. Sample Content
- [ ] Example company description (200 words)
- [ ] Example footer legal text
- [ ] Example navigation menu items
- [ ] Example social media links

---

## Reference Materials

**If you have existing websites, please provide:**
- [ ] URL of current Nest Associates website (we'll reference the design)
- [ ] URL of any competitor sites you like
- [ ] Brand guidelines document (colors, fonts, voice)
- [ ] Content style guide

**If starting from scratch:**
- [ ] Preferred color palette (primary, secondary, accent colors)
- [ ] Font preferences (serif, sans-serif, specific fonts)
- [ ] Design inspiration (3-5 website URLs you like)

---

## Database Schema (For Reference)

We already have a `global_content` table with these columns:

```sql
- id (UUID)
- content_type (TEXT) ← e.g., 'header', 'footer', 'company_info'
- content_body (TEXT) ← The actual content (JSON or HTML)
- version (INTEGER) ← For version control
- is_published (BOOLEAN) ← Draft vs published
- published_at (TIMESTAMP)
- created_by_user_id (UUID)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**This means we can store anything**, but we need YOU to define WHAT to store.

---

## Deliverables Needed From You

### Priority 1: Must Have (Blocks Phase 9)
1. ✅ **Header structure specification** - What goes in the header?
2. ✅ **Footer structure specification** - What goes in the footer?
3. ✅ **List of editable fields** - What can admins change?
4. ✅ **Visual mockup or reference URL** - What should it look like?

### Priority 2: Should Have (Improves Phase 9)
5. ⚡ **Content examples** - Sample text for all fields
6. ⚡ **Brand guidelines** - Colors, fonts, logo files
7. ⚡ **Mobile design** - How does it look on mobile?

### Priority 3: Nice to Have (Can decide later)
8. 💡 **Preview preference** - How should preview work?
9. 💡 **Batch rebuild timing** - When should mass updates happen?
10. 💡 **Agent customization** - Can agents customize anything?

---

## Timeline Impact

**If we have design specs:**
- Phase 9 implementation: 5-7 days
- Everything defined, just coding

**If we DON'T have design specs:**
- We build generic system: 3-4 days
- You provide designs: 1 day review
- We rebuild to match: 3-4 days
- **Total: 7-9 days + rework risk**

**Recommendation**: Provide specs BEFORE we build (saves time and rework)

---

## Simple Option: Start With Minimal Template

If design isn't ready but you want to move forward, we could build a **minimal viable template system**:

### Header (Minimal)
```
┌─────────────────────────────────────────────────────┐
│ [Logo]  Home | Properties | Blog | Contact  [Phone] │
└─────────────────────────────────────────────────────┘
```

**Editable Fields:**
- Company phone number
- Navigation menu items (JSON array)

### Footer (Minimal)
```
┌─────────────────────────────────────────────────────┐
│  © 2025 Nest Associates | Privacy | Terms           │
│  📞 Phone | ✉️ Email | 📍 Address                    │
└─────────────────────────────────────────────────────┘
```

**Editable Fields:**
- Company phone, email, address
- Copyright text
- Legal links

**Pros**: Gets Phase 9 done quickly
**Cons**: Might not match your vision, requires rework later

---

## Action Items

**For Designer/Business Owner:**

Please review this document and provide:

1. **Immediate** (this week):
   - [ ] Header structure specification OR reference website URL
   - [ ] Footer structure specification OR reference website URL
   - [ ] Decision: Build minimal now or wait for full design?

2. **Soon** (next 2 weeks):
   - [ ] Visual mockups (Figma/PNG)
   - [ ] Content examples for all fields
   - [ ] Brand assets (logo, colors, fonts)

3. **Eventually** (before launch):
   - [ ] Complete agent site design (all pages)
   - [ ] Mobile responsive designs
   - [ ] Accessibility requirements

---

## Questions?

**Contact Development Team:**
- Review this document
- Mark what you CAN provide now
- Indicate what needs more time
- Share any existing materials

**We can work with whatever you have** - even a rough sketch or "make it look like [website URL]" helps!

---

## Next Steps

**Option 1: Wait for Design** (Recommended)
- Developer proceeds with Phase 13 (Production Hardening)
- Designer provides specs for Phase 9
- We implement Phase 9 when design is ready

**Option 2: Build Minimal Now**
- Developer builds basic header/footer system
- Designer refines later
- Risk: Rework required when design changes

**Option 3: Reference Design**
- Provide URL: "Make it look like this website"
- Developer copies structure and styling
- Faster than waiting for mockups

**Which option would you prefer?**

---

**Please review and respond with:**
✅ What you CAN provide now
⏳ What you NEED time to design
🤔 Questions or clarifications

This helps us build exactly what you need without costly rework!
