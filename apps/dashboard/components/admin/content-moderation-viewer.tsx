'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ContentModerationSidebar } from '@/components/admin/content-moderation-sidebar';
import { ContentModerationEditor } from '@/components/admin/content-moderation-editor';
import { ApprovalDialog } from '@/components/admin/approval-dialog';
import { useIsMobile } from '@/hooks/use-mobile';

interface Content {
  id: string;
  agent_id: string;
  content_type: string;
  title: string;
  slug: string;
  excerpt?: string;
  content_body?: string;
  seo_meta_title?: string;
  seo_meta_description?: string;
  meta_keywords?: string[];
  status: string;
  featured_image_url?: string;
  created_at: string;
  updated_at: string;
  agent?: {
    id: string;
    subdomain: string;
    user_id?: string;
    profiles?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

interface ContentModerationViewerProps {
  content: Content;
}

export function ContentModerationViewer({ content }: ContentModerationViewerProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Editable fields
  const [title, setTitle] = useState(content.title);
  const [contentBody, setContentBody] = useState(content.content_body || '');

  // Format dates
  const createdDate = new Date(content.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updatedDate = new Date(content.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const agentName = content.agent?.profiles
    ? `${content.agent.profiles.first_name} ${content.agent.profiles.last_name}`
    : 'Unknown Agent';

  const agentEmail = content.agent?.profiles?.email || 'No email';
  const subdomain = content.agent?.subdomain || 'Unknown';

  const handleContentChange = (html: string) => {
    setContentBody(html);
    setHasChanges(true);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/content/${content.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content_body: contentBody,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to save content');
      }

      setHasChanges(false);
      router.refresh();
    } catch (err: any) {
      console.error('Error saving content:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    // Save any changes first
    if (hasChanges) {
      await handleSave();
    }

    setIsApproving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/content/${content.id}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to approve content');
      }

      // Redirect back to moderation queue
      router.push('/content-moderation');
      router.refresh();
    } catch (err: any) {
      console.error('Error approving content:', err);
      setError(err.message);
      throw err; // Re-throw for ApprovalDialog to handle
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    if (rejectionReason.trim().length < 10) {
      setError('Rejection reason must be at least 10 characters');
      return;
    }

    setIsRejecting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/content/${content.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to reject content');
      }

      // Redirect back to moderation queue
      router.push('/content-moderation');
      router.refresh();
    } catch (err: any) {
      console.error('Error rejecting content:', err);
      setError(err.message);
      setIsRejecting(false);
    }
  };

  return (
    <>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              href="/content-moderation"
              className="flex items-center gap-1 md:gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Moderation Queue</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <span className="text-gray-300 hidden md:inline">|</span>
            <h1 className="text-base md:text-lg font-semibold text-gray-900 hidden md:block">
              Review Content
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Save Changes
              </Button>
            )}
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
                Review
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

        {/* Unsaved changes banner */}
        {hasChanges && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200">
            <p className="text-sm text-amber-800">You have unsaved changes</p>
          </div>
        )}

        {/* Main Content Area - 2 Column Layout on desktop, single column on mobile */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor Column */}
          <ContentModerationEditor
            title={title}
            contentBody={contentBody}
            onTitleChange={handleTitleChange}
            onContentChange={handleContentChange}
          />

          {/* Sidebar Column - hidden on mobile, visible in sheet */}
          {!isMobile && (
            <ContentModerationSidebar
              contentId={content.id}
              contentTitle={content.title}
              status={content.status}
              contentType={content.content_type}
              slug={content.slug}
              excerpt={content.excerpt}
              featuredImageUrl={content.featured_image_url}
              agentName={agentName}
              agentEmail={agentEmail}
              subdomain={subdomain}
              createdAt={createdDate}
              updatedAt={updatedDate}
              seoTitle={content.seo_meta_title}
              seoDescription={content.seo_meta_description}
              metaKeywords={content.meta_keywords}
              onApprove={() => setShowApprovalDialog(true)}
              onReject={() => setShowRejectDialog(true)}
              isApproving={isApproving}
              isRejecting={isRejecting}
            />
          )}
        </div>

        {/* Mobile Sidebar Sheet */}
        {isMobile && (
          <ContentModerationSidebar
            contentId={content.id}
            contentTitle={content.title}
            status={content.status}
            contentType={content.content_type}
            slug={content.slug}
            excerpt={content.excerpt}
            featuredImageUrl={content.featured_image_url}
            agentName={agentName}
            agentEmail={agentEmail}
            subdomain={subdomain}
            createdAt={createdDate}
            updatedAt={updatedDate}
            seoTitle={content.seo_meta_title}
            seoDescription={content.seo_meta_description}
            metaKeywords={content.meta_keywords}
            onApprove={() => setShowApprovalDialog(true)}
            onReject={() => setShowRejectDialog(true)}
            isApproving={isApproving}
            isRejecting={isRejecting}
            isMobile
            isOpen={sidebarOpen}
            onOpenChange={setSidebarOpen}
          />
        )}
      </div>

      {/* Approval Dialog */}
      <ApprovalDialog
        isOpen={showApprovalDialog}
        onClose={() => setShowApprovalDialog(false)}
        onConfirm={handleApprove}
        contentTitle={content.title}
      />

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Content</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this content. This will be sent to the agent so
              they can improve their submission.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Explain why this content is being rejected... (minimum 10 characters)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={5}
                disabled={isRejecting}
              />
              <p className="text-xs text-gray-500">
                {rejectionReason.length}/500 characters {rejectionReason.length < 10 && '(minimum 10)'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
                setError(null);
              }}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || rejectionReason.trim().length < 10}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject Content'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ContentModerationViewer;
