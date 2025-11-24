'use client';

import { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  contentTitle: string;
}

export function ApprovalDialog({
  isOpen,
  onClose,
  onConfirm,
  contentTitle,
}: ApprovalDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      console.error('Error approving content:', err);
      setError(err.message || 'Failed to approve content. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Approve Content
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to approve this content for publication?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm font-medium text-gray-900 mb-2">Content Title:</p>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">
            {contentTitle}
          </p>

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p className="font-medium">This action will:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Mark the content as approved</li>
              <li>Send an approval email to the agent</li>
              <li>Queue the agent's site for rebuild</li>
              <li>Publish the content on their live site</li>
            </ul>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              <p className="text-sm font-medium">Approval Failed</p>
              <p className="text-sm">{error}</p>
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Content
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
