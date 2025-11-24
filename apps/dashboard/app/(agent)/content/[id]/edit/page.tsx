'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type CreateContentInput } from '@nest/validation';
import ContentForm from '@/components/agent/content-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EditContentPageProps {
  params: {
    id: string;
  };
}

interface ContentData {
  id: string;
  agent_id: string;
  content_type: string;
  title: string;
  slug: string;
  content_body: string;
  excerpt: string | null;
  featured_image_url: string | null;
  seo_meta_title: string | null;
  seo_meta_description: string | null;
  status: string;
  rejection_reason: string | null;
}

export default function EditContentPage({ params }: EditContentPageProps) {
  const router = useRouter();
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch content on mount
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/agent/content/${params.id}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Content not found');
          }
          throw new Error('Failed to fetch content');
        }

        const data = await response.json();
        setContent(data.content);
      } catch (err: any) {
        console.error('Error fetching content:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [params.id]);

  const handleSubmit = async (data: CreateContentInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/agent/content/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          status: 'pending_review', // Resubmit for review
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update content');
      }

      // Redirect to content list on success
      router.push('/content');
      router.refresh();
    } catch (err: any) {
      console.error('Error updating content:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (data: Partial<CreateContentInput>) => {
    try {
      const response = await fetch(`/api/agent/content/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          status: 'draft', // Keep as draft
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      console.log('Draft saved successfully');
    } catch (err: any) {
      console.error('Error saving draft:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-4 text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  // Error state or content not found
  if (error || !content) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <h3 className="font-medium mb-1">Error Loading Content</h3>
            <p className="text-sm">{error || 'Content not found'}</p>
          </AlertDescription>
        </Alert>
        <Link href="/content">
          <Button variant="outline">← Back to Content List</Button>
        </Link>
      </div>
    );
  }

  // Check if content is editable (only draft or rejected)
  const isEditable = content.status === 'draft' || content.status === 'rejected';

  if (!isEditable) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <h3 className="font-medium mb-1">Content Cannot Be Edited</h3>
            <p className="text-sm">
              This content has been {content.status === 'approved' ? 'approved' : 'published'} and
              can no longer be edited. Only draft and rejected content can be modified.
            </p>
          </AlertDescription>
        </Alert>
        <Link href="/content">
          <Button variant="outline">← Back to Content List</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Content</h1>
        <p className="text-gray-600 mt-1">
          Make changes to your {content.status === 'rejected' ? 'rejected' : 'draft'} content
        </p>
      </div>

      {/* Show rejection reason if content was rejected */}
      {content.status === 'rejected' && content.rejection_reason && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <h3 className="font-medium mb-1">Content Was Rejected</h3>
            <p className="text-sm">{content.rejection_reason}</p>
            <p className="text-sm mt-2">
              Please address the feedback above before resubmitting for review.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Error from form submission */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <h3 className="font-medium mb-1">Error Updating Content</h3>
            <p className="text-sm">{error}</p>
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ContentForm
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          initialData={{
            content_type: content.content_type,
            title: content.title,
            slug: content.slug,
            content_body: content.content_body,
            excerpt: content.excerpt || '',
            featured_image_url: content.featured_image_url || '',
            seo_meta_title: content.seo_meta_title || '',
            seo_meta_description: content.seo_meta_description || '',
          }}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
