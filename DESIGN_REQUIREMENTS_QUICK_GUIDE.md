# Quick Guide: What We Need for Global Templates

**TL;DR**: Before building Phase 9, we need you to define what goes in the header and footer of agent websites.

---

## The Simple Questions

### Header (Top of Every Page)

**What we need to know:**

1. **What's in the header?** Check all that apply:
   - [ ] Company logo
   - [ ] Navigation menu (Home, Properties, Blog, etc.)
   - [ ] Phone number
   - [ ] Email address
   - [ ] Search bar
   - [ ] Login button
   - [ ] Call-to-action button (e.g., "Book Valuation")
   - [ ] Social media icons
   - [ ] Other: _______________

2. **What should be EDITABLE?** (Admin can change via dashboard)
   - [ ] Phone number
   - [ ] Email address
   - [ ] Menu items (add/remove/reorder)
   - [ ] CTA button text
   - [ ] CTA button link
   - [ ] Social media links
   - [ ] Emergency banner (e.g., "Office closed Dec 25-26")
   - [ ] Other: _______________

3. **What should be FIXED?** (Same on all sites, can't change)
   - [ ] Logo (always Nest Associates logo)
   - [ ] Brand colors
   - [ ] Layout/positioning
   - [ ] Other: _______________

---

### Footer (Bottom of Every Page)

**What we need to know:**

1. **What's in the footer?** Check all that apply:
   - [ ] Company description/about text
   - [ ] Office address
   - [ ] Phone number
   - [ ] Email address
   - [ ] Office hours
   - [ ] Quick links (About, Services, Contact, etc.)
   - [ ] Social media icons with links
   - [ ] Copyright text
   - [ ] Legal links (Privacy Policy, Terms, Cookies)
   - [ ] Regulatory info (ICO, Property Ombudsman, etc.)
   - [ ] Awards/accreditations
   - [ ] Newsletter signup form
   - [ ] Site map links
   - [ ] Other: _______________

2. **How is it laid out?**
   - [ ] 4 columns (typical: About | Links | Contact | Social)
   - [ ] 3 columns
   - [ ] 2 columns
   - [ ] Single column (mobile-style)
   - [ ] Not sure (show me examples)

3. **What should be EDITABLE?**
   - [ ] Company description
   - [ ] Office address
   - [ ] Phone/email
   - [ ] Office hours
   - [ ] Quick links (add/remove/reorder)
   - [ ] Social media URLs
   - [ ] Copyright text
   - [ ] Regulatory text
   - [ ] Other: _______________

---

## The Easiest Way to Answer This

### Option 1: Reference Website (Fastest ⚡)

**Just give us a URL:**
"Make it look like: https://example-estate-agent.co.uk"

We'll copy the structure and make fields editable as needed.

### Option 2: Annotated Screenshot (Quick 📸)

Take a screenshot of a website you like, open it in any tool (PowerPoint, Paint, whatever), and draw boxes around sections with notes:

```
┌─────────────────────────────────────────┐
│ [LOGO]  Home | Properties | Blog  ☎️    │ ← THIS IS THE HEADER
│         ↑ These menu items should       │
│           be editable                    │
└─────────────────────────────────────────┘

... page content ...

┌─────────────────────────────────────────┐
│  About Us    |  Quick Links  |  Contact │ ← THIS IS THE FOOTER
│  Blah blah   |  - Services   |  Address │   (3 columns)
│  Company     |  - Privacy    |  Phone   │
│  info here   |  - Terms      |  Email   │
│              |               |          │
│  © 2025 Nest Associates Ltd             │
└─────────────────────────────────────────┘
```

### Option 3: Fill Out This Template (Copy/Paste ✍️)

```markdown
HEADER:
- Logo: [Nest Associates logo - I'll send PNG/SVG]
- Navigation: Home, Properties, About, Blog, Contact, Areas
- Right side: Phone number (editable) + "Book Valuation" button (editable)
- Mobile: Hamburger menu

FOOTER:
- Column 1: Company description (200 words, editable)
- Column 2: Quick links - About, Services, Contact, Privacy, Terms (editable)
- Column 3: Office address (editable), Phone (editable), Email (editable)
- Column 4: Social icons - Facebook, Twitter, LinkedIn, Instagram (URLs editable)
- Bottom: Copyright text (editable)
```

---

## What Happens Next?

**Once you provide this info:**

1. **Week 1**: We build the global content management UI
   - Admin dashboard page for editing templates
   - Preview functionality
   - Publish with batch rebuild

2. **Week 1-2**: We integrate with Astro agent sites
   - Header/footer components consume global content
   - Agent sites rebuild with new templates
   - All 1,000 sites can be updated with one click

3. **Testing**: You can test updating header/footer and see changes across all sites

**Timeline:**
- With clear specs: 5-7 days
- Without specs: Build generic, then rework = 10+ days

---

## Can't Provide Design Yet?

**No problem!** We'll work on Phase 13 (Production Readiness) instead:
- Security hardening
- Performance optimization
- Error monitoring
- Essential production prep

**This doesn't require design** and gets you ready for 16-agent launch.

When designs are ready, we'll circle back to Phase 9.

---

## Summary: What We Need

**Minimum to proceed:**
- [ ] Header content specification
- [ ] Footer content specification
- [ ] List of editable fields

**Ideal to proceed:**
- [ ] Visual mockup or reference URL
- [ ] Sample content for all fields
- [ ] Brand assets (logo, colors)

**Can provide this by:** _______________ (date)

---

**Questions? Feedback?**

Reply to this document with:
- What you CAN provide and WHEN
- What you NEED more time for
- Reference URLs to websites you like
- Any questions or concerns

**We're flexible** - we can work with whatever you have! Even a rough "make it like this site" helps tremendously.
