-- T012: Seed global_content table with default values if empty
-- This migration inserts default header, footer, and legal page content
-- Only inserts if no rows exist for that content_type

-- We need a profile user_id for created_by_user_id
-- Use the first admin profile, or skip if none exists
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get first admin user_id
  SELECT user_id INTO admin_user_id
  FROM profiles
  WHERE role = 'admin' OR role = 'super_admin'
  LIMIT 1;

  -- If no admin exists, skip seeding (will need to be done manually later)
  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'No admin user found. Global content will need to be created manually.';
    RETURN;
  END IF;

  -- Seed header content if not exists
  INSERT INTO global_content (content_type, content_body, is_published, published_at, created_by_user_id)
  SELECT
    'header',
    '{"logo":{"url":"","alt":"Nest Associates"},"navigation":[{"label":"Home","href":"/"},{"label":"About","href":"/about"},{"label":"Services","href":"/services"},{"label":"Properties","href":"/properties"},{"label":"Contact","href":"/contact"}],"cta":{"label":"Get Valuation","href":"/contact"}}',
    false,
    NULL,
    admin_user_id
  WHERE NOT EXISTS (SELECT 1 FROM global_content WHERE content_type = 'header');

  -- Seed footer content if not exists
  INSERT INTO global_content (content_type, content_body, is_published, published_at, created_by_user_id)
  SELECT
    'footer',
    '{"columns":[{"title":"Quick Links","links":[{"label":"Home","href":"/"},{"label":"Properties","href":"/properties"},{"label":"About","href":"/about"},{"label":"Contact","href":"/contact"}]},{"title":"Legal","links":[{"label":"Privacy Policy","href":"/privacy"},{"label":"Terms of Service","href":"/terms"},{"label":"Cookie Policy","href":"/cookies"}]}],"contact":{"email":"info@nestassociates.co.uk","phone":"","address":""},"social":[],"copyright":"© 2024 Nest Associates. All rights reserved."}',
    false,
    NULL,
    admin_user_id
  WHERE NOT EXISTS (SELECT 1 FROM global_content WHERE content_type = 'footer');

  -- Seed privacy policy if not exists
  INSERT INTO global_content (content_type, content_body, is_published, published_at, created_by_user_id)
  SELECT
    'privacy_policy',
    '{"html":"<h1>Privacy Policy</h1><p>Last updated: [DATE]</p><h2>Introduction</h2><p>This privacy policy explains how we collect, use, and protect your personal information.</p><h2>Information We Collect</h2><p>We collect information you provide directly to us, such as when you fill out a contact form or request a property valuation.</p><h2>How We Use Your Information</h2><p>We use your information to provide our services, communicate with you, and improve our platform.</p><h2>Contact Us</h2><p>If you have any questions about this privacy policy, please contact us.</p>"}',
    false,
    NULL,
    admin_user_id
  WHERE NOT EXISTS (SELECT 1 FROM global_content WHERE content_type = 'privacy_policy');

  -- Seed terms of service if not exists
  INSERT INTO global_content (content_type, content_body, is_published, published_at, created_by_user_id)
  SELECT
    'terms_of_service',
    '{"html":"<h1>Terms of Service</h1><p>Last updated: [DATE]</p><h2>Acceptance of Terms</h2><p>By accessing and using this website, you accept and agree to be bound by these terms.</p><h2>Use of Service</h2><p>You agree to use this service only for lawful purposes and in accordance with these terms.</p><h2>Disclaimer</h2><p>Property information is provided for general information purposes only.</p><h2>Contact Us</h2><p>If you have any questions about these terms, please contact us.</p>"}',
    false,
    NULL,
    admin_user_id
  WHERE NOT EXISTS (SELECT 1 FROM global_content WHERE content_type = 'terms_of_service');

  -- Seed cookie policy if not exists
  INSERT INTO global_content (content_type, content_body, is_published, published_at, created_by_user_id)
  SELECT
    'cookie_policy',
    '{"html":"<h1>Cookie Policy</h1><p>Last updated: [DATE]</p><h2>What Are Cookies</h2><p>Cookies are small text files stored on your device when you visit our website.</p><h2>How We Use Cookies</h2><p>We use cookies to enhance your browsing experience, analyze site traffic, and understand where our visitors come from.</p><h2>Types of Cookies We Use</h2><ul><li><strong>Essential cookies:</strong> Required for the website to function properly.</li><li><strong>Analytics cookies:</strong> Help us understand how visitors interact with our website.</li></ul><h2>Managing Cookies</h2><p>You can control and manage cookies through your browser settings.</p>"}',
    false,
    NULL,
    admin_user_id
  WHERE NOT EXISTS (SELECT 1 FROM global_content WHERE content_type = 'cookie_policy');

  RAISE NOTICE 'Global content seeding complete.';
END $$;
