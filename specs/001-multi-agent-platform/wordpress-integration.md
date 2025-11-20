# WordPress Integration Guide

**Last Updated**: 2025-11-20
**For**: Nest Associates Main Website (nestassociates.co.uk)

This guide shows how to integrate the multi-agent platform's public API with your WordPress website to display agents and properties.

---

## Overview

The platform provides two public REST API endpoints:

1. **GET /api/public/agents** - Fetch all active agents
2. **GET /api/public/properties** - Search properties with filters

These endpoints are:
- ✅ **Public** - No authentication required
- ✅ **CORS-enabled** - Can be called from WordPress
- ✅ **Cached** - 5-minute cache for performance
- ✅ **Read-only** - Safe for public consumption

---

## API Endpoints

### 1. Get All Agents

**Endpoint:** `GET https://multi-agent-platform-eight.vercel.app/api/public/agents`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "John Smith",
    "first_name": "John",
    "last_name": "Smith",
    "email": "john@example.com",
    "phone": "+44 20 1234 5678",
    "bio": "Experienced estate agent specializing in...",
    "subdomain": "john-smith",
    "avatar_url": "https://storage.url/avatar.jpg",
    "qualifications": ["FNAEA", "MARLA"],
    "social_media_links": {
      "LinkedIn": "https://linkedin.com/in/johnsmith",
      "Facebook": "https://facebook.com/johnsmith"
    },
    "territory": "Manchester",
    "microsite_url": "https://john-smith.agents.nestassociates.com"
  }
]
```

**Example Request:**
```javascript
fetch('https://multi-agent-platform-eight.vercel.app/api/public/agents')
  .then(res => res.json())
  .then(agents => console.log(agents));
```

---

### 2. Search Properties

**Endpoint:** `GET https://multi-agent-platform-eight.vercel.app/api/public/properties`

**Query Parameters:**
| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `transaction_type` | string | `sale` or `let` | Filter by sale or rental |
| `min_price` | number | `200000` | Minimum price in GBP |
| `max_price` | number | `500000` | Maximum price in GBP |
| `bedrooms` | number | `3` | Number of bedrooms |
| `postcode` | string | `M1` | Postcode prefix |
| `location` | string | `Manchester` | Town or county name |
| `limit` | number | `50` | Max results (default: 50, max: 100) |

**Example URL:**
```
/api/public/properties?transaction_type=sale&min_price=200000&max_price=500000&bedrooms=3&location=Manchester
```

**Response:**
```json
[
  {
    "id": "uuid",
    "apex27_id": "12345",
    "title": "Beautiful 3-Bedroom Victorian Terrace",
    "slug": "beautiful-3-bedroom-victorian-terrace",
    "description": "Stunning period property...",
    "transaction_type": "sale",
    "price": 350000,
    "bedrooms": 3,
    "bathrooms": 2,
    "status": "available",
    "is_featured": true,
    "featured_image_url": "https://...",
    "address": {
      "line1": "123 High Street",
      "line2": "",
      "town": "Manchester",
      "county": "Greater Manchester",
      "postcode": "M1 1AA"
    },
    "location": {
      "latitude": 53.4808,
      "longitude": -2.2426
    },
    "agent": {
      "id": "uuid",
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "+44 20 1234 5678",
      "subdomain": "john-smith",
      "microsite_url": "https://john-smith.agents.nestassociates.com"
    },
    "property_url": "https://john-smith.agents.nestassociates.com/properties/beautiful-3-bedroom-victorian-terrace",
    "updated_at": "2025-11-20T10:30:00Z"
  }
]
```

**Example Request:**
```javascript
const params = new URLSearchParams({
  transaction_type: 'sale',
  min_price: '200000',
  max_price: '500000',
  bedrooms: '3',
  location: 'Manchester'
});

fetch(`https://multi-agent-platform-eight.vercel.app/api/public/properties?${params}`)
  .then(res => res.json())
  .then(properties => console.log(properties));
```

---

## WordPress Integration Methods

### Method 1: JavaScript Widgets (Recommended)

Add JavaScript widgets to WordPress pages that fetch and display data dynamically.

**Benefits:**
- ✅ Always shows latest data
- ✅ No server-side caching issues
- ✅ Easy to update
- ✅ Works with any WordPress theme

**See separate widget files:**
- `agent-directory-widget.js` - Agent listing widget
- `property-search-widget.js` - Property search widget

---

### Method 2: WordPress Plugin (Advanced)

Create a custom WordPress plugin that:
- Registers custom post types for agents/properties
- Syncs data via cron job
- Provides shortcodes for embedding

**Benefits:**
- ✅ Better SEO (server-rendered content)
- ✅ Offline access
- ✅ WordPress admin integration

**Drawbacks:**
- ❌ More complex to maintain
- ❌ Data can be stale
- ❌ Requires WordPress development

---

### Method 3: Shortcodes (Quick & Easy)

Create simple WordPress shortcodes that inject the JavaScript widgets.

**Example Plugin Code:**
```php
<?php
/*
Plugin Name: Nest Associates Agent Integration
Description: Display agents and properties from multi-agent platform
Version: 1.0.0
*/

// Enqueue widget scripts
function nest_enqueue_scripts() {
    wp_enqueue_script(
        'nest-agents-widget',
        plugins_url('js/agent-directory-widget.js', __FILE__),
        array(),
        '1.0.0',
        true
    );
}
add_action('wp_enqueue_scripts', 'nest_enqueue_scripts');

// Agent directory shortcode
function nest_agent_directory_shortcode($atts) {
    $atts = shortcode_atts(array(
        'limit' => 12,
        'columns' => 3,
    ), $atts);

    return '<div id="nest-agent-directory" data-limit="' . esc_attr($atts['limit']) . '" data-columns="' . esc_attr($atts['columns']) . '"></div>';
}
add_shortcode('nest_agents', 'nest_agent_directory_shortcode');

// Property search shortcode
function nest_property_search_shortcode($atts) {
    $atts = shortcode_atts(array(
        'transaction_type' => '',
        'limit' => 20,
    ), $atts);

    return '<div id="nest-property-search" data-transaction-type="' . esc_attr($atts['transaction_type']) . '" data-limit="' . esc_attr($atts['limit']) . '"></div>';
}
add_shortcode('nest_properties', 'nest_property_search_shortcode');
?>
```

**Usage in WordPress:**
```
[nest_agents limit="12" columns="3"]

[nest_properties transaction_type="sale" limit="20"]
```

---

## Caching Strategy

### API-Side Caching
- **Cache-Control**: `public, s-maxage=300, stale-while-revalidate=600`
- **Cache Duration**: 5 minutes
- **CDN**: Vercel Edge Network caches responses globally
- **Stale-While-Revalidate**: Shows stale data while fetching fresh data (6-10 minutes)

### WordPress-Side Caching
```javascript
// Cache API responses in sessionStorage
const CACHE_KEY = 'nest_agents_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedAgents() {
  const cached = sessionStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_DURATION) {
    sessionStorage.removeItem(CACHE_KEY);
    return null;
  }

  return data;
}

function setCachedAgents(agents) {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({
    data: agents,
    timestamp: Date.now()
  }));
}

// Usage
let agents = getCachedAgents();
if (!agents) {
  agents = await fetch('/api/public/agents').then(r => r.json());
  setCachedAgents(agents);
}
```

---

## Security Considerations

### What's Public vs Private

**✅ Public (Safe to expose):**
- Active agents only
- Published content only
- Available properties only
- Contact information (phone, email)
- Bio and qualifications
- Microsite URLs

**❌ Private (Not exposed):**
- Suspended or archived agents
- Draft or pending content
- Sold or let properties
- Agent passwords or auth tokens
- Admin user information
- Database IDs (UUIDs are safe)
- Apex27 Branch IDs

### Rate Limiting

The API does NOT currently have rate limiting. Consider adding:

```javascript
// WordPress-side rate limiting
const RATE_LIMIT = 10; // Max 10 requests per minute
const RATE_WINDOW = 60 * 1000;

function checkRateLimit() {
  const requests = JSON.parse(sessionStorage.getItem('api_requests') || '[]');
  const now = Date.now();
  const recentRequests = requests.filter(time => now - time < RATE_WINDOW);

  if (recentRequests.length >= RATE_LIMIT) {
    throw new Error('Rate limit exceeded. Please wait a moment.');
  }

  recentRequests.push(now);
  sessionStorage.setItem('api_requests', JSON.stringify(recentRequests));
}
```

---

## Error Handling

### API Errors

```javascript
async function fetchAgents() {
  try {
    const response = await fetch('/api/public/agents');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch agents');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching agents:', error);
    // Show fallback UI
    return [];
  }
}
```

### Network Errors

```javascript
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

## Testing the API

### Test Agents Endpoint

```bash
# Get all agents
curl https://multi-agent-platform-eight.vercel.app/api/public/agents

# Verify CORS headers
curl -I https://multi-agent-platform-eight.vercel.app/api/public/agents

# Verify cache headers
curl -I https://multi-agent-platform-eight.vercel.app/api/public/agents | grep -i cache
```

### Test Properties Endpoint

```bash
# Get all properties
curl https://multi-agent-platform-eight.vercel.app/api/public/properties

# Filter by sale type
curl 'https://multi-agent-platform-eight.vercel.app/api/public/properties?transaction_type=sale'

# Filter by price range
curl 'https://multi-agent-platform-eight.vercel.app/api/public/properties?min_price=200000&max_price=500000'

# Filter by bedrooms
curl 'https://multi-agent-platform-eight.vercel.app/api/public/properties?bedrooms=3'

# Combine filters
curl 'https://multi-agent-platform-eight.vercel.app/api/public/properties?transaction_type=sale&bedrooms=3&location=Manchester'
```

---

## WordPress Page Templates

### "Find an Agent" Page Template

```php
<?php
/**
 * Template Name: Find an Agent
 */
get_header();
?>

<div class="agent-directory-page">
    <h1>Find Your Estate Agent</h1>
    <p>Connect with one of our experienced estate agents</p>

    <!-- Agent directory will be rendered here by JavaScript -->
    <div id="nest-agent-directory"></div>
</div>

<script src="<?php echo get_template_directory_uri(); ?>/js/agent-directory-widget.js"></script>
<script>
    // Initialize widget when page loads
    document.addEventListener('DOMContentLoaded', function() {
        window.NestAgentDirectory.init('#nest-agent-directory', {
            apiUrl: 'https://multi-agent-platform-eight.vercel.app/api/public/agents',
            columns: 3,
            showBio: true,
            showPhone: true,
            showEmail: false
        });
    });
</script>

<?php get_footer(); ?>
```

### "Property Search" Page Template

```php
<?php
/**
 * Template Name: Property Search
 */
get_header();
?>

<div class="property-search-page">
    <h1>Search Properties</h1>
    <p>Find your perfect property across our network</p>

    <!-- Search form and results will be rendered here -->
    <div id="nest-property-search"></div>
</div>

<script src="<?php echo get_template_directory_uri(); ?>/js/property-search-widget.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', function() {
        window.NestPropertySearch.init('#nest-property-search', {
            apiUrl: 'https://multi-agent-platform-eight.vercel.app/api/public/properties',
            defaultTransactionType: 'sale',
            showFilters: true,
            resultsPerPage: 12
        });
    });
</script>

<?php get_footer(); ?>
```

---

## Performance Optimization

### 1. Lazy Loading Images

```javascript
// Use Intersection Observer for lazy loading
const observerOptions = {
  root: null,
  rootMargin: '50px',
  threshold: 0.1
};

const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      imageObserver.unobserve(img);
    }
  });
}, observerOptions);

// Apply to images
document.querySelectorAll('img[data-src]').forEach(img => {
  imageObserver.observe(img);
});
```

### 2. Pagination for Large Results

```javascript
// Implement infinite scroll or pagination
function loadMoreProperties(page = 1) {
  const limit = 20;
  fetch(`/api/public/properties?limit=${limit}&page=${page}`)
    .then(res => res.json())
    .then(properties => {
      appendPropertiesToDOM(properties);
      if (properties.length === limit) {
        // More properties available, show "Load More" button
      }
    });
}
```

### 3. Debounced Search

```javascript
// Debounce search input to reduce API calls
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const searchInput = document.querySelector('#property-search');
searchInput.addEventListener('input', debounce(function(e) {
  searchProperties(e.target.value);
}, 500));
```

---

## SEO Considerations

### Server-Side Rendering (Optional)

For better SEO, consider server-side rendering the agent directory:

```php
<?php
function nest_render_agents_ssr() {
    $api_url = 'https://multi-agent-platform-eight.vercel.app/api/public/agents';
    $response = wp_remote_get($api_url);

    if (is_wp_error($response)) {
        return '<p>Unable to load agents</p>';
    }

    $agents = json_decode(wp_remote_retrieve_body($response), true);

    ob_start();
    foreach ($agents as $agent) {
        ?>
        <div class="agent-card">
            <img src="<?php echo esc_url($agent['avatar_url']); ?>" alt="<?php echo esc_attr($agent['name']); ?>">
            <h3><?php echo esc_html($agent['name']); ?></h3>
            <p><?php echo esc_html($agent['bio']); ?></p>
            <a href="<?php echo esc_url($agent['microsite_url']); ?>">View Profile</a>
        </div>
        <?php
    }
    return ob_get_clean();
}

// Use in template: echo nest_render_agents_ssr();
```

### Meta Tags for Property Pages

```php
<!-- Add structured data for properties -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": "<?php echo $property['title']; ?>",
  "price": "<?php echo $property['price']; ?>",
  "priceCurrency": "GBP",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "<?php echo $property['address']['town']; ?>",
    "addressRegion": "<?php echo $property['address']['county']; ?>",
    "postalCode": "<?php echo $property['address']['postcode']; ?>"
  },
  "numberOfBedrooms": "<?php echo $property['bedrooms']; ?>",
  "numberOfBathroomsTotal": "<?php echo $property['bathrooms']; ?>"
}
</script>
```

---

## Common Use Cases

### Use Case 1: Homepage Agent Carousel

```html
<!-- In your homepage template -->
<section class="our-agents">
    <h2>Meet Our Agents</h2>
    <div id="agent-carousel"></div>
</section>

<script>
fetch('/api/public/agents')
    .then(res => res.json())
    .then(agents => {
        const carousel = document.getElementById('agent-carousel');
        agents.slice(0, 6).forEach(agent => {
            carousel.innerHTML += `
                <div class="agent-slide">
                    <img src="${agent.avatar_url}" alt="${agent.name}">
                    <h3>${agent.name}</h3>
                    <p>${agent.territory}</p>
                    <a href="${agent.microsite_url}">View Profile</a>
                </div>
            `;
        });
    });
</script>
```

### Use Case 2: Location-Based Agent Finder

```html
<section class="agent-finder">
    <h2>Find an Agent in Your Area</h2>
    <select id="location-filter">
        <option value="">All Locations</option>
        <!-- Populated dynamically from agent territories -->
    </select>
    <div id="filtered-agents"></div>
</section>

<script>
let allAgents = [];

fetch('/api/public/agents')
    .then(res => res.json())
    .then(agents => {
        allAgents = agents;

        // Populate location filter
        const locations = [...new Set(agents.map(a => a.territory).filter(Boolean))];
        const select = document.getElementById('location-filter');
        locations.forEach(loc => {
            select.innerHTML += `<option value="${loc}">${loc}</option>`;
        });

        // Show all agents initially
        displayAgents(agents);
    });

document.getElementById('location-filter').addEventListener('change', (e) => {
    const location = e.target.value;
    const filtered = location
        ? allAgents.filter(a => a.territory === location)
        : allAgents;
    displayAgents(filtered);
});

function displayAgents(agents) {
    const container = document.getElementById('filtered-agents');
    container.innerHTML = agents.map(agent => `
        <div class="agent-card">
            <img src="${agent.avatar_url}" alt="${agent.name}">
            <h3>${agent.name}</h3>
            <p>${agent.territory}</p>
            <a href="${agent.microsite_url}">View Profile</a>
        </div>
    `).join('');
}
</script>
```

### Use Case 3: Featured Properties Widget

```html
<section class="featured-properties">
    <h2>Featured Properties</h2>
    <div id="featured-properties"></div>
</section>

<script>
fetch('/api/public/properties?is_featured=true&limit=6')
    .then(res => res.json())
    .then(properties => {
        const container = document.getElementById('featured-properties');
        properties.forEach(property => {
            container.innerHTML += `
                <div class="property-card">
                    <img src="${property.featured_image_url}" alt="${property.title}">
                    <h3>${property.title}</h3>
                    <p class="price">£${property.price.toLocaleString()}</p>
                    <p>${property.bedrooms} bed • ${property.transaction_type}</p>
                    <p class="agent">Listed by ${property.agent.name}</p>
                    <a href="${property.property_url}">View Details</a>
                </div>
            `;
        });
    });
</script>
```

---

## Troubleshooting

### CORS Errors

If you see CORS errors in browser console:

**Error:**
```
Access to fetch at 'https://...' from origin 'https://nestassociates.co.uk'
has been blocked by CORS policy
```

**Solution:**
The API already has `Access-Control-Allow-Origin: *` set. If you still see errors:
1. Check browser console for specific error
2. Verify you're making GET requests (not POST)
3. Clear browser cache

### Cache Not Working

If data seems stale:

**Check cache headers:**
```bash
curl -I https://multi-agent-platform-eight.vercel.app/api/public/agents | grep -i cache
# Should show: Cache-Control: public, s-maxage=300, stale-while-revalidate=600
```

**Force fresh data:**
```javascript
fetch('/api/public/agents', { cache: 'no-store' })
```

### Empty Results

If API returns empty arrays:

**Check:**
1. Are there active agents in the database?
2. Are agents marked as `status: 'active'`?
3. For properties: Are they marked as `status: 'available'`?

**Test directly:**
```bash
curl https://multi-agent-platform-eight.vercel.app/api/public/agents | jq .
```

---

## Next Steps

1. **Test the APIs** - Use curl or Postman to verify responses
2. **Install widgets** - Add JavaScript widgets to WordPress theme
3. **Create pages** - Build "Find an Agent" and "Property Search" pages
4. **Style with CSS** - Match Nest Associates branding
5. **Test on staging** - Verify before pushing to production
6. **Monitor usage** - Track API calls in Vercel analytics

---

## Support

**API Base URL:** `https://multi-agent-platform-eight.vercel.app`

**Endpoints:**
- `/api/public/agents` - Get all active agents
- `/api/public/properties` - Search properties with filters

**Questions?** Check the JavaScript widget files for working examples.
