/**
 * SERVER-ONLY HTML sanitization using DOMPurify + jsdom
 * This file should only be imported in API routes and server components
 */

import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

// Create a minimal jsdom window for server-side sanitization
const window = new JSDOM('<!DOCTYPE html>', {
  url: 'http://localhost',
}).window;

const DOMPurify = createDOMPurify(window as any);

/**
 * Sanitize HTML content for rich text editors (TipTap) - SERVER ONLY
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
