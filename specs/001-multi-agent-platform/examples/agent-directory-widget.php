<?php
/**
 * Nest Associates Agent Directory Widget
 *
 * Displays all agents from the network
 *
 * Usage: [nest_agent_directory]
 */

function nest_agent_directory_shortcode($atts) {
    $atts = shortcode_atts(array(
        'limit' => 12,
        'layout' => 'grid', // 'grid' or 'list'
    ), $atts);

    // API Configuration
    $api_url = 'https://dashboard.nestassociates.com/api/public/agents';

    // Fetch agents with caching
    $cache_key = 'nest_agents_' . md5($api_url);
    $agents_data = get_transient($cache_key);

    if (false === $agents_data) {
        $response = wp_remote_get($api_url, array(
            'timeout' => 15,
            'headers' => array(
                'Accept' => 'application/json',
            ),
        ));

        if (is_wp_error($response)) {
            return '<p>Error loading agents. Please try again later.</p>';
        }

        $body = wp_remote_retrieve_body($response);
        $agents_data = json_decode($body, true);

        // Cache for 5 minutes
        set_transient($cache_key, $agents_data, 5 * MINUTE_IN_SECONDS);
    }

    if (!isset($agents_data['agents']) || empty($agents_data['agents'])) {
        return '<p>No agents available at this time.</p>';
    }

    $agents = array_slice($agents_data['agents'], 0, $atts['limit']);

    // Start output buffering
    ob_start();
    ?>

    <div class="nest-agent-directory <?php echo esc_attr($atts['layout']); ?>">
        <?php foreach ($agents as $agent): ?>
            <div class="nest-agent-card">
                <div class="agent-avatar">
                    <?php if (!empty($agent['avatar_url'])): ?>
                        <img src="<?php echo esc_url($agent['avatar_url']); ?>"
                             alt="<?php echo esc_attr($agent['name']); ?>">
                    <?php else: ?>
                        <div class="agent-avatar-placeholder">
                            <?php echo esc_html(strtoupper(substr($agent['first_name'], 0, 1))); ?>
                        </div>
                    <?php endif; ?>
                </div>

                <div class="agent-info">
                    <h3 class="agent-name"><?php echo esc_html($agent['name']); ?></h3>

                    <?php if (!empty($agent['qualifications'])): ?>
                        <p class="agent-qualifications">
                            <?php echo esc_html(implode(', ', $agent['qualifications'])); ?>
                        </p>
                    <?php endif; ?>

                    <?php if (!empty($agent['bio'])): ?>
                        <p class="agent-bio">
                            <?php echo esc_html(wp_trim_words($agent['bio'], 20)); ?>
                        </p>
                    <?php endif; ?>

                    <?php if (!empty($agent['territory'])): ?>
                        <p class="agent-territory">
                            <strong>Territory:</strong>
                            <?php echo esc_html($agent['territory']['property_count']); ?> properties
                        </p>
                    <?php endif; ?>

                    <div class="agent-contact">
                        <?php if (!empty($agent['phone'])): ?>
                            <a href="tel:<?php echo esc_attr($agent['phone']); ?>" class="agent-phone">
                                <?php echo esc_html($agent['phone']); ?>
                            </a>
                        <?php endif; ?>

                        <?php if (!empty($agent['email'])): ?>
                            <a href="mailto:<?php echo esc_attr($agent['email']); ?>" class="agent-email">
                                Email
                            </a>
                        <?php endif; ?>
                    </div>

                    <a href="<?php echo esc_url($agent['site_url']); ?>"
                       class="agent-website-link"
                       target="_blank">
                        View My Properties →
                    </a>
                </div>
            </div>
        <?php endforeach; ?>
    </div>

    <style>
    .nest-agent-directory.grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 2rem;
        padding: 2rem 0;
    }

    .nest-agent-card {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1.5rem;
        background: white;
        transition: box-shadow 0.2s;
    }

    .nest-agent-card:hover {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .agent-avatar {
        width: 80px;
        height: 80px;
        margin: 0 auto 1rem;
    }

    .agent-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
    }

    .agent-avatar-placeholder {
        width: 100%;
        height: 100%;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: bold;
    }

    .agent-name {
        font-size: 1.25rem;
        margin: 0 0 0.5rem;
        text-align: center;
    }

    .agent-qualifications {
        color: #6b7280;
        font-size: 0.875rem;
        text-align: center;
        margin-bottom: 0.5rem;
    }

    .agent-bio {
        font-size: 0.875rem;
        line-height: 1.5;
        margin: 1rem 0;
        color: #374151;
    }

    .agent-territory {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0.5rem 0;
    }

    .agent-contact {
        display: flex;
        gap: 1rem;
        margin: 1rem 0;
        font-size: 0.875rem;
    }

    .agent-contact a {
        color: #3b82f6;
        text-decoration: none;
    }

    .agent-website-link {
        display: inline-block;
        background: #3b82f6;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        text-decoration: none;
        text-align: center;
        margin-top: 1rem;
        transition: background 0.2s;
    }

    .agent-website-link:hover {
        background: #2563eb;
    }
    </style>

    <?php
    return ob_get_clean();
}

add_shortcode('nest_agent_directory', 'nest_agent_directory_shortcode');
