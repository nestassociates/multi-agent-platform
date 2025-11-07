'use client';

import React, { useEffect, useCallback } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
} from 'lucide-react';

export interface RichTextEditorProps {
  /**
   * Initial content (HTML string)
   */
  content?: string;

  /**
   * Callback when content changes
   */
  onChange?: (html: string) => void;

  /**
   * Auto-save interval in milliseconds (default: 30000 = 30 seconds)
   * Set to 0 to disable auto-save
   */
  autoSaveInterval?: number;

  /**
   * Callback for auto-save
   */
  onAutoSave?: (html: string) => void;

  /**
   * Callback for image upload
   * Should return the URL of the uploaded image
   */
  onImageUpload?: (file: File) => Promise<string>;

  /**
   * Character limit (optional)
   */
  maxLength?: number;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Read-only mode
   */
  readOnly?: boolean;
}

/**
 * Rich Text Editor Component
 * Built with Tiptap (ProseMirror-based editor)
 *
 * Features:
 * - Bold, Italic, Underline formatting
 * - Headings (H1-H3)
 * - Bullet lists, Numbered lists
 * - Blockquotes
 * - Links
 * - Images (with upload support)
 * - Auto-save (configurable interval)
 * - Character counter
 * - Undo/Redo
 */
export function RichTextEditor({
  content = '',
  onChange,
  autoSaveInterval = 30000,
  onAutoSave,
  onImageUpload,
  maxLength,
  placeholder = 'Start writing...',
  className = '',
  readOnly = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
  });

  // Auto-save effect
  useEffect(() => {
    if (!editor || !onAutoSave || autoSaveInterval === 0) {
      return;
    }

    const interval = setInterval(() => {
      const html = editor.getHTML();
      onAutoSave(html);
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [editor, onAutoSave, autoSaveInterval]);

  // Handle image upload
  const handleImageUpload = useCallback(async () => {
    if (!onImageUpload || !editor) {
      return;
    }

    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const url = await onImageUpload(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (error) {
        console.error('Image upload failed:', error);
        alert('Failed to upload image. Please try again.');
      }
    };

    input.click();
  }, [editor, onImageUpload]);

  // Handle add link
  const handleAddLink = useCallback(() => {
    if (!editor) return;

    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().toggleLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  const characterCount = editor.storage.characterCount?.characters() || 0;
  const isMaxLengthReached = maxLength ? characterCount >= maxLength : false;

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
          {/* Text Formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Blockquote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Media & Links */}
          <ToolbarButton
            onClick={handleAddLink}
            isActive={editor.isActive('link')}
            title="Add Link"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>

          {onImageUpload && (
            <ToolbarButton onClick={handleImageUpload} title="Upload Image">
              <ImageIcon className="h-4 w-4" />
            </ToolbarButton>
          )}

          <ToolbarDivider />

          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className={`prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none ${
          readOnly ? 'bg-gray-50' : ''
        }`}
      />

      {/* Character Counter */}
      {maxLength && (
        <div className="border-t p-2 text-sm text-gray-600 text-right">
          <span className={isMaxLengthReached ? 'text-red-600 font-semibold' : ''}>
            {characterCount}
          </span>{' '}
          / {maxLength} characters
          {isMaxLengthReached && (
            <span className="text-red-600 ml-2">Maximum length reached</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Toolbar Button Component
 */
function ToolbarButton({
  children,
  onClick,
  isActive = false,
  disabled = false,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded hover:bg-gray-200 transition-colors ${
        isActive ? 'bg-gray-300 text-blue-600' : 'text-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );
}

/**
 * Toolbar Divider
 */
function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-300 mx-1" />;
}
