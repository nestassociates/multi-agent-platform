'use client';

import { useState, useEffect } from 'react';

interface SanitizedContentProps {
  html: string;
  className?: string;
}

export function SanitizedContent({ html, className }: SanitizedContentProps) {
  const [sanitized, setSanitized] = useState<string>('');

  // Dynamically import sanitize to avoid jsdom issues during SSR/build
  useEffect(() => {
    if (html) {
      import('@/lib/sanitize').then(({ sanitizeHtml }) => {
        setSanitized(sanitizeHtml(html));
      });
    } else {
      setSanitized('');
    }
  }, [html]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
