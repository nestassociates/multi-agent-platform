'use client';

import { UseFormReturn } from 'react-hook-form';
import { CreateContentInput } from '@nest/validation';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { generateSlug } from '@/lib/slug-generator';

interface ContentEditorProps {
  form: UseFormReturn<CreateContentInput>;
}

export function ContentEditor({ form }: ContentEditorProps) {
  const { register, watch, setValue, formState: { errors } } = form;

  const title = watch('title');
  const contentBody = watch('content_body');
  const slug = watch('slug');

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setValue('title', newTitle);

    // Auto-generate slug if not manually set or if it matches the old auto-generated slug
    if (!slug || slug === generateSlug(title)) {
      setValue('slug', generateSlug(newTitle));
    }
  };

  // Handle rich text editor content change
  const handleContentBodyChange = (html: string) => {
    setValue('content_body', html, { shouldValidate: true });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* Title Input - Large, prominent, inline */}
      <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2 md:pb-4 border-b border-gray-100">
        <input
          {...register('title')}
          onChange={handleTitleChange}
          type="text"
          placeholder="Add title..."
          className="w-full text-2xl md:text-3xl font-bold text-gray-900 placeholder-gray-400 border-0 outline-none focus:ring-0 p-0 bg-transparent"
          style={{ caretColor: '#3b82f6' }}
        />
        {errors.title && (
          <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
        )}
        <div className="mt-1 text-xs text-gray-400">
          {title?.length || 0}/100 characters
        </div>
      </div>

      {/* Editor Area - Full remaining height */}
      <div className="flex-1 overflow-hidden">
        <style>{`
          .content-editor-container .simple-editor-wrapper {
            height: 100%;
          }
          .content-editor-container .simple-editor-content {
            max-width: 100%;
            padding: 0 1rem;
          }
          @media (min-width: 768px) {
            .content-editor-container .simple-editor-content {
              padding: 0 2rem;
            }
          }
          .content-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor {
            padding: 1rem 0 30vh;
          }
          @media (min-width: 768px) {
            .content-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor {
              padding: 1.5rem 0 30vh;
            }
          }
          .content-editor-container .tiptap ::selection,
          .content-editor-container .tiptap *::selection {
            background: #3b82f6 !important;
            color: white !important;
          }
          .content-editor-container .ProseMirror-selectednode {
            outline: 2px solid #3b82f6 !important;
          }
          /* Placeholder styling */
          .content-editor-container .tiptap p.is-editor-empty:first-child::before {
            color: #9ca3af;
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
        `}</style>
        <div className="content-editor-container h-full">
          <SimpleEditor
            initialContent={contentBody}
            onChange={handleContentBodyChange}
          />
        </div>
        {errors.content_body && (
          <p className="px-8 py-2 text-sm text-red-600">{errors.content_body.message}</p>
        )}
      </div>
    </div>
  );
}

export default ContentEditor;
