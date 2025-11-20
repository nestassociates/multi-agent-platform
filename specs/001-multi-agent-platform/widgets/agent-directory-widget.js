/**
 * Nest Associates - Agent Directory Widget
 *
 * Displays a grid of active agents from the multi-agent platform
 *
 * Usage:
 * <div id="nest-agent-directory"></div>
 * <script>
 *   NestAgentDirectory.init('#nest-agent-directory', {
 *     apiUrl: 'https://multi-agent-platform-eight.vercel.app/api/public/agents',
 *     columns: 3,
 *     showBio: true,
 *     showPhone: true,
 *     showEmail: false,
 *     limit: 12
 *   });
 * </script>
 */

(function() {
  'use strict';

  const NestAgentDirectory = {
    // Default configuration
    defaultConfig: {
      apiUrl: 'https://multi-agent-platform-eight.vercel.app/api/public/agents',
      columns: 3,
      showBio: true,
      showPhone: true,
      showEmail: false,
      showQualifications: true,
      showTerritory: true,
      limit: null, // null = show all
      sortBy: 'name', // 'name' or 'territory'
      filterByTerritory: null,
    },

    // Initialize the widget
    init: function(selector, userConfig = {}) {
      const container = document.querySelector(selector);
      if (!container) {
        console.error('Nest Agent Directory: Container not found', selector);
        return;
      }

      const config = { ...this.defaultConfig, ...userConfig };
      this.render(container, config);
    },

    // Fetch agents from API
    fetchAgents: async function(apiUrl) {
      try {
        // Check cache first
        const cacheKey = 'nest_agents_cache';
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;

          // Use cache if less than 5 minutes old
          if (age < 5 * 60 * 1000) {
            return data;
          }
        }

        // Fetch fresh data
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const agents = await response.json();

        // Cache the result
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: agents,
          timestamp: Date.now()
        }));

        return agents;
      } catch (error) {
        console.error('Error fetching agents:', error);
        throw error;
      }
    },

    // Filter and sort agents
    processAgents: function(agents, config) {
      let processed = [...agents];

      // Filter by territory if specified
      if (config.filterByTerritory) {
        processed = processed.filter(agent =>
          agent.territory === config.filterByTerritory
        );
      }

      // Sort
      if (config.sortBy === 'name') {
        processed.sort((a, b) => a.name.localeCompare(b.name));
      } else if (config.sortBy === 'territory') {
        processed.sort((a, b) => (a.territory || '').localeCompare(b.territory || ''));
      }

      // Limit results
      if (config.limit) {
        processed = processed.slice(0, config.limit);
      }

      return processed;
    },

    // Render the widget
    render: async function(container, config) {
      // Show loading state
      container.innerHTML = '<div class="nest-loading">Loading agents...</div>';

      try {
        const agents = await this.fetchAgents(config.apiUrl);
        const processedAgents = this.processAgents(agents, config);

        if (processedAgents.length === 0) {
          container.innerHTML = '<div class="nest-no-results">No agents found</div>';
          return;
        }

        // Build HTML
        const html = `
          <div class="nest-agent-directory" data-columns="${config.columns}">
            ${processedAgents.map(agent => this.renderAgentCard(agent, config)).join('')}
          </div>
        `;

        container.innerHTML = html;
        this.attachEventListeners(container);

      } catch (error) {
        container.innerHTML = `
          <div class="nest-error">
            <p>Unable to load agents. Please try again later.</p>
          </div>
        `;
      }
    },

    // Render individual agent card
    renderAgentCard: function(agent, config) {
      const avatar = agent.avatar_url || this.getDefaultAvatar(agent);
      const initials = `${agent.first_name[0]}${agent.last_name[0]}`.toUpperCase();

      return `
        <div class="nest-agent-card" data-agent-id="${agent.id}">
          <div class="nest-agent-avatar">
            ${agent.avatar_url
              ? `<img src="${avatar}" alt="${agent.name}" loading="lazy">`
              : `<div class="nest-agent-initials">${initials}</div>`
            }
          </div>

          <div class="nest-agent-info">
            <h3 class="nest-agent-name">${agent.name}</h3>

            ${config.showTerritory && agent.territory
              ? `<p class="nest-agent-territory">${agent.territory}</p>`
              : ''
            }

            ${config.showQualifications && agent.qualifications.length > 0
              ? `<div class="nest-agent-quals">
                  ${agent.qualifications.map(q => `<span class="nest-qual-badge">${q}</span>`).join('')}
                </div>`
              : ''
            }

            ${config.showBio && agent.bio
              ? `<p class="nest-agent-bio">${this.truncate(agent.bio, 120)}</p>`
              : ''
            }

            <div class="nest-agent-contact">
              ${config.showPhone && agent.phone
                ? `<a href="tel:${agent.phone}" class="nest-contact-link">
                    📞 ${agent.phone}
                  </a>`
                : ''
              }
              ${config.showEmail && agent.email
                ? `<a href="mailto:${agent.email}" class="nest-contact-link">
                    ✉️ ${agent.email}
                  </a>`
                : ''
              }
            </div>

            <a href="${agent.microsite_url}"
               class="nest-view-profile-btn"
               target="_blank"
               rel="noopener noreferrer">
              View Full Profile →
            </a>
          </div>
        </div>
      `;
    },

    // Utility: Truncate text
    truncate: function(text, maxLength) {
      if (!text || text.length <= maxLength) return text;
      return text.substring(0, maxLength).trim() + '...';
    },

    // Utility: Get default avatar
    getDefaultAvatar: function(agent) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&size=200&background=0D8ABC&color=fff`;
    },

    // Attach event listeners
    attachEventListeners: function(container) {
      // Add click tracking or other interactions here
      const cards = container.querySelectorAll('.nest-agent-card');
      cards.forEach(card => {
        card.addEventListener('click', (e) => {
          // Track click analytics if needed
          const agentId = card.dataset.agentId;
          console.log('Agent card clicked:', agentId);
        });
      });
    }
  };

  // Make globally available
  window.NestAgentDirectory = NestAgentDirectory;

})();

/* ============================================
   DEFAULT STYLES (Customize to match your theme)
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  const style = document.createElement('style');
  style.textContent = `
    .nest-agent-directory {
      display: grid;
      gap: 2rem;
      margin: 2rem 0;
    }

    .nest-agent-directory[data-columns="2"] {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }

    .nest-agent-directory[data-columns="3"] {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }

    .nest-agent-directory[data-columns="4"] {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }

    .nest-agent-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      transition: all 0.2s;
      cursor: pointer;
    }

    .nest-agent-card:hover {
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .nest-agent-avatar {
      width: 100px;
      height: 100px;
      margin: 0 auto 1rem;
      border-radius: 50%;
      overflow: hidden;
    }

    .nest-agent-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .nest-agent-initials {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0D8ABC;
      color: white;
      font-size: 2rem;
      font-weight: bold;
    }

    .nest-agent-name {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      text-align: center;
    }

    .nest-agent-territory {
      text-align: center;
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .nest-agent-quals {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .nest-qual-badge {
      background: #f3f4f6;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .nest-agent-bio {
      color: #4b5563;
      font-size: 0.875rem;
      line-height: 1.5;
      margin: 1rem 0;
      text-align: center;
    }

    .nest-agent-contact {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin: 1rem 0;
    }

    .nest-contact-link {
      color: #0D8ABC;
      text-decoration: none;
      font-size: 0.875rem;
      text-align: center;
    }

    .nest-contact-link:hover {
      text-decoration: underline;
    }

    .nest-view-profile-btn {
      display: inline-block;
      width: 100%;
      padding: 0.75rem;
      background: #0D8ABC;
      color: white;
      text-align: center;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      transition: background 0.2s;
    }

    .nest-view-profile-btn:hover {
      background: #0a6a95;
    }

    .nest-loading,
    .nest-error,
    .nest-no-results {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    .nest-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #991b1b;
    }

    @media (max-width: 768px) {
      .nest-agent-directory {
        grid-template-columns: 1fr !important;
      }
    }
  `;
  document.head.appendChild(style);
});
