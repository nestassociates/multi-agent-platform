'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createContentSchema, type CreateContentInput } from '@nest/validation';
import { ContentEditor } from '@/components/agent/content-editor';
import { ContentSidebar } from '@/components/agent/content-sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NewContentPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleSubmit = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const data = form.getValues();
      const response = await fetch('/api/agent/content', {
        method: 'POST',
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
        throw new Error(errorData.error?.message || 'Failed to create content');
      }

      router.push('/content');
      router.refresh();
    } catch (err: any) {
      console.error('Error submitting content:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setAutoSaving(true);
    try {
      const data = form.getValues();
      const response = await fetch('/api/agent/content', {
        method: 'POST',
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
            <h1 className="text-base md:text-lg font-semibold text-gray-900 hidden md:block">Create New Content</h1>
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
