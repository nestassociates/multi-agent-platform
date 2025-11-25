'use client';

import { sanitizeHtml } from '@/lib/sanitize';

interface SanitizedContentProps {
  html: string;
  className?: string;
}

export function SanitizedContent({ html, className }: SanitizedContentProps) {
  const sanitized = sanitizeHtml(html);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
