'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createContentSchema, type CreateContentInput } from '@nest/validation';
import { ContentEditor } from '@/components/agent/content-editor';
import { ContentSidebar } from '@/components/agent/content-sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ContentData {
  id: string;
  agent_id: string;
  content_type: 'blog_post' | 'area_guide';
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

export default function EditContentPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.id as string;
  const isMobile = useIsMobile();
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const form = useForm<CreateContentInput>({
    resolver: zodResolver(createContentSchema),
    defaultValues: {
      content_type: 'blog_post',
      title: '',
      slug: '',
      content_body: '',
      excerpt: '',
      featured_image_url: '',
      seo_meta_title: '',
      seo_meta_description: '',
    },
  });

  // Fetch content on mount
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/agent/content/${contentId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Content not found');
          }
          throw new Error('Failed to fetch content');
        }

        const data = await response.json();
        setContent(data.content);

        // Reset form with fetched content
        form.reset({
          content_type: data.content.content_type,
          title: data.content.title,
          slug: data.content.slug,
          content_body: data.content.content_body,
          excerpt: data.content.excerpt || '',
          featured_image_url: data.content.featured_image_url || '',
          seo_meta_title: data.content.seo_meta_title || '',
          seo_meta_description: data.content.seo_meta_description || '',
        });
      } catch (err: any) {
        console.error('Error fetching content:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [contentId, form]);

  const handleSubmit = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const data = form.getValues();
      const response = await fetch(`/api/agent/content/${contentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          status: 'pending_review',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update content');
      }

      router.push('/content');
      router.refresh();
    } catch (err: any) {
      console.error('Error updating content:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setAutoSaving(true);
    try {
      const data = form.getValues();
      const response = await fetch(`/api/agent/content/${contentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          status: 'draft',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      setLastSaved(new Date());
    } catch (err: any) {
      console.error('Error saving draft:', err);
      setError(err.message);
    } finally {
      setAutoSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex items-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-4 text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  // Error state or content not found
  if (error && !content) {
    return (
      <div className="max-w-4xl mx-auto p-6">
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
  const isEditable = content?.status === 'draft' || content?.status === 'rejected';

  if (!isEditable) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <h3 className="font-medium mb-1">Content Cannot Be Edited</h3>
            <p className="text-sm">
              This content has been {content?.status === 'approved' ? 'approved' : 'published'} and
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
    <FormProvider {...form}>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              href="/content"
              className="flex items-center gap-1 md:gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Content</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <span className="text-gray-300 hidden md:inline">|</span>
            <h1 className="text-base md:text-lg font-semibold text-gray-900 hidden md:block">Edit Content</h1>
            {content?.status === 'rejected' && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                Rejected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded hidden md:block">
                {error}
              </div>
            )}
            {isMobile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            )}
          </div>
        </div>

        {/* Error on mobile - separate line */}
        {error && isMobile && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Rejection Reason Banner */}
        {content?.status === 'rejected' && content.rejection_reason && (
          <div className="px-4 py-3 bg-red-50 border-b border-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-red-800">Rejection reason: </span>
                <span className="text-red-700">{content.rejection_reason}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area - 2 Column Layout on desktop, single column on mobile */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor Column */}
          <ContentEditor form={form} />

          {/* Sidebar Column - hidden on mobile, visible in sheet */}
          {!isMobile && (
            <ContentSidebar
              form={form}
              onSubmit={handleSubmit}
              onSaveDraft={handleSaveDraft}
              isSubmitting={isSubmitting}
              autoSaving={autoSaving}
              lastSaved={lastSaved}
            />
          )}
        </div>

        {/* Mobile Sidebar Sheet */}
        {isMobile && (
          <ContentSidebar
            form={form}
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            isSubmitting={isSubmitting}
            autoSaving={autoSaving}
            lastSaved={lastSaved}
            isMobile
            isOpen={sidebarOpen}
            onOpenChange={setSidebarOpen}
          />
        )}
      </div>
    </FormProvider>
  );
}
