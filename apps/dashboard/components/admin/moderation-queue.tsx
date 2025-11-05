'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@nest/ui';

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

interface ModerationQueueProps {
  content: Content[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onRefresh?: () => void;
}

const contentTypeLabels = {
  blog_post: 'Blog Post',
  area_guide: 'Area Guide',
  review: 'Customer Review',
  fee_structure: 'Fee Structure',
};

export function ModerationQueue({
  content,
  onApprove,
  onReject,
  onRefresh,
}: ModerationQueueProps) {
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this content?')) {
      return;
    }

    setIsProcessing(true);
    try {
      await onApprove(id);
      onRefresh?.();
    } catch (error) {
      console.error('Error approving content:', error);
      alert('Failed to approve content');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClick = (id: string) => {
    setSelectedContent(id);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedContent) return;

    if (rejectionReason.trim().length < 10) {
      alert('Rejection reason must be at least 10 characters');
      return;
    }

    setIsProcessing(true);
    try {
      await onReject(selectedContent, rejectionReason);
      setShowRejectModal(false);
      setSelectedContent(null);
      setRejectionReason('');
      onRefresh?.();
    } catch (error) {
      console.error('Error rejecting content:', error);
      alert('Failed to reject content');
    } finally {
      setIsProcessing(false);
    }
  };

  if (content.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No pending content</h3>
        <p className="text-gray-600">All content has been reviewed. Check back later!</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Content
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {content.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-500">{item.slug}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {item.agent
                      ? `${item.agent.profile.first_name} ${item.agent.profile.last_name}`
                      : 'Unknown'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {contentTypeLabels[item.content_type as keyof typeof contentTypeLabels]}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/content-moderation/${item.id}`}
                    className="text-primary-600 hover:text-primary-900 mr-4"
                  >
                    Review
                  </Link>
                  <button
                    onClick={() => handleApprove(item.id)}
                    disabled={isProcessing}
                    className="text-green-600 hover:text-green-900 mr-4 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectClick(item.id)}
                    disabled={isProcessing}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Content</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this content. The agent will see this message.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-primary-500 mb-1"
              placeholder="e.g., Content contains factual errors or violates guidelines..."
            />
            <div className="text-xs text-gray-500 mb-4">
              {rejectionReason.length}/500 characters (minimum 10)
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleRejectSubmit}
                disabled={isProcessing || rejectionReason.trim().length < 10}
                variant="destructive"
              >
                {isProcessing ? 'Rejecting...' : 'Reject Content'}
              </Button>
              <Button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedContent(null);
                  setRejectionReason('');
                }}
                disabled={isProcessing}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ModerationQueue;
