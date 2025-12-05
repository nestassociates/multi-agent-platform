'use client';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';

interface ContentModerationEditorProps {
  title: string;
  contentBody: string;
  onTitleChange: (title: string) => void;
  onContentChange: (html: string) => void;
}

export function ContentModerationEditor({
  title,
  contentBody,
  onTitleChange,
  onContentChange,
}: ContentModerationEditorProps) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* Title Input - Large, prominent, inline */}
      <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2 md:pb-4 border-b border-gray-100">
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          type="text"
          placeholder="Add title..."
          className="w-full text-2xl md:text-3xl font-bold text-gray-900 placeholder-gray-400 border-0 outline-none focus:ring-0 p-0 bg-transparent"
          style={{ caretColor: '#3b82f6' }}
        />
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
            onChange={onContentChange}
          />
        </div>
      </div>
    </div>
  );
}

export default ContentModerationEditor;
