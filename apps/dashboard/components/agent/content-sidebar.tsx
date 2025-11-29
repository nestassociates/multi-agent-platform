'use client';

import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { CreateContentInput } from '@nest/validation';
import { Button, Input } from '@nest/ui';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ImageUpload } from '@/components/agent/image-upload';
import { generateSlug } from '@/lib/slug-generator';

interface ContentSidebarProps {
  form: UseFormReturn<CreateContentInput>;
  onSubmit: () => void;
  onSaveDraft: () => void;
  isSubmitting: boolean;
  autoSaving?: boolean;
  lastSaved?: Date | null;
  isMobile?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface SidebarSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function SidebarSection({ title, defaultOpen = true, children }: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b border-gray-200">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
        <span>{title}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

const contentTypeOptions = [
  { value: 'blog_post', label: 'Blog Post' },
  { value: 'area_guide', label: 'Area Guide' },
];

export function ContentSidebar({
  form,
  onSubmit,
  onSaveDraft,
  isSubmitting,
  autoSaving,
  lastSaved,
  isMobile = false,
  isOpen = false,
  onOpenChange,
}: ContentSidebarProps) {
  const { register, watch, setValue, formState: { errors } } = form;

  const title = watch('title');
  const slug = watch('slug');
  const contentType = watch('content_type');
  const excerpt = watch('excerpt');
  const featuredImageUrl = watch('featured_image_url');
  const seoMetaTitle = watch('seo_meta_title');
  const seoMetaDescription = watch('seo_meta_description');

  // Handle slug change with auto-generate logic
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('slug', e.target.value);
  };

  // Regenerate slug from title
  const handleRegenerateSlug = () => {
    if (title) {
      setValue('slug', generateSlug(title));
    }
  };

  // Handle image upload
  const handleImageUpload = (url: string) => {
    setValue('featured_image_url', url, { shouldValidate: true });
  };

  // Sidebar content - shared between desktop and mobile
  const sidebarContent = (
    <>
      {/* Header with save status */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          {autoSaving && (
            <span className="flex items-center">
              <svg className="animate-spin mr-1 h-3 w-3 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          )}
          {!autoSaving && lastSaved && (
            <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
          )}
          {!autoSaving && !lastSaved && (
            <span>Not saved yet</span>
          )}
        </div>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Status & Visibility Section */}
        <SidebarSection title="Status & Visibility" defaultOpen={true}>
          <div className="space-y-4">
            {/* Content Type */}
            <div>
              <label htmlFor="content_type" className="block text-xs font-medium text-gray-700 mb-1">
                Content Type
              </label>
              <select
                {...register('content_type')}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {contentTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.content_type && (
                <p className="mt-1 text-xs text-red-600">{errors.content_type.message}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Review'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onSaveDraft}
                disabled={isSubmitting}
                className="w-full"
              >
                Save Draft
              </Button>
            </div>
          </div>
        </SidebarSection>

        {/* Permalink Section */}
        <SidebarSection title="Permalink" defaultOpen={true}>
          <div>
            <label htmlFor="slug" className="block text-xs font-medium text-gray-700 mb-1">
              URL Slug
            </label>
            <div className="flex gap-2">
              <Input
                id="slug"
                value={slug || ''}
                onChange={handleSlugChange}
                placeholder="auto-generated-from-title"
                className="flex-1 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRegenerateSlug}
                title="Regenerate from title"
              >
                ↻
              </Button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Auto-generated from title. Edit for SEO.
            </p>
            {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
          </div>
        </SidebarSection>

        {/* Featured Image Section */}
        <SidebarSection title="Featured Image" defaultOpen={true}>
          <ImageUpload
            onUpload={handleImageUpload}
            initialUrl={featuredImageUrl}
            bucket="content-images"
            contentType={contentType?.replace('_', '-') + 's'}
          />
          {errors.featured_image_url && (
            <p className="mt-1 text-xs text-red-600">{errors.featured_image_url.message}</p>
          )}
        </SidebarSection>

        {/* Excerpt Section */}
        <SidebarSection title="Excerpt" defaultOpen={false}>
          <div>
            <label htmlFor="excerpt" className="block text-xs font-medium text-gray-700 mb-1">
              Summary
            </label>
            <textarea
              {...register('excerpt')}
              id="excerpt"
              rows={3}
              placeholder="Brief summary shown in listings"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="mt-1 flex justify-between items-center">
              {errors.excerpt && <p className="text-xs text-red-600">{errors.excerpt.message}</p>}
              <span className="text-xs text-gray-500 ml-auto">{excerpt?.length || 0}/250</span>
            </div>
          </div>
        </SidebarSection>

        {/* SEO Settings Section */}
        <SidebarSection title="SEO Settings" defaultOpen={false}>
          <div className="space-y-4">
            {/* SEO Meta Title */}
            <div>
              <label htmlFor="seo_meta_title" className="block text-xs font-medium text-gray-700 mb-1">
                Meta Title
              </label>
              <Input
                id="seo_meta_title"
                {...register('seo_meta_title')}
                placeholder="SEO-optimized title"
                className="text-sm"
              />
              <div className="mt-1 flex justify-between items-center">
                {errors.seo_meta_title && (
                  <p className="text-xs text-red-600">{errors.seo_meta_title.message}</p>
                )}
                <span className="text-xs text-gray-500 ml-auto">
                  {seoMetaTitle?.length || 0}/60
                </span>
              </div>
            </div>

            {/* SEO Meta Description */}
            <div>
              <label htmlFor="seo_meta_description" className="block text-xs font-medium text-gray-700 mb-1">
                Meta Description
              </label>
              <textarea
                {...register('seo_meta_description')}
                id="seo_meta_description"
                rows={2}
                placeholder="Description for search results"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="mt-1 flex justify-between items-center">
                {errors.seo_meta_description && (
                  <p className="text-xs text-red-600">{errors.seo_meta_description.message}</p>
                )}
                <span className="text-xs text-gray-500 ml-auto">
                  {seoMetaDescription?.length || 0}/160
                </span>
              </div>
            </div>
          </div>
        </SidebarSection>
      </div>
    </>
  );

  // Mobile: Render as Sheet (right drawer)
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[85vw] max-w-[400px] p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b border-gray-200 shrink-0">
            <SheetTitle>Content Settings</SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex flex-col overflow-hidden">
            {sidebarContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Render as fixed sidebar
  return (
    <div className="w-72 lg:w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden">
      {sidebarContent}
    </div>
  );
}

export default ContentSidebar;
