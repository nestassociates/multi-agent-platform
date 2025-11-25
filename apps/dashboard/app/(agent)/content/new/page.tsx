'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type CreateContentInput } from '@nest/validation';
import ContentForm from '@/components/agent/content-form';

export const dynamic = 'force-dynamic';

export default function NewContentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateContentInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/agent/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          status: 'pending_review', // Submit for review
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create content');
      }

      const result = await response.json();

      // Redirect to content list on success
      router.push('/content');
      router.refresh();
    } catch (err: any) {
      console.error('Error submitting content:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (data: Partial<CreateContentInput>) => {
    try {
      const response = await fetch('/api/agent/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          status: 'draft', // Save as draft
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      // Optionally show success message
      console.log('Draft saved successfully');
    } catch (err: any) {
      console.error('Error saving draft:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Content</h1>
        <p className="text-gray-600 mt-2">
          Write blog posts, area guides, reviews, or fee structures to showcase your expertise.
          Your content will be reviewed before publishing.
        </p>
      </div>

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
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ContentForm
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          isSubmitting={isSubmitting}
        />
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Content Guidelines</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Ensure all content is original and not plagiarized</li>
          <li>Use proper grammar and spelling</li>
          <li>Include relevant images where appropriate</li>
          <li>Focus on providing value to potential clients</li>
          <li>Avoid promotional or sales-heavy language</li>
          <li>Content will be reviewed within 24-48 hours</li>
        </ul>
      </div>
    </div>
  );
}
