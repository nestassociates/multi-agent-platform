'use client';

import { useEffect, useState } from 'react';
import { ModerationQueue } from '@/components/admin/moderation-queue';

interface Content {
  id: string;
  agent_id: string;
  content_type: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
  agent?: {
    id: string;
    profile: {
      first_name: string;
      last_name: string;
    };
  };
}

export default function ContentModerationPage() {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/content/moderation');

      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }

      const data = await response.json();
      setContent(data.content || []);
    } catch (err: any) {
      console.error('Error fetching content:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/content/${id}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to approve content');
      }

      // Remove from pending list
      setContent((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error('Error approving content:', err);
      throw err;
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/content/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejection_reason: reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject content');
      }

      // Remove from pending list
      setContent((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error('Error rejecting content:', err);
      throw err;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>
        <p className="text-gray-600 mt-2">
          Review and approve content submitted by agents before it goes live on their sites.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Pending Review</div>
          <div className="text-2xl font-bold text-yellow-600">{content.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Average Review Time</div>
          <div className="text-2xl font-bold text-gray-900">24h</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Approval Rate</div>
          <div className="text-2xl font-bold text-green-600">94%</div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading content</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading content...</p>
        </div>
      ) : (
        <ModerationQueue
          content={content}
          onApprove={handleApprove}
          onReject={handleReject}
          onRefresh={fetchContent}
        />
      )}
    </div>
  );
}
