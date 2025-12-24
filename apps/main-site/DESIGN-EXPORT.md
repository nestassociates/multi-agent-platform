# Design System Export

A clean, modern real estate website theme with dark hero sections and light content areas.

---

## Color Palette

### CSS Variables (HSL format)
```css
:root {
  /* Base colors */
  --background: 0 0% 100%;           /* White */
  --foreground: 222.2 84% 4.9%;      /* Near black */

  /* Primary brand color - Teal/Green */
  --primary: 162 47% 35%;            /* #2d8a6e */
  --primary-foreground: 0 0% 100%;   /* White text on primary */

  /* Secondary/Muted */
  --secondary: 210 40% 96.1%;        /* Light gray-blue */
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;

  /* Accent */
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;

  /* UI Elements */
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 162 47% 35%;

  /* Semantic */
  --destructive: 0 84.2% 60.2%;      /* Red */
  --destructive-foreground: 210 40% 98%;
}
```

### Hex Colors
| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#2d8a6e` | Buttons, links, accents |
| Background | `#ffffff` | Page background |
| Foreground | `#0a0f1a` | Primary text |
| Muted | `#f1f5f9` | Secondary backgrounds |
| Muted Text | `#64748b` | Secondary text |
| Border | `#e2e8f0` | Borders, dividers |
| Hero Dark | `#0f172a` to `#1e293b` | Hero gradient |

---

## Typography

### Font Stack
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Scale
| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 3.75rem (60px) | 700 | 1.1 |
| H2 | 1.875rem (30px) | 700 | 1.2 |
| H3 | 1.25rem (20px) | 600 | 1.3 |
| Body | 1rem (16px) | 400 | 1.5 |
| Small | 0.875rem (14px) | 400 | 1.4 |

---

## Spacing System

Based on 4px grid:
- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `2xl`: 48px
- `3xl`: 64px
- `4xl`: 96px

---

## Border Radius

```css
--radius: 0.5rem;  /* 8px - default */
/* Variations: rounded-sm (4px), rounded-md (6px), rounded-lg (8px), rounded-full */
```

---

## Shadows

```css
/* Card shadow */
box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);

/* Elevated shadow */
box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
```

---

## Component Patterns

### Button Variants
```
Primary:    bg-primary text-white hover:bg-primary/90
Secondary:  bg-secondary text-foreground hover:bg-secondary/80
Outline:    border border-input bg-transparent hover:bg-accent
Ghost:      bg-transparent hover:bg-accent
```

### Card Pattern
```
- White background
- 1px border (border color)
- 8px border radius
- Subtle shadow
- Padding: 24px
```

### Input Pattern
```
- Height: 40px (default), 56px (large)
- Border: 1px solid border color
- Border radius: 6px
- Focus: ring-2 ring-primary
- Padding: 12px horizontal
```

---

## Layout

### Container Widths
```css
.container-wide {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 640px) { padding: 0 24px; }
@media (min-width: 1024px) { padding: 0 32px; }
```

### Section Spacing
```css
.section {
  padding: 64px 0;  /* py-16 */
}

@media (min-width: 1024px) {
  padding: 96px 0;  /* lg:py-24 */
}
```

---

## Hero Section Pattern

```
- Full width
- Gradient background: slate-900 to slate-800
- White text
- Centered content
- Max-width: 768px for text
- Search form with tabs (Buy/Rent toggle)
- Subtle grid pattern overlay (10% opacity)
```

---

## Property Card Pattern

```
- Aspect ratio: 4:3 for image
- Image with status badge overlay (top-left)
- Content padding: 16px
- Price: large, bold
- Address: muted text
- Features row: beds, baths, type with icons
- Hover: subtle shadow lift
```

---

## Navigation Pattern

```
Header:
- Sticky top
- Blur backdrop
- Height: 64px
- Logo left, nav center, CTA right
- Dropdown menus on hover
- Mobile: hamburger menu

Footer:
- Dark background (slate-900)
- 4-column grid on desktop
- Logo + description
- Quick links
- Contact info
- Social icons
```

---

## Tailwind Config

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
}
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `globals.css` | CSS variables, base styles |
| `tailwind.config.ts` | Theme configuration |
| `components/ui/button.tsx` | Button component |
| `components/ui/card.tsx` | Card component |
| `components/ui/input.tsx` | Form inputs |
| `components/layout/Header.tsx` | Navigation |
| `components/layout/Footer.tsx` | Footer |
| `components/home/HeroSection.tsx` | Hero with search |
| `components/property/PropertyCard.tsx` | Property listing card |

---

## Design Principles

1. **Clean & Minimal** - Lots of whitespace, simple forms
2. **Trust-building** - Professional typography, consistent spacing
3. **Action-oriented** - Clear CTAs, prominent search
4. **Mobile-first** - Responsive at all breakpoints
5. **Accessible** - Good contrast, focus states, semantic HTML

---

## Component Layouts

### Header Layout

```html
<header class="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
  <nav class="container-wide flex h-16 items-center justify-between">

    <!-- Logo (left) -->
    <a href="/" class="flex items-center space-x-2">
      <svg class="h-6 w-6 text-primary"><!-- Icon --></svg>
      <span class="text-xl font-bold">Brand Name</span>
    </a>

    <!-- Desktop Navigation (center) -->
    <div class="hidden lg:flex lg:items-center lg:space-x-6">
      <!-- Dropdown Item -->
      <div class="relative group">
        <button class="flex items-center space-x-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          <span>Properties</span>
          <svg class="h-4 w-4"><!-- Chevron --></svg>
        </button>
        <!-- Dropdown Menu (show on hover) -->
        <div class="absolute left-0 top-full mt-1 w-48 rounded-md border bg-white p-2 shadow-lg">
          <a href="/buy" class="block rounded-md px-3 py-2 text-sm hover:bg-accent">
            <span class="font-medium">Buy</span>
            <span class="block text-xs text-muted-foreground">Properties for sale</span>
          </a>
          <a href="/rent" class="block rounded-md px-3 py-2 text-sm hover:bg-accent">
            <span class="font-medium">Rent</span>
            <span class="block text-xs text-muted-foreground">Properties to let</span>
          </a>
        </div>
      </div>

      <!-- Simple Link -->
      <a href="/agents" class="text-sm font-medium text-muted-foreground hover:text-foreground">
        Agents
      </a>
    </div>

    <!-- CTA Button (right) -->
    <div class="hidden lg:flex">
      <a href="/contact" class="btn-primary">Get Started</a>
    </div>

    <!-- Mobile Menu Button -->
    <button class="lg:hidden">
      <svg class="h-6 w-6"><!-- Menu icon --></svg>
    </button>

  </nav>
</header>
```

---

### Footer Layout

```html
<footer class="border-t bg-slate-900 text-slate-300">
  <div class="container-wide py-12 lg:py-16">

    <!-- Main Grid: 4 columns on desktop -->
    <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">

      <!-- Column 1: Brand -->
      <div class="space-y-4">
        <a href="/" class="flex items-center space-x-2">
          <svg class="h-6 w-6 text-primary"><!-- Icon --></svg>
          <span class="text-xl font-bold text-white">Brand Name</span>
        </a>
        <p class="text-sm">
          Short brand description goes here. One or two sentences max.
        </p>
        <!-- Social Icons -->
        <div class="flex space-x-4">
          <a href="#" class="hover:text-white"><svg class="h-5 w-5"><!-- Facebook --></svg></a>
          <a href="#" class="hover:text-white"><svg class="h-5 w-5"><!-- Twitter --></svg></a>
          <a href="#" class="hover:text-white"><svg class="h-5 w-5"><!-- Instagram --></svg></a>
          <a href="#" class="hover:text-white"><svg class="h-5 w-5"><!-- LinkedIn --></svg></a>
        </div>
      </div>

      <!-- Column 2: Quick Links -->
      <div>
        <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
          Quick Links
        </h3>
        <ul class="space-y-2 text-sm">
          <li><a href="/buy" class="hover:text-white">Buy Property</a></li>
          <li><a href="/rent" class="hover:text-white">Rent Property</a></li>
          <li><a href="/sell" class="hover:text-white">Sell Property</a></li>
          <li><a href="/agents" class="hover:text-white">Find an Agent</a></li>
        </ul>
      </div>

      <!-- Column 3: Company -->
      <div>
        <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
          Company
        </h3>
        <ul class="space-y-2 text-sm">
          <li><a href="/about" class="hover:text-white">About Us</a></li>
          <li><a href="/journal" class="hover:text-white">Journal</a></li>
          <li><a href="/careers" class="hover:text-white">Careers</a></li>
          <li><a href="/contact" class="hover:text-white">Contact</a></li>
        </ul>
      </div>

      <!-- Column 4: Contact Info -->
      <div>
        <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
          Contact
        </h3>
        <ul class="space-y-2 text-sm">
          <li class="flex items-center space-x-2">
            <svg class="h-4 w-4"><!-- Phone --></svg>
            <span>01onal 123456</span>
          </li>
          <li class="flex items-center space-x-2">
            <svg class="h-4 w-4"><!-- Email --></svg>
            <span>hello@example.com</span>
          </li>
          <li class="flex items-start space-x-2">
            <svg class="h-4 w-4 mt-0.5"><!-- Location --></svg>
            <span>123 Street Name<br/>City, Postcode</span>
          </li>
        </ul>
      </div>

    </div>

    <!-- Bottom Bar -->
    <div class="mt-12 flex flex-col items-center justify-between border-t border-slate-800 pt-8 md:flex-row">
      <p class="text-sm">&copy; 2024 Brand Name. All rights reserved.</p>
      <div class="mt-4 flex space-x-6 text-sm md:mt-0">
        <a href="/privacy" class="hover:text-white">Privacy Policy</a>
        <a href="/terms" class="hover:text-white">Terms of Service</a>
        <a href="/cookies" class="hover:text-white">Cookie Policy</a>
      </div>
    </div>

  </div>
</footer>
```

---

### Hero Section Layout

```html
<section class="relative bg-gradient-to-br from-slate-900 to-slate-800 py-24 text-white lg:py-32">

  <!-- Background Pattern (optional) -->
  <div class="absolute inset-0 opacity-10">
    <div class="absolute inset-0 bg-[url('/grid.svg')] bg-center"></div>
  </div>

  <div class="container-wide relative">
    <div class="mx-auto max-w-3xl text-center">

      <!-- Headline -->
      <h1 class="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
        Find Your Perfect
        <span class="block text-primary">Property</span>
      </h1>

      <!-- Subheadline -->
      <p class="mt-6 text-lg text-slate-300">
        Description text goes here. One or two sentences about the value proposition.
      </p>

      <!-- Search Form -->
      <form class="mt-10">

        <!-- Tab Switcher -->
        <div class="mb-4 inline-flex rounded-lg bg-slate-800 p-1">
          <button type="button" class="rounded-md px-6 py-2 text-sm font-medium bg-primary text-white">
            Buy
          </button>
          <button type="button" class="rounded-md px-6 py-2 text-sm font-medium text-slate-300 hover:text-white">
            Rent
          </button>
        </div>

        <!-- Search Input Row -->
        <div class="flex flex-col gap-3 sm:flex-row">
          <div class="relative flex-1">
            <svg class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground">
              <!-- Search icon -->
            </svg>
            <input
              type="text"
              placeholder="Enter a location or postcode..."
              class="h-14 w-full rounded-md bg-white pl-12 pr-4 text-foreground"
            />
          </div>
          <button type="submit" class="h-14 rounded-md bg-primary px-8 font-medium text-white hover:bg-primary/90">
            Search Properties
          </button>
        </div>

      </form>

      <!-- Quick Links -->
      <div class="mt-8 flex flex-wrap justify-center gap-4 text-sm">
        <a href="/sell" class="text-slate-300 hover:text-white hover:underline">
          Get a Free Valuation
        </a>
        <span class="text-slate-500">|</span>
        <a href="/register" class="text-slate-300 hover:text-white hover:underline">
          Register for Alerts
        </a>
        <span class="text-slate-500">|</span>
        <a href="/agents" class="text-slate-300 hover:text-white hover:underline">
          Find a Local Agent
        </a>
      </div>

    </div>
  </div>
</section>
```

---

### Property Card Layout

```html
<article class="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg">

  <!-- Image Container -->
  <a href="/property/slug" class="relative block aspect-[4/3] overflow-hidden">
    <img
      src="/property-image.jpg"
      alt="Property title"
      class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    />

    <!-- Status Badge (top-left) -->
    <span class="absolute left-3 top-3 rounded-full bg-primary px-2 py-1 text-xs font-medium text-white">
      For Sale
    </span>

    <!-- Price Badge (bottom-right, optional) -->
    <span class="absolute bottom-3 right-3 rounded bg-black/70 px-2 py-1 text-sm font-bold text-white">
      £250,000
    </span>
  </a>

  <!-- Content -->
  <div class="p-4">

    <!-- Price (if not in image) -->
    <p class="text-xl font-bold text-foreground">£250,000</p>

    <!-- Title/Address -->
    <h3 class="mt-1 font-medium text-foreground">
      <a href="/property/slug" class="hover:text-primary">
        3 Bedroom Semi-Detached House
      </a>
    </h3>

    <!-- Location -->
    <p class="mt-1 text-sm text-muted-foreground">
      High Street, Townsville, AB1 2CD
    </p>

    <!-- Features Row -->
    <div class="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
      <span class="flex items-center gap-1">
        <svg class="h-4 w-4"><!-- Bed icon --></svg>
        3 beds
      </span>
      <span class="flex items-center gap-1">
        <svg class="h-4 w-4"><!-- Bath icon --></svg>
        2 baths
      </span>
      <span class="flex items-center gap-1">
        <svg class="h-4 w-4"><!-- Home icon --></svg>
        Semi-Detached
      </span>
    </div>

  </div>
</article>
```

---

### Property Grid Layout

```html
<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
  <!-- Property Card -->
  <!-- Property Card -->
  <!-- Property Card -->
  <!-- ... -->
</div>
```

---

### Property Detail Page Layout

```html
<main>
  <!-- Breadcrumbs -->
  <nav class="border-b">
    <div class="container-wide py-3">
      <ol class="flex items-center space-x-2 text-sm text-muted-foreground">
        <li><a href="/" class="hover:text-foreground">Home</a></li>
        <li>/</li>
        <li><a href="/buy" class="hover:text-foreground">Buy</a></li>
        <li>/</li>
        <li class="text-foreground">Property Title</li>
      </ol>
    </div>
  </nav>

  <div class="container-wide py-8">
    <div class="grid gap-8 lg:grid-cols-3">

      <!-- Main Content (2/3 width) -->
      <div class="lg:col-span-2 space-y-8">

        <!-- Image Gallery -->
        <div class="space-y-4">
          <!-- Main Image -->
          <div class="relative aspect-video overflow-hidden rounded-lg">
            <img src="/main-image.jpg" class="h-full w-full object-cover" />
            <!-- Nav arrows on hover -->
            <button class="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 opacity-0 group-hover:opacity-100">
              <svg class="h-6 w-6"><!-- Left arrow --></svg>
            </button>
            <button class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 opacity-0 group-hover:opacity-100">
              <svg class="h-6 w-6"><!-- Right arrow --></svg>
            </button>
            <!-- Image counter -->
            <span class="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-1 text-sm text-white">
              1 / 12
            </span>
          </div>

          <!-- Thumbnails -->
          <div class="flex gap-2 overflow-x-auto">
            <button class="h-16 w-24 shrink-0 overflow-hidden rounded-md ring-2 ring-primary">
              <img src="/thumb-1.jpg" class="h-full w-full object-cover" />
            </button>
            <button class="h-16 w-24 shrink-0 overflow-hidden rounded-md">
              <img src="/thumb-2.jpg" class="h-full w-full object-cover" />
            </button>
            <!-- More thumbnails... -->
          </div>
        </div>

        <!-- Property Header -->
        <div>
          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-2xl font-bold lg:text-3xl">Property Title Here</h1>
              <p class="mt-1 text-muted-foreground">Full Address, Town, Postcode</p>
            </div>
            <p class="text-2xl font-bold text-primary lg:text-3xl">£250,000</p>
          </div>

          <!-- Key Features -->
          <div class="mt-4 flex flex-wrap gap-4">
            <span class="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
              <svg class="h-4 w-4"><!-- Bed --></svg>
              3 Bedrooms
            </span>
            <span class="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
              <svg class="h-4 w-4"><!-- Bath --></svg>
              2 Bathrooms
            </span>
            <span class="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
              <svg class="h-4 w-4"><!-- Home --></svg>
              Semi-Detached
            </span>
          </div>
        </div>

        <!-- Description -->
        <div>
          <h2 class="text-xl font-semibold">Description</h2>
          <div class="mt-4 prose prose-slate max-w-none">
            <p>Property description paragraphs go here...</p>
          </div>
        </div>

        <!-- Features List -->
        <div>
          <h2 class="text-xl font-semibold">Features</h2>
          <ul class="mt-4 grid gap-2 sm:grid-cols-2">
            <li class="flex items-center gap-2">
              <svg class="h-4 w-4 text-primary"><!-- Check --></svg>
              Feature one
            </li>
            <li class="flex items-center gap-2">
              <svg class="h-4 w-4 text-primary"><!-- Check --></svg>
              Feature two
            </li>
            <!-- More features... -->
          </ul>
        </div>

      </div>

      <!-- Sidebar (1/3 width) -->
      <div class="space-y-6">

        <!-- Agent Card (sticky) -->
        <div class="sticky top-20 rounded-lg border bg-card p-6">
          <div class="flex items-center gap-4">
            <img src="/agent-photo.jpg" class="h-16 w-16 rounded-full object-cover" />
            <div>
              <p class="font-semibold">Agent Name</p>
              <p class="text-sm text-muted-foreground">Company Name</p>
            </div>
          </div>

          <div class="mt-4 space-y-2 text-sm">
            <p class="flex items-center gap-2">
              <svg class="h-4 w-4"><!-- Phone --></svg>
              01onal 123456
            </p>
            <p class="flex items-center gap-2">
              <svg class="h-4 w-4"><!-- Email --></svg>
              agent@example.com
            </p>
          </div>

          <div class="mt-6 space-y-3">
            <button class="w-full rounded-md bg-primary py-3 font-medium text-white hover:bg-primary/90">
              Request Viewing
            </button>
            <button class="w-full rounded-md border py-3 font-medium hover:bg-accent">
              Ask a Question
            </button>
          </div>
        </div>

      </div>

    </div>
  </div>
</main>
```

---

### Property Filters Bar Layout

```html
<div class="rounded-lg border bg-card p-4">
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-6">

    <!-- Location Search (spans 2 cols) -->
    <div class="lg:col-span-2">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground">
          <!-- Search icon -->
        </svg>
        <input
          type="text"
          placeholder="Search location..."
          class="h-10 w-full rounded-md border bg-background pl-9 pr-3"
        />
      </div>
    </div>

    <!-- Price Dropdown -->
    <select class="h-10 rounded-md border bg-background px-3">
      <option>Any Price</option>
      <option>Up to £100,000</option>
      <option>£100,000 - £200,000</option>
      <!-- More options... -->
    </select>

    <!-- Bedrooms Dropdown -->
    <select class="h-10 rounded-md border bg-background px-3">
      <option>Any Beds</option>
      <option>1+</option>
      <option>2+</option>
      <option>3+</option>
      <!-- More options... -->
    </select>

    <!-- Property Type Dropdown -->
    <select class="h-10 rounded-md border bg-background px-3">
      <option>All Types</option>
      <option>House</option>
      <option>Flat</option>
      <option>Bungalow</option>
      <!-- More options... -->
    </select>

    <!-- Sort Dropdown -->
    <select class="h-10 rounded-md border bg-background px-3">
      <option>Newest First</option>
      <option>Price (Low to High)</option>
      <option>Price (High to Low)</option>
    </select>

  </div>
</div>
```

---

### CTA Section Layout

```html
<section class="border-t bg-muted/30 py-16 lg:py-24">
  <div class="container-wide">

    <!-- Section Header -->
    <div class="mb-12 text-center">
      <h2 class="text-3xl font-bold tracking-tight">How Can We Help?</h2>
      <p class="mt-2 text-muted-foreground">
        Supporting text goes here.
      </p>
    </div>

    <!-- 3-Column Grid -->
    <div class="grid gap-8 md:grid-cols-3">

      <!-- CTA Card -->
      <div class="rounded-lg border bg-card p-6 text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <svg class="h-6 w-6 text-primary"><!-- Icon --></svg>
        </div>
        <h3 class="mb-2 text-lg font-semibold">Card Title</h3>
        <p class="mb-4 text-sm text-muted-foreground">
          Card description text goes here.
        </p>
        <a href="/link" class="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
          Call to Action
        </a>
      </div>

      <!-- Repeat for other cards... -->

    </div>
  </div>
</section>
```

---

### Listing Page Structure

```html
<main>
  <!-- Page Header -->
  <div class="border-b bg-muted/30">
    <div class="container-wide py-8">
      <h1 class="text-3xl font-bold">Properties for Sale</h1>
      <p class="mt-2 text-muted-foreground">
        Find your perfect home from our selection of properties.
      </p>
    </div>
  </div>

  <div class="container-wide py-8">

    <!-- Filters -->
    <div class="mb-8">
      <!-- Property Filters Bar (see above) -->
    </div>

    <!-- Results Count -->
    <p class="mb-6 text-sm text-muted-foreground">
      Showing 24 properties
    </p>

    <!-- Property Grid -->
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <!-- Property Cards... -->
    </div>

    <!-- Pagination -->
    <div class="mt-8 flex justify-center">
      <nav class="flex items-center gap-1">
        <button class="rounded-md border px-3 py-2 hover:bg-accent">&larr; Previous</button>
        <button class="rounded-md bg-primary px-3 py-2 text-white">1</button>
        <button class="rounded-md border px-3 py-2 hover:bg-accent">2</button>
        <button class="rounded-md border px-3 py-2 hover:bg-accent">3</button>
        <button class="rounded-md border px-3 py-2 hover:bg-accent">Next &rarr;</button>
      </nav>
    </div>

  </div>
</main>
```
