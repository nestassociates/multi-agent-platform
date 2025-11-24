'use client';

import { sanitizeHtml } from '@/lib/sanitize';

interface Content {
  id: string;
  agent_id: string;
  content_type: string;
  title: string;
  slug: string;
  content_body: string;
  excerpt?: string;
  featured_image_url?: string;
  seo_meta_title?: string;
  seo_meta_description?: string;
  status: string;
  created_at: string;
  updated_at: string;
  agent?: {
    id: string;
    profile: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

interface ContentPreviewProps {
  content: Content;
}

const contentTypeLabels = {
  blog_post: 'Blog Post',
  area_guide: 'Area Guide',
  review: 'Customer Review',
  fee_structure: 'Fee Structure',
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  pending_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  published: 'bg-blue-100 text-blue-800',
};

export function ContentPreview({ content }: ContentPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{content.title}</h2>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>
                By{' '}
                {content.agent
                  ? `${content.agent.profile.first_name} ${content.agent.profile.last_name}`
                  : 'Unknown Agent'}
              </span>
              <span>•</span>
              <span>
                {contentTypeLabels[content.content_type as keyof typeof contentTypeLabels]}
              </span>
              <span>•</span>
              <span>Submitted {new Date(content.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              statusColors[content.status as keyof typeof statusColors]
            }`}
          >
            {content.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        <div className="border-t border-gray-200 pt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Slug:</span>
            <span className="text-gray-600 ml-2">{content.slug}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Agent Email:</span>
            <span className="text-gray-600 ml-2">
              {content.agent?.profile.email || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {content.featured_image_url && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Featured Image</h3>
          <img
            src={content.featured_image_url}
            alt={content.title}
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Excerpt */}
      {content.excerpt && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Excerpt</h3>
          <p className="text-gray-900">{content.excerpt}</p>
        </div>
      )}

      {/* Content Body */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Content</h3>
        <div
          className="prose prose-sm sm:prose lg:prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.content_body) }}
        />
      </div>

      {/* SEO Metadata */}
      {(content.seo_meta_title || content.seo_meta_description) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">SEO Metadata</h3>
          <div className="space-y-3">
            {content.seo_meta_title && (
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                  Meta Title
                </div>
                <div className="text-sm text-gray-900">{content.seo_meta_title}</div>
              </div>
            )}
            {content.seo_meta_description && (
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                  Meta Description
                </div>
                <div className="text-sm text-gray-900">{content.seo_meta_description}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Guidelines Check */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-sm font-medium text-blue-900 mb-3">Review Checklist</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start">
            <span className="mr-2">□</span>
            <span>Content is original and not plagiarized</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">□</span>
            <span>Grammar and spelling are correct</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">□</span>
            <span>Content provides value to potential clients</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">□</span>
            <span>No promotional or sales-heavy language</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">□</span>
            <span>Facts and claims are accurate</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">□</span>
            <span>Images are appropriate and properly licensed</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default ContentPreview;
