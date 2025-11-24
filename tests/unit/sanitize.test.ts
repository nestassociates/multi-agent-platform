/**
 * Unit Tests: HTML Sanitization
 * Comprehensive XSS vulnerability tests for DOMPurify sanitization
 */

import { describe, it, expect } from '@jest/globals';
import {
  sanitizeHtml,
  sanitizePlainText,
  sanitizeUrl,
  sanitizeObject,
} from '../../apps/dashboard/lib/sanitize';

describe('HTML Sanitization', () => {
  describe('sanitizeHtml - XSS Prevention', () => {
    it('should remove script tags', () => {
      const dirty = '<p>Hello</p><script>alert("XSS")</script>';
      const clean = sanitizeHtml(dirty);

      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('<p>Hello</p>');
    });

    it('should remove inline event handlers (onclick)', () => {
      const dirty = '<div onclick="alert(\'XSS\')">Click me</div>';
      const clean = sanitizeHtml(dirty);

      expect(clean).not.toContain('onclick');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('Click me');
    });

    it('should remove inline event handlers (onerror on image)', () => {
      const dirty = '<img src="x" onerror="alert(\'XSS\')" />';
      const clean = sanitizeHtml(dirty);

      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('alert');
      // Should still have img tag with src
      expect(clean).toContain('<img');
      expect(clean).toContain('src="x"');
    });

    it('should remove javascript: protocol in links', () => {
      const dirty = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const clean = sanitizeHtml(dirty);

      expect(clean).not.toContain('javascript:');
      expect(clean).toContain('Click');
    });

    it('should remove data: protocol URIs', () => {
      const dirty = '<a href="data:text/html,<script>alert(\'XSS\')</script>">Click</a>';
      const clean = sanitizeHtml(dirty);

      expect(clean).not.toContain('data:');
      expect(clean).not.toContain('<script>');
    });

    it('should remove vbscript: protocol', () => {
      const dirty = '<a href="vbscript:msgbox(\'XSS\')">Click</a>';
      const clean = sanitizeHtml(dirty);

      expect(clean).not.toContain('vbscript:');
    });

    it('should remove iframe tags', () => {
      const dirty = '<iframe src="http://evil.com"></iframe>';
      const clean = sanitizeHtml(dirty);

      expect(clean).not.toContain('<iframe');
      expect(clean).not.toContain('evil.com');
    });

    it('should remove object tags', () => {
      const dirty = '<object data="malicious.swf"></object>';
      const clean = sanitizeHtml(dirty);

      expect(clean).not.toContain('<object');
    });

    it('should remove embed tags', () => {
      const dirty = '<embed src="malicious.swf">';
      const clean = sanitizeHtml(dirty);

      expect(clean).not.toContain('<embed');
    });

    it('should remove style tags with malicious CSS', () => {
      const dirty = '<style>body { background: url("javascript:alert(\'XSS\')") }</style>';
      const clean = sanitizeHtml(dirty);

      expect(clean).not.toContain('<style');
      expect(clean).not.toContain('javascript:');
    });

    it('should handle nested XSS attempts', () => {
      const dirty = '<div><script>alert("XSS")</script><div><img src=x onerror="alert(1)"></div></div>';
      const clean = sanitizeHtml(dirty);

      expect(clean).not.toContain('<script');
      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('<div>');
    });

    it('should handle obfuscated XSS (uppercase)', () => {
      const dirty = '<SCRIPT>alert("XSS")</SCRIPT>';
      const clean = sanitizeHtml(dirty);

      expect(clean).not.toContain('SCRIPT');
      expect(clean).not.toContain('alert');
    });

    it('should handle obfuscated XSS (mixed case)', () => {
      const dirty = '<ScRiPt>alert("XSS")</ScRiPt>';
      const clean = sanitizeHtml(dirty);

      expect(clean.toLowerCase()).not.toContain('script');
      expect(clean).not.toContain('alert');
    });

    it('should remove SVG with embedded scripts', () => {
      const dirty = '<svg><script>alert("XSS")</script></svg>';
      const clean = sanitizeHtml(dirty);

      expect(clean).not.toContain('<script');
      expect(clean).not.toContain('alert');
    });

    it('should handle multiple XSS vectors in single input', () => {
      const dirty = `
        <p onclick="alert(1)">Text</p>
        <script>alert(2)</script>
        <img src=x onerror="alert(3)">
        <a href="javascript:alert(4)">Link</a>
      `;
      const clean = sanitizeHtml(dirty);

      expect(clean).not.toContain('onclick');
      expect(clean).not.toContain('<script');
      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('javascript:');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('Text');
      expect(clean).toContain('Link');
    });
  });

  describe('sanitizeHtml - Legitimate Content Preservation', () => {
    it('should preserve safe HTML paragraphs', () => {
      const safe = '<p>This is a paragraph with <strong>bold</strong> text.</p>';
      const clean = sanitizeHtml(safe);

      expect(clean).toBe(safe);
    });

    it('should preserve headings', () => {
      const safe = '<h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3>';
      const clean = sanitizeHtml(safe);

      expect(clean).toContain('<h1>');
      expect(clean).toContain('<h2>');
      expect(clean).toContain('<h3>');
    });

    it('should preserve lists', () => {
      const safe = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const clean = sanitizeHtml(safe);

      expect(clean).toContain('<ul>');
      expect(clean).toContain('<li>');
      expect(clean).toContain('Item 1');
    });

    it('should preserve safe links', () => {
      const safe = '<a href="https://example.com">Link</a>';
      const clean = sanitizeHtml(safe);

      expect(clean).toContain('<a href="https://example.com"');
      expect(clean).toContain('Link');
    });

    it('should preserve images with safe attributes', () => {
      const safe = '<img src="https://example.com/image.jpg" alt="Description" />';
      const clean = sanitizeHtml(safe);

      expect(clean).toContain('<img');
      expect(clean).toContain('src=');
      expect(clean).toContain('alt=');
    });

    it('should preserve blockquotes', () => {
      const safe = '<blockquote>Quote text</blockquote>';
      const clean = sanitizeHtml(safe);

      expect(clean).toContain('<blockquote>');
      expect(clean).toContain('Quote text');
    });

    it('should preserve code and pre tags', () => {
      const safe = '<pre><code>const x = 5;</code></pre>';
      const clean = sanitizeHtml(safe);

      expect(clean).toContain('<pre>');
      expect(clean).toContain('<code>');
      expect(clean).toContain('const x = 5;');
    });

    it('should preserve tables', () => {
      const safe = '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>';
      const clean = sanitizeHtml(safe);

      expect(clean).toContain('<table>');
      expect(clean).toContain('<thead>');
      expect(clean).toContain('<th>');
      expect(clean).toContain('<td>');
    });

    it('should preserve Tiptap data attributes', () => {
      const safe = '<ul data-type="taskList"><li data-checked="true">Task</li></ul>';
      const clean = sanitizeHtml(safe);

      expect(clean).toContain('data-type');
      expect(clean).toContain('data-checked');
      expect(clean).toContain('taskList');
    });

    it('should preserve text formatting (em, u, s)', () => {
      const safe = '<p><em>Italic</em> <strong>Bold</strong> <u>Underline</u> <s>Strikethrough</s></p>';
      const clean = sanitizeHtml(safe);

      expect(clean).toContain('<em>');
      expect(clean).toContain('<strong>');
      expect(clean).toContain('<u>');
      expect(clean).toContain('<s>');
    });
  });

  describe('sanitizePlainText', () => {
    it('should remove all HTML tags', () => {
      const dirty = '<p>Hello <strong>World</strong></p>';
      const clean = sanitizePlainText(dirty);

      expect(clean).not.toContain('<p>');
      expect(clean).not.toContain('<strong>');
      expect(clean).toBe('Hello World');
    });

    it('should remove script tags and content', () => {
      const dirty = 'Text <script>alert("XSS")</script> More text';
      const clean = sanitizePlainText(dirty);

      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert');
      expect(clean).toBe('Text  More text');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow https URLs', () => {
      const url = 'https://example.com/page';
      const clean = sanitizeUrl(url);

      expect(clean).toBe(url);
    });

    it('should allow http URLs', () => {
      const url = 'http://example.com/page';
      const clean = sanitizeUrl(url);

      expect(clean).toBe(url);
    });

    it('should allow relative URLs', () => {
      const url = '/path/to/page';
      const clean = sanitizeUrl(url);

      expect(clean).toBe(url);
    });

    it('should block javascript: protocol', () => {
      const url = 'javascript:alert("XSS")';
      const clean = sanitizeUrl(url);

      expect(clean).toBe('');
    });

    it('should block data: protocol', () => {
      const url = 'data:text/html,<script>alert("XSS")</script>';
      const clean = sanitizeUrl(url);

      expect(clean).toBe('');
    });

    it('should block vbscript: protocol', () => {
      const url = 'vbscript:msgbox("XSS")';
      const clean = sanitizeUrl(url);

      expect(clean).toBe('');
    });

    it('should allow mailto links', () => {
      const url = 'mailto:test@example.com';
      const clean = sanitizeUrl(url);

      expect(clean).toBe(url);
    });

    it('should allow tel links', () => {
      const url = 'tel:+1234567890';
      const clean = sanitizeUrl(url);

      expect(clean).toBe(url);
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string values in object', () => {
      const dirty = {
        title: 'Normal title',
        description: '<script>alert("XSS")</script>',
      };

      const clean = sanitizeObject(dirty);

      expect(clean.title).toBe('Normal title');
      expect(clean.description).not.toContain('<script>');
    });

    it('should sanitize HTML in specified fields', () => {
      const dirty = {
        title: '<p>Title</p>',
        content: '<p>Content with <strong>formatting</strong></p>',
      };

      const clean = sanitizeObject(dirty, ['content']);

      expect(clean.title).toBe('Title'); // Plain text
      expect(clean.content).toContain('<p>'); // HTML preserved
      expect(clean.content).toContain('<strong>');
    });

    it('should handle nested objects', () => {
      const dirty = {
        user: {
          name: '<script>alert("XSS")</script>',
        },
      };

      const clean = sanitizeObject(dirty);

      expect(clean.user.name).not.toContain('<script>');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('should handle null (coerced to string)', () => {
      expect(sanitizeHtml(null as any)).toBeTruthy();
    });

    it('should handle very long input', () => {
      const longInput = '<p>' + 'a'.repeat(100000) + '</p>';
      const clean = sanitizeHtml(longInput);

      expect(clean).toContain('<p>');
      expect(clean.length).toBeGreaterThan(100000);
    });

    it('should handle deeply nested HTML', () => {
      const nested = '<div>'.repeat(100) + 'Content' + '</div>'.repeat(100);
      const clean = sanitizeHtml(nested);

      expect(clean).toContain('Content');
    });

    it('should handle unicode characters', () => {
      const unicode = '<p>Hello 世界 🌍</p>';
      const clean = sanitizeHtml(unicode);

      expect(clean).toContain('世界');
      expect(clean).toContain('🌍');
    });
  });
});
