'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ContentPreviewProps {
  title: string;
  content: string; // HTML from Tiptap
  featuredImage?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ContentPreview({
  title,
  content,
  featuredImage,
  isOpen,
  onClose,
}: ContentPreviewProps) {
  const [sanitizedContent, setSanitizedContent] = useState<string>('');

  // Dynamically import sanitize to avoid jsdom issues during SSR/build
  useEffect(() => {
    if (content) {
      import('@/lib/sanitize').then(({ sanitizeHtml }) => {
        setSanitizedContent(sanitizeHtml(content));
      });
    } else {
      setSanitizedContent('');
    }
  }, [content]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Content Preview</DialogTitle>
          <DialogDescription>
            This is how your content will appear on your public site
          </DialogDescription>
        </DialogHeader>

        {/* Preview Content */}
        <article className="mt-4">
          {/* Featured Image */}
          {featuredImage && (
            <div className="mb-6">
              <img
                src={featuredImage}
                alt={title}
                className="w-full h-64 object-cover rounded-lg shadow-md"
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>

          {/* Content Body with Prose Styles */}
          {sanitizedContent ? (
            <div
              className="prose prose-neutral max-w-none
                prose-headings:font-semibold prose-headings:text-gray-900
                prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-8
                prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-6
                prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
                prose-p:text-gray-700 prose-p:leading-7 prose-p:mb-4
                prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline hover:prose-a:text-primary-700
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-em:text-gray-700 prose-em:italic
                prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
                prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
                prose-li:text-gray-700 prose-li:mb-1
                prose-blockquote:border-l-4 prose-blockquote:border-primary-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
                prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                prose-img:rounded-lg prose-img:shadow-md prose-img:my-4
                prose-table:border-collapse prose-table:w-full
                prose-th:bg-gray-100 prose-th:border prose-th:border-gray-300 prose-th:px-4 prose-th:py-2 prose-th:text-left
                prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2
                prose-hr:border-gray-300 prose-hr:my-6"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No content to preview</p>
              <p className="text-sm mt-2">Write some content to see how it will look</p>
            </div>
          )}
        </article>

        {/* Preview Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This is a preview using your site's styling. The actual appearance may vary
            slightly based on your site's theme settings.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
