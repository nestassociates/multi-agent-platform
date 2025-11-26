'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createContentSchema, type CreateContentInput } from '@nest/validation';
import { Button, Input } from '@nest/ui';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { ImageUpload } from '@/components/agent/image-upload';
import { ContentPreview } from '@/components/agent/content-preview';
import { Eye } from 'lucide-react';
import { generateSlug } from '@/lib/slug-generator';

interface ContentFormProps {
  onSubmit: (data: CreateContentInput) => Promise<void>;
  onSaveDraft?: (data: Partial<CreateContentInput>) => Promise<void>;
  initialData?: Partial<CreateContentInput>;
  isSubmitting?: boolean;
}

const contentTypeOptions = [
  { value: 'blog_post', label: 'Blog Post' },
  { value: 'area_guide', label: 'Area Guide' },
];

export function ContentForm({
  onSubmit,
  onSaveDraft,
  initialData,
  isSubmitting = false,
}: ContentFormProps) {
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateContentInput>({
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
      ...initialData,
    },
  });

  const title = watch('title');
  const contentBody = watch('content_body');
  const contentType = watch('content_type');
  const excerpt = watch('excerpt');
  const featuredImageUrl = watch('featured_image_url');
  const seoMetaDescription = watch('seo_meta_description');

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setValue('title', newTitle);

    // Auto-generate slug if not manually set
    if (!watch('slug') || watch('slug') === generateSlug(title)) {
      setValue('slug', generateSlug(newTitle));
    }
  };

  // Handle rich text editor content change
  const handleContentBodyChange = (html: string) => {
    setValue('content_body', html, { shouldValidate: true });
  };

  // Handle image upload
  const handleImageUpload = (url: string) => {
    setValue('featured_image_url', url, { shouldValidate: true });
  };

  // Auto-save draft
  const handleAutoSave = async (html: string) => {
    if (!onSaveDraft) return;

    setAutoSaving(true);
    try {
      const formData = watch();
      await onSaveDraft({ ...formData, content_body: html });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  // Debug: Log form submission
  const handleFormSubmit = (data: CreateContentInput) => {
    console.log('Form submission data:', data);
    return onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-4xl">
      {/* Auto-save indicator */}
      {onSaveDraft && (
        <div className="flex items-center justify-end text-sm text-gray-500">
          {autoSaving && (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          )}
          {!autoSaving && lastSaved && (
            <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>
      )}

      {/* Content Type */}
      <div>
        <label htmlFor="content_type" className="block text-sm font-medium text-gray-700 mb-2">
          Content Type
        </label>
        <select
          {...register('content_type')}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
        >
          {contentTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.content_type && (
          <p className="mt-1 text-sm text-red-600">{errors.content_type.message}</p>
        )}
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <Input
          id="title"
          {...register('title')}
          onChange={handleTitleChange}
          placeholder="Enter content title"
          className="w-full"
        />
        <div className="mt-1 flex justify-between items-center">
          {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
          <span className="text-xs text-gray-500 ml-auto">{title?.length || 0}/100</span>
        </div>
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
          URL Slug
        </label>
        <Input
          id="slug"
          {...register('slug')}
          placeholder="auto-generated-from-title"
          className="w-full"
        />
        <p className="mt-1 text-xs text-gray-500">
          Auto-generated from title. Can be manually edited for SEO.
        </p>
        {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>}
      </div>

      {/* Content Body */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content <span className="text-red-500">*</span>
        </label>
        <div className="border rounded-lg overflow-hidden" style={{ width: '100%', minHeight: '600px', position: 'relative' }}>
          <style>{`
            .simple-editor-content {
              max-width: 100% !important;
              padding: 1rem !important;
            }
            .simple-editor-content .tiptap.ProseMirror.simple-editor {
              padding: 1rem !important;
            }
            .tiptap ::selection,
            .tiptap *::selection {
              background: #3b82f6 !important;
              color: white !important;
            }
            .ProseMirror-selectednode {
              outline: 2px solid #3b82f6 !important;
            }
          `}</style>
          <SimpleEditor
            initialContent={contentBody}
            onChange={handleContentBodyChange}
          />
        </div>
        {errors.content_body && (
          <p className="mt-1 text-sm text-red-600">{errors.content_body.message}</p>
        )}
      </div>

      {/* Excerpt */}
      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
          Excerpt (Optional)
        </label>
        <textarea
          {...register('excerpt')}
          id="excerpt"
          rows={3}
          placeholder="Brief summary of the content (shown in listings)"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
        />
        <div className="mt-1 flex justify-between items-center">
          {errors.excerpt && <p className="text-sm text-red-600">{errors.excerpt.message}</p>}
          <span className="text-xs text-gray-500 ml-auto">{excerpt?.length || 0}/250</span>
        </div>
      </div>

      {/* Featured Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Featured Image (Optional)
        </label>
        <ImageUpload
          onUpload={handleImageUpload}
          initialUrl={featuredImageUrl}
          bucket="content-images"
          contentType={contentType?.replace('_', '-') + 's'} // blog_post → blog-posts
        />
        {errors.featured_image_url && (
          <p className="mt-1 text-sm text-red-600">{errors.featured_image_url.message}</p>
        )}
      </div>

      {/* SEO Section */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings (Optional)</h3>

        {/* SEO Meta Title */}
        <div className="mb-4">
          <label htmlFor="seo_meta_title" className="block text-sm font-medium text-gray-700 mb-2">
            SEO Meta Title
          </label>
          <Input
            id="seo_meta_title"
            {...register('seo_meta_title')}
            placeholder="SEO-optimized title for search engines"
            className="w-full"
          />
          <div className="mt-1 flex justify-between items-center">
            {errors.seo_meta_title && (
              <p className="text-sm text-red-600">{errors.seo_meta_title.message}</p>
            )}
            <span className="text-xs text-gray-500 ml-auto">
              {watch('seo_meta_title')?.length || 0}/60
            </span>
          </div>
        </div>

        {/* SEO Meta Description */}
        <div>
          <label htmlFor="seo_meta_description" className="block text-sm font-medium text-gray-700 mb-2">
            SEO Meta Description
          </label>
          <textarea
            {...register('seo_meta_description')}
            id="seo_meta_description"
            rows={2}
            placeholder="Brief description for search engine results"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
          />
          <div className="mt-1 flex justify-between items-center">
            {errors.seo_meta_description && (
              <p className="text-sm text-red-600">{errors.seo_meta_description.message}</p>
            )}
            <span className="text-xs text-gray-500 ml-auto">
              {seoMetaDescription?.length || 0}/160
            </span>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit for Review'}
        </Button>
        {onSaveDraft && (
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit((data) => onSaveDraft(data))()}
            disabled={isSubmitting}
          >
            Save Draft
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowPreview(true)}
          disabled={isSubmitting}
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
      </div>

      {/* Preview Modal */}
      <ContentPreview
        title={title || 'Untitled Content'}
        content={contentBody || ''}
        featuredImage={featuredImageUrl}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </form>
  );
}

export default ContentForm;
