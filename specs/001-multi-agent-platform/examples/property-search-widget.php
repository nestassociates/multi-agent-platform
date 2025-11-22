<?php
/**
 * Nest Associates Property Search Widget
 *
 * Displays property search with filters
 *
 * Usage: [nest_property_search transaction_type="sale"]
 */

function nest_property_search_shortcode($atts) {
    $atts = shortcode_atts(array(
        'transaction_type' => 'sale', // 'sale' or 'let'
        'limit' => 12,
    ), $atts);

    // Generate unique widget ID
    $widget_id = 'nest-search-' . uniqid();

    ob_start();
    ?>

    <div class="nest-property-search" id="<?php echo esc_attr($widget_id); ?>">
        <!-- Search Form -->
        <form class="search-form">
            <div class="search-filters">
                <div class="filter-group">
                    <label>Transaction Type</label>
                    <select name="transaction_type" class="form-control">
                        <option value="sale" <?php selected($atts['transaction_type'], 'sale'); ?>>For Sale</option>
                        <option value="let" <?php selected($atts['transaction_type'], 'let'); ?>>To Let</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label>Min Price</label>
                    <input type="number" name="min_price" class="form-control" placeholder="£0">
                </div>

                <div class="filter-group">
                    <label>Max Price</label>
                    <input type="number" name="max_price" class="form-control" placeholder="No max">
                </div>

                <div class="filter-group">
                    <label>Bedrooms</label>
                    <select name="bedrooms" class="form-control">
                        <option value="">Any</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                        <option value="5">5+</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label>Location</label>
                    <input type="text" name="location" class="form-control" placeholder="e.g. Taunton">
                </div>

                <button type="submit" class="search-button">Search Properties</button>
            </div>
        </form>

        <!-- Loading State -->
        <div class="loading" style="display: none;">
            <p>Searching properties...</p>
        </div>

        <!-- Results Container -->
        <div class="search-results"></div>
    </div>

    <style>
    .nest-property-search {
        padding: 2rem 0;
    }

    .search-filters {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: #f9fafb;
        border-radius: 8px;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
    }

    .filter-group label {
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
        color: #374151;
    }

    .form-control {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 0.875rem;
    }

    .search-button {
        grid-column: 1 / -1;
        background: #3b82f6;
        color: white;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
    }

    .search-button:hover {
        background: #2563eb;
    }

    .search-results {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 2rem;
    }

    .property-card {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        background: white;
        transition: box-shadow 0.2s;
    }

    .property-card:hover {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .property-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
        background: #f3f4f6;
    }

    .property-content {
        padding: 1.5rem;
    }

    .property-price {
        font-size: 1.5rem;
        font-weight: bold;
        color: #3b82f6;
        margin-bottom: 0.5rem;
    }

    .property-title {
        font-size: 1.125rem;
        margin: 0.5rem 0;
    }

    .property-details {
        display: flex;
        gap: 1rem;
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0.5rem 0;
    }

    .property-location {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0.5rem 0;
    }

    .property-agent {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
        font-size: 0.875rem;
    }

    .property-link {
        display: inline-block;
        color: #3b82f6;
        text-decoration: none;
        margin-top: 0.5rem;
        font-weight: 500;
    }

    .loading {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
    }
    </style>

    <script>
    (function() {
        const widgetId = '<?php echo $widget_id; ?>';
        const widget = document.getElementById(widgetId);
        const form = widget.querySelector('.search-form');
        const results = widget.querySelector('.search-results');
        const loading = widget.querySelector('.loading');
        const API_URL = '<?php echo esc_url($api_url); ?>';

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Show loading
            loading.style.display = 'block';
            results.innerHTML = '';

            // Build query string from form
            const formData = new FormData(form);
            const params = new URLSearchParams();

            for (const [key, value] of formData.entries()) {
                if (value) params.append(key, value);
            }
            params.append('limit', '<?php echo esc_js($atts['limit']); ?>');

            try {
                const response = await fetch(`https://dashboard.nestassociates.com/api/public/properties?${params}`);
                const data = await response.json();

                loading.style.display = 'none';

                if (!data.properties || data.properties.length === 0) {
                    results.innerHTML = '<p style="text-align: center; padding: 2rem; color: #6b7280;">No properties found. Try adjusting your filters.</p>';
                    return;
                }

                // Render properties
                results.innerHTML = data.properties.map(property => `
                    <div class="property-card">
                        ${property.featured_image_url ? `
                            <img src="${property.featured_image_url}"
                                 alt="${escapeHtml(property.title)}"
                                 class="property-image">
                        ` : '<div class="property-image"></div>'}

                        <div class="property-content">
                            <div class="property-price">£${property.price.toLocaleString()}</div>
                            <h3 class="property-title">${escapeHtml(property.title)}</h3>

                            <div class="property-details">
                                ${property.bedrooms ? `<span>🛏️ ${property.bedrooms} beds</span>` : ''}
                                ${property.bathrooms ? `<span>🚿 ${property.bathrooms} baths</span>` : ''}
                            </div>

                            <div class="property-location">
                                📍 ${escapeHtml(property.town || '')}${property.postcode ? `, ${property.postcode}` : ''}
                            </div>

                            <div class="property-agent">
                                <strong>Agent:</strong> ${escapeHtml(property.agent.name)}<br>
                                <a href="tel:${property.agent.phone}">${property.agent.phone}</a>
                            </div>

                            <a href="${property.property_url}"
                               class="property-link"
                               target="_blank">
                                View Details →
                            </a>
                        </div>
                    </div>
                `).join('');

            } catch (error) {
                loading.style.display = 'none';
                results.innerHTML = '<p style="color: red;">Error loading properties. Please try again.</p>';
                console.error('Property search error:', error);
            }
        });

        // Helper to escape HTML
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Trigger initial search on load
        form.dispatchEvent(new Event('submit'));
    })();
    </script>

    <?php
    return ob_get_clean();
}

add_shortcode('nest_property_search', 'nest_property_search_shortcode');
