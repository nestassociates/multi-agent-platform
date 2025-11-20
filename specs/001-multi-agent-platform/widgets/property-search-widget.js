/**
 * Nest Associates - Property Search Widget
 *
 * Displays a searchable grid of properties from across all agents
 *
 * Usage:
 * <div id="nest-property-search"></div>
 * <script>
 *   NestPropertySearch.init('#nest-property-search', {
 *     apiUrl: 'https://multi-agent-platform-eight.vercel.app/api/public/properties',
 *     defaultTransactionType: 'sale',
 *     showFilters: true,
 *     resultsPerPage: 12
 *   });
 * </script>
 */

(function() {
  'use strict';

  const NestPropertySearch = {
    // Default configuration
    defaultConfig: {
      apiUrl: 'https://multi-agent-platform-eight.vercel.app/api/public/properties',
      defaultTransactionType: '', // '' = all, 'sale', or 'let'
      showFilters: true,
      resultsPerPage: 12,
      showAgentInfo: true,
      showMap: false, // Future: integrate map view
    },

    currentFilters: {},
    currentPage: 1,
    allProperties: [],

    // Initialize the widget
    init: function(selector, userConfig = {}) {
      const container = document.querySelector(selector);
      if (!container) {
        console.error('Nest Property Search: Container not found', selector);
        return;
      }

      const config = { ...this.defaultConfig, ...userConfig };
      this.config = config;
      this.container = container;

      if (config.defaultTransactionType) {
        this.currentFilters.transaction_type = config.defaultTransactionType;
      }

      this.render();
    },

    // Fetch properties from API
    fetchProperties: async function(filters = {}) {
      try {
        const params = new URLSearchParams();

        // Add filters to query string
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });

        const url = `${this.config.apiUrl}?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Error fetching properties:', error);
        throw error;
      }
    },

    // Render the widget
    render: async function() {
      // Show loading state
      this.container.innerHTML = `
        <div class="nest-property-search">
          ${this.config.showFilters ? this.renderFilters() : ''}
          <div class="nest-loading">Searching properties...</div>
        </div>
      `;

      try {
        const properties = await this.fetchProperties(this.currentFilters);
        this.allProperties = properties;
        this.renderResults(properties);
        this.attachEventListeners();
      } catch (error) {
        this.container.innerHTML = `
          <div class="nest-error">
            <p>Unable to load properties. Please try again later.</p>
          </div>
        `;
      }
    },

    // Render filter form
    renderFilters: function() {
      return `
        <div class="nest-filters">
          <div class="nest-filter-row">
            <div class="nest-filter-group">
              <label for="nest-transaction-type">Type</label>
              <select id="nest-transaction-type" class="nest-select">
                <option value="">All</option>
                <option value="sale" ${this.currentFilters.transaction_type === 'sale' ? 'selected' : ''}>For Sale</option>
                <option value="let" ${this.currentFilters.transaction_type === 'let' ? 'selected' : ''}>To Let</option>
              </select>
            </div>

            <div class="nest-filter-group">
              <label for="nest-min-price">Min Price (£)</label>
              <input
                type="number"
                id="nest-min-price"
                class="nest-input"
                placeholder="100,000"
                value="${this.currentFilters.min_price || ''}"
              >
            </div>

            <div class="nest-filter-group">
              <label for="nest-max-price">Max Price (£)</label>
              <input
                type="number"
                id="nest-max-price"
                class="nest-input"
                placeholder="500,000"
                value="${this.currentFilters.max_price || ''}"
              >
            </div>

            <div class="nest-filter-group">
              <label for="nest-bedrooms">Bedrooms</label>
              <select id="nest-bedrooms" class="nest-select">
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>

            <div class="nest-filter-group">
              <label for="nest-location">Location</label>
              <input
                type="text"
                id="nest-location"
                class="nest-input"
                placeholder="Manchester"
                value="${this.currentFilters.location || ''}"
              >
            </div>

            <div class="nest-filter-actions">
              <button type="button" id="nest-search-btn" class="nest-btn-primary">Search</button>
              <button type="button" id="nest-clear-btn" class="nest-btn-secondary">Clear</button>
            </div>
          </div>
        </div>
      `;
    },

    // Render results grid
    renderResults: function(properties) {
      const resultsContainer = this.container.querySelector('.nest-loading') ||
                               this.container.querySelector('.nest-results') ||
                               this.container;

      if (properties.length === 0) {
        const filtersHtml = this.config.showFilters ? this.renderFilters() : '';
        this.container.innerHTML = `
          <div class="nest-property-search">
            ${filtersHtml}
            <div class="nest-no-results">
              <p>No properties found matching your criteria.</p>
              <p class="nest-hint">Try adjusting your filters</p>
            </div>
          </div>
        `;
        return;
      }

      const paginatedProperties = this.paginateProperties(properties);
      const filtersHtml = this.config.showFilters ? this.renderFilters() : '';

      const html = `
        <div class="nest-property-search">
          ${filtersHtml}
          <div class="nest-results-header">
            <p class="nest-results-count">${properties.length} properties found</p>
          </div>
          <div class="nest-property-grid">
            ${paginatedProperties.map(prop => this.renderPropertyCard(prop)).join('')}
          </div>
          ${properties.length > this.config.resultsPerPage ? this.renderPagination(properties.length) : ''}
        </div>
      `;

      this.container.innerHTML = html;
      this.attachEventListeners();
    },

    // Paginate properties
    paginateProperties: function(properties) {
      const start = (this.currentPage - 1) * this.config.resultsPerPage;
      const end = start + this.config.resultsPerPage;
      return properties.slice(start, end);
    },

    // Render pagination
    renderPagination: function(total) {
      const totalPages = Math.ceil(total / this.config.resultsPerPage);

      return `
        <div class="nest-pagination">
          <button
            class="nest-page-btn"
            data-page="${this.currentPage - 1}"
            ${this.currentPage === 1 ? 'disabled' : ''}
          >
            Previous
          </button>
          <span class="nest-page-info">Page ${this.currentPage} of ${totalPages}</span>
          <button
            class="nest-page-btn"
            data-page="${this.currentPage + 1}"
            ${this.currentPage === totalPages ? 'disabled' : ''}
          >
            Next
          </button>
        </div>
      `;
    },

    // Render individual property card
    renderPropertyCard: function(property) {
      const priceFormatted = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        maximumFractionDigits: 0
      }).format(property.price);

      return `
        <div class="nest-property-card" data-property-id="${property.id}">
          ${property.featured_image_url
            ? `<div class="nest-property-image">
                <img src="${property.featured_image_url}" alt="${property.title}" loading="lazy">
                ${property.is_featured ? '<span class="nest-featured-badge">Featured</span>' : ''}
              </div>`
            : '<div class="nest-property-placeholder">No Image</div>'
          }

          <div class="nest-property-info">
            <p class="nest-property-price">${priceFormatted}</p>
            <h3 class="nest-property-title">${property.title}</h3>

            <div class="nest-property-meta">
              ${property.bedrooms ? `<span>🛏️ ${property.bedrooms} bed</span>` : ''}
              ${property.bathrooms ? `<span>🚿 ${property.bathrooms} bath</span>` : ''}
              <span class="nest-property-type">${property.transaction_type === 'sale' ? 'For Sale' : 'To Let'}</span>
            </div>

            <p class="nest-property-address">
              ${property.address.town}${property.address.postcode ? ', ' + property.address.postcode : ''}
            </p>

            ${this.config.showAgentInfo && property.agent
              ? `<div class="nest-property-agent">
                  <p class="nest-agent-label">Listed by</p>
                  <p class="nest-agent-name-small">${property.agent.name}</p>
                  ${property.agent.phone ? `<a href="tel:${property.agent.phone}">📞 ${property.agent.phone}</a>` : ''}
                </div>`
              : ''
            }

            <a href="${property.property_url}"
               class="nest-view-property-btn"
               target="_blank"
               rel="noopener noreferrer">
              View Details →
            </a>
          </div>
        </div>
      `;
    },

    // Attach event listeners
    attachEventListeners: function() {
      const searchBtn = this.container.querySelector('#nest-search-btn');
      const clearBtn = this.container.querySelector('#nest-clear-btn');
      const pageButtons = this.container.querySelectorAll('.nest-page-btn');

      if (searchBtn) {
        searchBtn.addEventListener('click', () => this.handleSearch());
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', () => this.handleClear());
      }

      pageButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const page = parseInt(e.target.dataset.page);
          this.currentPage = page;
          this.renderResults(this.allProperties);
        });
      });
    },

    // Handle search
    handleSearch: function() {
      const filters = {
        transaction_type: document.getElementById('nest-transaction-type')?.value || '',
        min_price: document.getElementById('nest-min-price')?.value || '',
        max_price: document.getElementById('nest-max-price')?.value || '',
        bedrooms: document.getElementById('nest-bedrooms')?.value || '',
        location: document.getElementById('nest-location')?.value || '',
      };

      this.currentFilters = filters;
      this.currentPage = 1;
      this.render();
    },

    // Handle clear filters
    handleClear: function() {
      this.currentFilters = this.config.defaultTransactionType
        ? { transaction_type: this.config.defaultTransactionType }
        : {};
      this.currentPage = 1;
      this.render();
    }
  };

  // Make globally available
  window.NestPropertySearch = NestPropertySearch;

})();

/* ============================================
   DEFAULT STYLES (Customize to match your theme)
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  const style = document.createElement('style');
  style.textContent = `
    .nest-property-search {
      margin: 2rem 0;
    }

    .nest-filters {
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    .nest-filter-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      align-items: end;
    }

    .nest-filter-group {
      display: flex;
      flex-direction: column;
    }

    .nest-filter-group label {
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: #374151;
    }

    .nest-input,
    .nest-select {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .nest-filter-actions {
      display: flex;
      gap: 0.5rem;
    }

    .nest-btn-primary,
    .nest-btn-secondary {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .nest-btn-primary {
      background: #0D8ABC;
      color: white;
    }

    .nest-btn-primary:hover {
      background: #0a6a95;
    }

    .nest-btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .nest-btn-secondary:hover {
      background: #f3f4f6;
    }

    .nest-results-header {
      margin-bottom: 1.5rem;
    }

    .nest-results-count {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .nest-property-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 2rem;
    }

    .nest-property-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.2s;
    }

    .nest-property-card:hover {
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .nest-property-image {
      position: relative;
      width: 100%;
      height: 200px;
      overflow: hidden;
    }

    .nest-property-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .nest-featured-badge {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      background: #0D8ABC;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .nest-property-placeholder {
      width: 100%;
      height: 200px;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
    }

    .nest-property-info {
      padding: 1.5rem;
    }

    .nest-property-price {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0D8ABC;
      margin: 0 0 0.5rem 0;
    }

    .nest-property-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.75rem 0;
      line-height: 1.4;
    }

    .nest-property-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.75rem;
    }

    .nest-property-type {
      background: #f3f4f6;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .nest-property-address {
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .nest-property-agent {
      border-top: 1px solid #e5e7eb;
      padding-top: 1rem;
      margin-top: 1rem;
    }

    .nest-agent-label {
      font-size: 0.75rem;
      color: #9ca3af;
      margin: 0 0 0.25rem 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .nest-agent-name-small {
      font-weight: 600;
      margin: 0 0 0.25rem 0;
    }

    .nest-property-agent a {
      color: #0D8ABC;
      text-decoration: none;
      font-size: 0.875rem;
    }

    .nest-property-agent a:hover {
      text-decoration: underline;
    }

    .nest-view-property-btn {
      display: inline-block;
      width: 100%;
      padding: 0.75rem;
      margin-top: 1rem;
      background: #0D8ABC;
      color: white;
      text-align: center;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      transition: background 0.2s;
    }

    .nest-view-property-btn:hover {
      background: #0a6a95;
    }

    .nest-pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
    }

    .nest-page-btn {
      padding: 0.5rem 1rem;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .nest-page-btn:hover:not(:disabled) {
      background: #f3f4f6;
    }

    .nest-page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .nest-page-info {
      font-size: 0.875rem;
      color: #6b7280;
    }

    @media (max-width: 768px) {
      .nest-property-grid {
        grid-template-columns: 1fr;
      }

      .nest-filter-row {
        grid-template-columns: 1fr;
      }

      .nest-filter-actions {
        grid-column: 1;
      }
    }
  `;
  document.head.appendChild(style);
});
