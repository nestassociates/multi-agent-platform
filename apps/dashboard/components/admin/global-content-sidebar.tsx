'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Save, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { type GlobalContentType } from '@nest/validation';

interface GlobalContentSidebarProps {
  contentType: GlobalContentType;
  onSave: () => void;
  onPublish: () => void;
  isSaving: boolean;
  isPublishing: boolean;
  lastSaved: Date | null;
  hasUnpublishedChanges: boolean;
  activeAgentCount: number;
  isPublished: boolean;
  publishedAt: string | null;
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

const contentTypeLabels: Record<GlobalContentType, string> = {
  header: 'Header',
  footer: 'Footer',
  privacy_policy: 'Privacy Policy',
  terms_of_service: 'Terms of Service',
  cookie_policy: 'Cookie Policy',
  complaints_procedure: 'Complaints Procedure',
};

export function GlobalContentSidebar({
  contentType,
  onSave,
  onPublish,
  isSaving,
  isPublishing,
  lastSaved,
  hasUnpublishedChanges,
  activeAgentCount,
  isPublished,
  publishedAt,
  isMobile = false,
  isOpen = false,
  onOpenChange,
}: GlobalContentSidebarProps) {
  const sidebarContent = (
    <>
      {/* Header with save status */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          {isSaving && (
            <span className="flex items-center">
              <svg className="animate-spin mr-1 h-3 w-3 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          )}
          {!isSaving && lastSaved && (
            <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
          )}
          {!isSaving && !lastSaved && (
            <span>Not saved yet</span>
          )}
        </div>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Actions Section */}
        <SidebarSection title="Actions" defaultOpen={true}>
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                type="button"
                onClick={onSave}
                disabled={isSaving || isPublishing}
                variant="outline"
                className="w-full"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Draft
              </Button>
              <Button
                type="button"
                onClick={onPublish}
                disabled={isSaving || isPublishing}
                className="w-full"
              >
                {isPublishing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Publish
              </Button>
            </div>

            {/* Publish info */}
            <p className="text-xs text-gray-500">
              Publishing will update this content on all {activeAgentCount} active agent sites.
            </p>
          </div>
        </SidebarSection>

        {/* Status Section */}
        <SidebarSection title="Status" defaultOpen={true}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Published</span>
              <span className={`text-sm font-medium ${isPublished ? 'text-green-600' : 'text-amber-600'}`}>
                {isPublished ? 'Yes' : 'No'}
              </span>
            </div>
            {publishedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Published</span>
                <span className="text-sm text-gray-900">
                  {new Date(publishedAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {hasUnpublishedChanges && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2">
                <p className="text-xs text-amber-800">
                  You have unpublished changes that will not appear on agent sites until published.
                </p>
              </div>
            )}
          </div>
        </SidebarSection>

        {/* Info Section */}
        <SidebarSection title="Information" defaultOpen={false}>
          <div className="space-y-3">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Content Type</span>
              <p className="text-sm text-gray-900 mt-1">{contentTypeLabels[contentType]}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Affected Sites</span>
              <p className="text-sm text-gray-900 mt-1">{activeAgentCount} active agent sites</p>
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
            <SheetTitle>Page Settings</SheetTitle>
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

export default GlobalContentSidebar;
