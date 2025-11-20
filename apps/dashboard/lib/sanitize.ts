import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify to remove dangerous tags and attributes
 */

/**
 * Sanitize HTML content for rich text editors (TipTap)
 * Allows safe HTML tags but removes scripts, iframes, etc.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre',
      'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'div', 'span',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title',
      'class', 'id',
      'width', 'height',
      'data-*', // Allow data attributes for TipTap
    ],
    ALLOW_DATA_ATTR: true,
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/**
 * Sanitize plain text (remove all HTML)
 * Use for fields that should never contain HTML
 */
export function sanitizePlainText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize URL to prevent javascript: and data: URIs
 * @param url - URL to sanitize
 * @returns Safe URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  const cleaned = url.trim();

  // Block javascript: and data: URIs
  if (/^(javascript|data|vbscript):/i.test(cleaned)) {
    return '';
  }

  // Only allow http, https, mailto, tel
  if (!/^(https?|mailto|tel):\/\//i.test(cleaned) && !cleaned.startsWith('/')) {
    return '';
  }

  return cleaned;
}

/**
 * Sanitize object by sanitizing all string values
 * Useful for sanitizing form data objects
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  htmlFields: string[] = []
): T {
  const sanitized: any = { ...obj };

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      // Use HTML sanitizer for specified fields, plain text for others
      sanitized[key] = htmlFields.includes(key)
        ? sanitizeHtml(value)
        : sanitizePlainText(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(value, htmlFields);
    } else if (Array.isArray(value)) {
      // Sanitize array values
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitizePlainText(item) : item
      );
    }
  }

  return sanitized as T;
}

/**
 * Validate and sanitize social media links
 * @param links - Object with social media platform keys and URL values
 * @returns Sanitized links object
 */
export function sanitizeSocialMediaLinks(links: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  const allowedPlatforms = ['facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'tiktok'];

  for (const [platform, url] of Object.entries(links)) {
    const lowerPlatform = platform.toLowerCase();

    // Only allow known platforms
    if (!allowedPlatforms.includes(lowerPlatform)) {
      continue;
    }

    // Sanitize URL
    const cleanUrl = sanitizeUrl(url);
    if (cleanUrl && cleanUrl.startsWith('http')) {
      sanitized[lowerPlatform] = cleanUrl;
    }
  }

  return sanitized;
}

/**
 * Escape HTML entities in string
 * Use when displaying user-generated content as text
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitize filename to prevent directory traversal
 * @param filename - Original filename
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/\.{2,}/g, '.') // Remove multiple dots (../)
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255); // Limit length
}
