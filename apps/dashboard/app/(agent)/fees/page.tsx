'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, ArrowLeft, Settings, PoundSterling } from 'lucide-react';
import Link from 'next/link';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export default function FeesPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      const response = await fetch('/api/agent/fees');
      const data = await response.json();

      if (data.fees?.content_body) {
        setContent(data.fees.content_body);
        setEditorContent(data.fees.content_body);
      }
    } catch (error) {
      console.error('Error fetching fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch('/api/agent/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_body: editorContent }),
      });

      if (response.ok) {
        setContent(editorContent);
        router.refresh();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save');
      }
    } catch (error: any) {
      console.error('Error saving fee structure:', error);
      alert(error.message || 'Failed to save fee structure');
    } finally {
      setSaving(false);
    }
  };

  // Sidebar content component
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Info Section */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <PoundSterling className="h-5 w-5 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Fee Structure</h3>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Create your fee structure using the rich text editor. This will be displayed on your public agent website for potential clients to view.
        </p>
      </div>

      {/* Tips Section */}
      <div className="px-4 py-4 border-b border-gray-200 flex-1">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Tips</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">•</span>
            <span>Use tables for clear pricing breakdowns</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">•</span>
            <span>Include any additional charges or VAT information</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">•</span>
            <span>Keep it clear and easy to understand</span>
          </li>
        </ul>
      </div>

      {/* Save Button Section */}
      <div className="px-4 py-4 mt-auto border-t border-gray-200 bg-gray-50">
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? 'Saving...' : 'Save Fee Structure'}
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 md:gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <span className="text-gray-300 hidden md:inline">|</span>
          <h1 className="text-base md:text-lg font-semibold text-gray-900 hidden md:block">
            Fee Structure
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isMobile && (
            <Button variant="outline" size="sm" onClick={() => setSidebarOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area - 2 Column Layout on desktop */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Column - Full width like content editor */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
          <div className="flex-1 overflow-hidden fees-editor-container">
            <style>{`
              .fees-editor-container .simple-editor-wrapper {
                height: 100%;
              }
              .fees-editor-container .simple-editor-content {
                max-width: 100%;
                padding: 0 1rem;
              }
              @media (min-width: 768px) {
                .fees-editor-container .simple-editor-content {
                  padding: 0 2rem;
                }
              }
              .fees-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor {
                padding: 1rem 0 30vh;
              }
              @media (min-width: 768px) {
                .fees-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor {
                  padding: 1.5rem 0 30vh;
                }
              }
            `}</style>
            <SimpleEditor
              initialContent={content}
              onChange={(html) => setEditorContent(html)}
            />
          </div>
        </div>

        {/* Sidebar Column - hidden on mobile */}
        {!isMobile && (
          <div className="w-72 lg:w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden">
            <SidebarContent />
          </div>
        )}
      </div>

      {/* Mobile Sidebar Sheet */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="right" className="w-[85vw] max-w-[400px] p-0 flex flex-col">
            <SheetHeader className="px-4 py-3 border-b border-gray-200 shrink-0">
              <SheetTitle>Fee Structure</SheetTitle>
            </SheetHeader>
            <div className="flex-1 flex flex-col overflow-hidden">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
