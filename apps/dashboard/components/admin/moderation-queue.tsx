'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ApprovalDialog } from '@/components/admin/approval-dialog';

interface Content {
  id: string;
  agent_id: string;
  content_type: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
  agent?: {
    id: string;
    profile: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

interface ModerationQueueProps {
  content: Content[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onRefresh?: () => void;
}

const contentTypeLabels = {
  blog_post: 'Blog Post',
  area_guide: 'Area Guide',
  review: 'Customer Review',
  fee_structure: 'Fee Structure',
};

export function ModerationQueue({
  content,
  onApprove,
  onReject,
  onRefresh,
}: ModerationQueueProps) {
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  const handleApproveClick = (item: Content) => {
    setSelectedContent(item);
    setShowApprovalDialog(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedContent) return;

    setIsProcessing(true);
    try {
      await onApprove(selectedContent.id);
      setShowApprovalDialog(false);
      setSelectedContent(null);
      onRefresh?.();
    } catch (error) {
      console.error('Error approving content:', error);
      throw error; // Let ApprovalDialog handle the error display
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClick = (item: Content) => {
    setSelectedContent(item);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedContent) return;

    if (rejectionReason.trim().length < 10) {
      alert('Rejection reason must be at least 10 characters');
      return;
    }

    setIsProcessing(true);
    try {
      await onReject(selectedContent.id, rejectionReason);
      setShowRejectModal(false);
      setSelectedContent(null);
      setRejectionReason('');
      onRefresh?.();
    } catch (error) {
      console.error('Error rejecting content:', error);
      alert('Failed to reject content');
    } finally {
      setIsProcessing(false);
    }
  };

  if (content.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-muted-foreground mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No pending content</h3>
          <p className="text-muted-foreground">All content has been reviewed. Check back later!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Moderation Queue</CardTitle>
          <CardDescription>
            {content.length} {content.length === 1 ? 'item' : 'items'} pending review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {content.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.slug}</div>
                  </TableCell>
                  <TableCell>
                    {item.agent?.profile ? (
                      <div>
                        <div className="font-medium">
                          {item.agent.profile.first_name} {item.agent.profile.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">{item.agent.profile.email}</div>
                      </div>
                    ) : (
                      'Unknown'
                    )}
                  </TableCell>
                  <TableCell>
                    {contentTypeLabels[item.content_type as keyof typeof contentTypeLabels]}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link
                      href={`/content-moderation/${item.id}`}
                      className="text-primary hover:underline"
                    >
                      Review
                    </Link>
                    <Button
                      onClick={() => handleApproveClick(item)}
                      disabled={isProcessing}
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleRejectClick(item)}
                      disabled={isProcessing}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <ApprovalDialog
        isOpen={showApprovalDialog}
        onClose={() => {
          setShowApprovalDialog(false);
          setSelectedContent(null);
        }}
        onConfirm={handleApproveConfirm}
        contentTitle={selectedContent?.title || ''}
      />

      {/* Rejection Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Content</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this content. The agent will see this message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              placeholder="e.g., Content contains factual errors or violates guidelines..."
            />
            <div className="text-xs text-muted-foreground">
              {rejectionReason.length}/500 characters (minimum 10)
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowRejectModal(false);
                setSelectedContent(null);
                setRejectionReason('');
              }}
              disabled={isProcessing}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectSubmit}
              disabled={isProcessing || rejectionReason.trim().length < 10}
              variant="destructive"
            >
              {isProcessing ? 'Rejecting...' : 'Reject Content'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ModerationQueue;
