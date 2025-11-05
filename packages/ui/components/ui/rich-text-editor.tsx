'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useEffect } from 'react';
import { cn } from '../../lib/utils';

interface RichTextEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  onSave?: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  autoSave?: boolean;
  autoSaveInterval?: number; // in milliseconds
}

interface MenuBarProps {
  editor: Editor | null;
}

function MenuBar({ editor }: MenuBarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1">
      {/* Headings */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(
          'px-3 py-1 text-sm font-medium rounded hover:bg-gray-200 transition',
          editor.isActive('heading', { level: 1 })
            ? 'bg-gray-300 text-gray-900'
            : 'text-gray-700'
        )}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          'px-3 py-1 text-sm font-medium rounded hover:bg-gray-200 transition',
          editor.isActive('heading', { level: 2 })
            ? 'bg-gray-300 text-gray-900'
            : 'text-gray-700'
        )}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={cn(
          'px-3 py-1 text-sm font-medium rounded hover:bg-gray-200 transition',
          editor.isActive('heading', { level: 3 })
            ? 'bg-gray-300 text-gray-900'
            : 'text-gray-700'
        )}
      >
        H3
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Text formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          'px-3 py-1 text-sm font-bold rounded hover:bg-gray-200 transition',
          editor.isActive('bold')
            ? 'bg-gray-300 text-gray-900'
            : 'text-gray-700'
        )}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          'px-3 py-1 text-sm italic rounded hover:bg-gray-200 transition',
          editor.isActive('italic')
            ? 'bg-gray-300 text-gray-900'
            : 'text-gray-700'
        )}
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={cn(
          'px-3 py-1 text-sm line-through rounded hover:bg-gray-200 transition',
          editor.isActive('strike')
            ? 'bg-gray-300 text-gray-900'
            : 'text-gray-700'
        )}
      >
        S
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Lists */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          'px-3 py-1 text-sm rounded hover:bg-gray-200 transition',
          editor.isActive('bulletList')
            ? 'bg-gray-300 text-gray-900'
            : 'text-gray-700'
        )}
      >
        • List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          'px-3 py-1 text-sm rounded hover:bg-gray-200 transition',
          editor.isActive('orderedList')
            ? 'bg-gray-300 text-gray-900'
            : 'text-gray-700'
        )}
      >
        1. List
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Blockquote */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(
          'px-3 py-1 text-sm rounded hover:bg-gray-200 transition',
          editor.isActive('blockquote')
            ? 'bg-gray-300 text-gray-900'
            : 'text-gray-700'
        )}
      >
        &ldquo; Quote
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Horizontal rule */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="px-3 py-1 text-sm text-gray-700 rounded hover:bg-gray-200 transition"
      >
        ─ Rule
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Undo/Redo */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="px-3 py-1 text-sm text-gray-700 rounded hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ↶ Undo
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="px-3 py-1 text-sm text-gray-700 rounded hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ↷ Redo
      </button>
    </div>
  );
}

export function RichTextEditor({
  content = '',
  onChange,
  onSave,
  placeholder = 'Start writing...',
  editable = true,
  className,
  autoSave = false,
  autoSaveInterval = 30000, // 30 seconds default
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[300px] p-4',
          !editable && 'cursor-default'
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
  });

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !editor || !onSave) return;

    const interval = setInterval(() => {
      const html = editor.getHTML();
      // Only save if there's actual content (not just empty paragraph)
      if (html !== '<p></p>' && html.trim() !== '') {
        onSave(html);
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [autoSave, editor, onSave, autoSaveInterval]);

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        'border border-gray-300 rounded-lg overflow-hidden bg-white',
        className
      )}
    >
      {editable && <MenuBar editor={editor} />}
      <div className={cn(!editable && 'p-4')}>
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>
    </div>
  );
}

export default RichTextEditor;
