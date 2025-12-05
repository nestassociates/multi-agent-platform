'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Loader2, User, Calendar, FileText, Globe, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface ContentModerationSidebarProps {
  contentId: string;
  contentTitle: string;
  status: string;
  contentType: string;
  slug: string;
  excerpt?: string;
  featuredImageUrl?: string;
  agentName: string;
  agentEmail: string;
  subdomain: string;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  metaKeywords?: string[];
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
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

// Get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending_review':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function ContentModerationSidebar({
  contentId,
  contentTitle,
  status,
  contentType,
  slug,
  excerpt,
  featuredImageUrl,
  agentName,
  agentEmail,
  subdomain,
  createdAt,
  updatedAt,
  seoTitle,
  seoDescription,
  metaKeywords,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
  isMobile = false,
  isOpen = false,
  onOpenChange,
}: ContentModerationSidebarProps) {
  const sidebarContent = (
    <>
      {/* Header with status */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
          <Badge className={getStatusColor(status)}>
            {status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Actions Section - Only show if pending */}
        {status === 'pending_review' && (
          <SidebarSection title="Moderation Actions" defaultOpen={true}>
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={onApprove}
                  disabled={isApproving || isRejecting}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isApproving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve Content
                </Button>
                <Button
                  type="button"
                  onClick={onReject}
                  disabled={isApproving || isRejecting}
                  variant="destructive"
                  className="w-full"
                >
                  {isRejecting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject Content
                </Button>
              </div>

              {/* Info text */}
              <p className="text-xs text-gray-500">
                Approving will publish this content to the agent's site. Rejecting will send feedback to the agent.
              </p>
            </div>
          </SidebarSection>
        )}

        {/* Already moderated notice */}
        {status !== 'pending_review' && (
          <SidebarSection title="Status" defaultOpen={true}>
            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              <p className="text-sm text-gray-600">
                This content has already been{' '}
                <span className={status === 'approved' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {status === 'approved' ? 'approved' : 'rejected'}
                </span>{' '}
                and is no longer available for moderation.
              </p>
            </div>
          </SidebarSection>
        )}

        {/* Content Preview Section */}
        <SidebarSection title="Content Preview" defaultOpen={true}>
          <div className="space-y-3">
            {/* Featured Image */}
            {featuredImageUrl && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Featured Image</span>
                <img
                  src={featuredImageUrl}
                  alt={contentTitle}
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Slug */}
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Slug</span>
              <p className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">/{slug}</p>
            </div>

            {/* Excerpt */}
            {excerpt && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Excerpt</span>
                <p className="text-sm text-gray-700 leading-relaxed">{excerpt}</p>
              </div>
            )}
            {!excerpt && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Excerpt</span>
                <p className="text-sm text-gray-500 italic">No excerpt provided</p>
              </div>
            )}
          </div>
        </SidebarSection>

        {/* SEO Information Section */}
        <SidebarSection title="SEO Information" defaultOpen={true}>
          <div className="space-y-3">
            {seoTitle && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Search className="h-3 w-3 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">SEO Title</span>
                </div>
                <p className="text-sm text-gray-900">{seoTitle}</p>
              </div>
            )}
            {seoDescription && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">SEO Description</span>
                <p className="text-sm text-gray-700 leading-relaxed">{seoDescription}</p>
              </div>
            )}
            {metaKeywords && metaKeywords.length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Keywords</span>
                <div className="flex flex-wrap gap-1.5">
                  {metaKeywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {!seoTitle && !seoDescription && (!metaKeywords || metaKeywords.length === 0) && (
              <p className="text-sm text-gray-500 italic">No SEO information provided</p>
            )}
          </div>
        </SidebarSection>

        {/* Agent Information Section */}
        <SidebarSection title="Agent Information" defaultOpen={true}>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">Agent Name</span>
                <p className="text-sm text-gray-900 mt-0.5">{agentName}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">Email</span>
                <p className="text-sm text-gray-900 mt-0.5">{agentEmail}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">Subdomain</span>
                <p className="text-sm text-gray-900 mt-0.5">{subdomain}</p>
              </div>
            </div>
          </div>
        </SidebarSection>

        {/* Content Information Section */}
        <SidebarSection title="Content Details" defaultOpen={false}>
          <div className="space-y-3">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">Content Type</span>
              <p className="text-sm text-gray-900 mt-0.5 capitalize">{contentType}</p>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">Submitted</span>
                <p className="text-sm text-gray-900 mt-0.5">{createdAt}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">Last Updated</span>
                <p className="text-sm text-gray-900 mt-0.5">{updatedAt}</p>
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
            <SheetTitle>Review Details</SheetTitle>
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

export default ContentModerationSidebar;
